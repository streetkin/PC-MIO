"""
DesignPen Qt Framework Adapter
Provides deep runtime inspection, fluid component dragging, and inline text editing
for PyQt6 / PySide6 native applications.
"""
from typing import Any, List, Optional, Tuple
from PyQt6.QtCore import QEvent, QObject, QPoint, QRect, Qt
from PyQt6.QtGui import QCursor
from PyQt6.QtWidgets import QApplication, QLabel, QLineEdit, QPushButton, QWidget

from designpen.adapters.base import BaseAdapter
from designpen.cursor import create_pen_cursor
from designpen.exporter import LayoutExporter
from designpen.overlay import DesignPenOverlay


class QtAdapter(BaseAdapter, QObject):
    """
    Adapter connecting DesignPen to Qt native desktop applications.
    Intercepts window events, manages the visual overlay, handles real-time widget dragging,
    and provides in-place text editing.
    """

    def __init__(self, target_window: QWidget):
        BaseAdapter.__init__(self, target_window)
        QObject.__init__(self)

        self.target_window: QWidget = target_window
        self.overlay = DesignPenOverlay(target_window)
        self.exporter = LayoutExporter(target_window)
        self.pen_cursor = create_pen_cursor()

        self._is_dragging = False
        self._drag_start_mouse: QPoint = QPoint()
        self._drag_widget_start_pos: QPoint = QPoint()
        self._selected_widget: Optional[QWidget] = None
        self._active_text_editor: Optional[QLineEdit] = None

        # Callbacks for Toolbar dynamic updates
        self.on_widget_inspected = None
        self.on_history_changed = None

        # Undo history: list of tuples (action_type, widget, old_val, new_val)
        self._history: List[Tuple[str, QWidget, Any, Any]] = []

        # Install event filter on application and window
        self.target_window.installEventFilter(self)
        app = QApplication.instance()
        if app:
            app.installEventFilter(self)

    def set_active(self, active: bool) -> None:
        """Toggle Design Mode on or off."""
        self.is_active = active
        if active:
            self.overlay.show()
            self.overlay.sync_geometry()
            self.target_window.setCursor(self.pen_cursor)
        else:
            self.overlay.set_hovered_widget(None)
            self.overlay.set_selected_widget(None)
            self._selected_widget = None
            self._is_dragging = False
            self.overlay.hide()
            self.target_window.unsetCursor()
            self._close_text_editor(save=False)

    def undo(self) -> bool:
        """Reverts the last drag or text edit action."""
        if not self._history:
            return False

        action_type, widget, old_val, new_val = self._history.pop()
        if self.on_history_changed:
            self.on_history_changed(len(self._history))

        if action_type == "move":
            widget.move(old_val)
            self.exporter.record_move(widget, (new_val.x(), new_val.y()), (old_val.x(), old_val.y()))
            if self._selected_widget == widget:
                self.overlay.update()
                if self.on_widget_inspected:
                    self.on_widget_inspected(widget, widget.x(), widget.y())
            return True
        elif action_type == "text":
            if hasattr(widget, "setText"):
                widget.setText(old_val)
                self.exporter.record_text_change(widget, new_val, old_val)
                if self._selected_widget == widget:
                    self.overlay.update()
                return True
        return False

    def export_layout(self, file_path: str = "designpen_layout.json") -> str:
        """Exports tracked layout edits to JSON."""
        return self.exporter.export_to_json(file_path)

    def eventFilter(self, watched: QObject, event: QEvent) -> bool:
        """Intercepts input events on the target window when Design Mode is active."""
        if not self.is_active:
            return super().eventFilter(watched, event)

        # Keep overlay sized to window
        if event.type() == QEvent.Type.Resize and watched == self.target_window:
            self.overlay.sync_geometry()
            return False

        # Only process mouse events targeted at or within the target window
        if not isinstance(watched, QWidget):
            return super().eventFilter(watched, event)

        # Ignore events inside our own active inline text editor
        if self._active_text_editor and (watched == self._active_text_editor or self._active_text_editor.isAncestorOf(watched)):
            return False

        # Mouse Move
        if event.type() == QEvent.Type.MouseMove:
            return self._handle_mouse_move(event)

        # Mouse Press
        elif event.type() == QEvent.Type.MouseButtonPress:
            if event.button() == Qt.MouseButton.LeftButton:
                return self._handle_mouse_press(event)

        # Mouse Release
        elif event.type() == QEvent.Type.MouseButtonRelease:
            if event.button() == Qt.MouseButton.LeftButton:
                return self._handle_mouse_release(event)

        # Mouse Double Click (Text Editing)
        elif event.type() == QEvent.Type.MouseButtonDblClick:
            if event.button() == Qt.MouseButton.LeftButton:
                return self._handle_double_click(event)

        return super().eventFilter(watched, event)

    def _resolve_target_widget(self, global_pos: QPoint) -> Optional[QWidget]:
        """Resolves the valid draggable widget under the given global mouse position."""
        local_pos = self.target_window.mapFromGlobal(global_pos)
        child = self.target_window.childAt(local_pos)

        # Skip overlay and invalid widgets
        if not child or child == self.overlay or child == self.target_window:
            return None

        # If child is part of an inline text editor, skip
        if self._active_text_editor and (child == self._active_text_editor or self._active_text_editor.isAncestorOf(child)):
            return None

        return child

    def _handle_mouse_move(self, event) -> bool:
        global_pos = QCursor.pos()

        if self._is_dragging and self._selected_widget:
            delta = global_pos - self._drag_start_mouse
            new_pos = self._drag_widget_start_pos + delta

            # Move widget
            self._selected_widget.move(new_pos)
            self._selected_widget.raise_()
            self.overlay.sync_geometry()
            if self.on_widget_inspected:
                self.on_widget_inspected(self._selected_widget, new_pos.x(), new_pos.y())
            return True

        # When not dragging, update hover box
        hover_target = self._resolve_target_widget(global_pos)
        self.overlay.set_hovered_widget(hover_target)
        return False

    def _handle_mouse_press(self, event) -> bool:
        global_pos = QCursor.pos()
        target = self._resolve_target_widget(global_pos)

        # Close any open text editor
        self._close_text_editor(save=True)

        if target:
            self._selected_widget = target
            self.overlay.set_selected_widget(target)
            self._is_dragging = True
            self._drag_start_mouse = global_pos
            self._drag_widget_start_pos = target.pos()
            if self.on_widget_inspected:
                self.on_widget_inspected(target, target.x(), target.y())
            return True

        # Clicked empty background: deselect
        self._selected_widget = None
        self.overlay.set_selected_widget(None)
        if self.on_widget_inspected:
            self.on_widget_inspected(None, 0, 0)
        return False

    def _handle_mouse_release(self, event) -> bool:
        if self._is_dragging and self._selected_widget:
            self._is_dragging = False
            current_pos = self._selected_widget.pos()
            if current_pos != self._drag_widget_start_pos:
                # Record move in history and exporter
                self._history.append(("move", self._selected_widget, self._drag_widget_start_pos, current_pos))
                if self.on_history_changed:
                    self.on_history_changed(len(self._history))
                self.exporter.record_move(
                    self._selected_widget,
                    (self._drag_widget_start_pos.x(), self._drag_widget_start_pos.y()),
                    (current_pos.x(), current_pos.y())
                )
            self.overlay.sync_geometry()
            return True
        return False

    def _handle_double_click(self, event) -> bool:
        global_pos = QCursor.pos()
        target = self._resolve_target_widget(global_pos)

        if target and hasattr(target, "text") and hasattr(target, "setText"):
            self._open_inline_text_editor(target)
            return True
        return False

    def _open_inline_text_editor(self, widget: QWidget) -> None:
        """Launches an in-place QLineEdit positioned directly on top of the text widget."""
        self._close_text_editor(save=True)

        current_text = widget.text() if hasattr(widget, "text") else ""

        editor = QLineEdit(self.target_window)
        editor.setText(current_text)
        editor.setFont(widget.font())

        # Map widget coordinate to target_window
        top_left = widget.mapTo(self.target_window, QPoint(0, 0))
        editor.setGeometry(top_left.x(), top_left.y(), max(widget.width(), 80), max(widget.height(), 26))

        # Modern editor styling
        editor.setStyleSheet("""
            QLineEdit {
                background: #ffffff;
                color: #111827;
                border: 2px solid #0d99ff;
                border-radius: 4px;
                padding: 2px 6px;
                selection-background-color: #0d99ff;
            }
        """)

        editor.setFocus()
        editor.selectAll()
        editor.show()
        editor.raise_()

        # Connect finish signals
        editor.returnPressed.connect(lambda: self._finish_text_edit(widget, editor, save=True))
        self._active_text_editor = editor

    def _finish_text_edit(self, widget: QWidget, editor: QLineEdit, save: bool) -> None:
        if save and hasattr(widget, "setText"):
            old_text = widget.text()
            new_text = editor.text()
            if old_text != new_text:
                widget.setText(new_text)
                self._history.append(("text", widget, old_text, new_text))
                if self.on_history_changed:
                    self.on_history_changed(len(self._history))
                self.exporter.record_text_change(widget, old_text, new_text)
                self.overlay.update()

        editor.deleteLater()
        if self._active_text_editor == editor:
            self._active_text_editor = None

    def _close_text_editor(self, save: bool = True) -> None:
        if self._active_text_editor:
            editor = self._active_text_editor
            if self._selected_widget and save:
                self._finish_text_edit(self._selected_widget, editor, save=True)
            else:
                editor.deleteLater()
                self._active_text_editor = None
