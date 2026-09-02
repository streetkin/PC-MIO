"""
DesignPen Selection & Highlight Overlay
A transparent, non-blocking visual canvas that renders Figma-style bounding boxes,
dimension badges, and selection handles over native widgets.
"""
from typing import Optional
from PyQt6.QtCore import QPoint, QRect, Qt
from PyQt6.QtGui import QColor, QFont, QPainter, QPen
from PyQt6.QtWidgets import QWidget


class DesignPenOverlay(QWidget):
    """
    Transparent overlay widget covering the target window.
    Renders hover bounds, active selection borders, corner handles,
    and dimension/tag information badges.
    """

    def __init__(self, parent: Optional[QWidget] = None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_TransparentForMouseEvents, True)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setFocusPolicy(Qt.FocusPolicy.NoFocus)

        self._hovered_widget: Optional[QWidget] = None
        self._selected_widget: Optional[QWidget] = None

        if parent:
            self.setGeometry(0, 0, parent.width(), parent.height())
            self.raise_()

    def set_hovered_widget(self, widget: Optional[QWidget]) -> None:
        if self._hovered_widget != widget:
            self._hovered_widget = widget
            self.update()

    def set_selected_widget(self, widget: Optional[QWidget]) -> None:
        if self._selected_widget != widget:
            self._selected_widget = widget
            self.update()

    def sync_geometry(self) -> None:
        """Keep overlay geometry perfectly matched with parent window."""
        if self.parent():
            p: QWidget = self.parent()
            if self.geometry() != p.rect():
                self.setGeometry(0, 0, p.width(), p.height())
                self.raise_()
        self.update()

    def paintEvent(self, event) -> None:
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        # 1. Draw Hover Box (Subtle dashed outline)
        if self._hovered_widget and self._hovered_widget != self._selected_widget and self._hovered_widget.isVisible():
            hover_rect = self._get_relative_rect(self._hovered_widget)
            if hover_rect:
                pen = QPen(QColor(13, 153, 255, 160), 1.5, Qt.PenStyle.DashLine)
                painter.setPen(pen)
                painter.setBrush(QColor(13, 153, 255, 20))
                painter.drawRoundedRect(hover_rect, 3, 3)

        # 2. Draw Selected Box (Solid Figma-style outline + handles + badge)
        if self._selected_widget and self._selected_widget.isVisible():
            sel_rect = self._get_relative_rect(self._selected_widget)
            if sel_rect:
                # Solid bounding box
                pen = QPen(QColor("#0d99ff"), 2, Qt.PenStyle.SolidLine)
                painter.setPen(pen)
                painter.setBrush(QColor(13, 153, 255, 30))
                painter.drawRoundedRect(sel_rect, 4, 4)

                # Corner handles (4 white squares with blue borders)
                self._draw_handles(painter, sel_rect)

                # Info badge (Tag name, dimensions, coordinates)
                self._draw_badge(painter, sel_rect, self._selected_widget)

        painter.end()

    def _get_relative_rect(self, target_widget: QWidget) -> Optional[QRect]:
        """Calculates widget geometry relative to the overlay's coordinate space."""
        if not target_widget or not self.parent():
            return None
        try:
            top_left = target_widget.mapTo(self.parent(), QPoint(0, 0))
            return QRect(top_left.x(), top_left.y(), target_widget.width(), target_widget.height())
        except Exception:
            return None

    def _draw_handles(self, painter: QPainter, rect: QRect) -> None:
        """Draws 4 small Figma-style control handles at the corners."""
        h_size = 6
        half = h_size // 2
        corners = [
            rect.topLeft(),
            rect.topRight(),
            rect.bottomLeft(),
            rect.bottomRight(),
        ]
        painter.setPen(QPen(QColor("#0d99ff"), 1.2))
        painter.setBrush(QColor("#ffffff"))
        for pt in corners:
            painter.drawRect(pt.x() - half, pt.y() - half, h_size, h_size)

    def _draw_badge(self, painter: QPainter, rect: QRect, widget: QWidget) -> None:
        """Renders an informative Figma-style pill badge above or below the selection."""
        class_name = widget.__class__.__name__
        obj_name = widget.objectName()
        label_text = f"{class_name} #{obj_name}" if obj_name else class_name
        coords_text = f"{rect.x()}, {rect.y()}  •  {rect.width()}×{rect.height()}"
        full_text = f"{label_text}  [{coords_text}]"

        font = QFont("Segoe UI", 8, QFont.Weight.DemiBold)
        painter.setFont(font)

        metrics = painter.fontMetrics()
        text_w = metrics.horizontalAdvance(full_text)
        badge_w = text_w + 14
        badge_h = 20

        # Position badge above if room, else below
        badge_x = rect.x()
        badge_y = rect.y() - badge_h - 4
        if badge_y < 5:
            badge_y = rect.bottom() + 4

        badge_rect = QRect(badge_x, badge_y, badge_w, badge_h)

        # Draw badge pill background
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor(24, 26, 32, 230))
        painter.drawRoundedRect(badge_rect, 4, 4)

        # Draw blue left accent dot
        painter.setBrush(QColor("#0d99ff"))
        painter.drawEllipse(badge_x + 5, badge_y + 7, 6, 6)

        # Draw badge text
        painter.setPen(QColor("#ffffff"))
        painter.drawText(badge_x + 15, badge_y + 14, full_text)
