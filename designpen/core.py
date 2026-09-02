"""
DesignPen Core Controller
Coordinates the Toolbar, Adapter, Overlay, and Exporter into a unified facade.
"""
from typing import Optional
from PyQt6.QtCore import QPoint
from PyQt6.QtWidgets import QWidget

from designpen.adapters.qt_adapter import QtAdapter
from designpen.toolbar import DesignPenToolbar


class DesignPen:
    """
    Main entry point for DesignPen SDK.
    Integrates visual manipulation into any native application window with a single line:
        DesignPen.attach(window)
    """

    _instances = {}

    def __init__(self, target_window: QWidget):
        self.target_window = target_window
        self.adapter = QtAdapter(target_window)

        # Create floating toolbar
        self.toolbar = DesignPenToolbar(
            on_toggle_pen=self.adapter.set_active,
            on_undo=self.adapter.undo,
            on_export=self.adapter.export_layout,
        )

        # Wire dynamic updates from adapter to toolbar
        self.adapter.on_widget_inspected = self.toolbar.update_inspected_widget
        self.adapter.on_history_changed = self.toolbar.set_history_count

        # Position toolbar near top-center of target window
        self._position_toolbar()
        self.toolbar.show()

    def _position_toolbar(self) -> None:
        """Positions the toolbar near the top-center of target window."""
        if self.target_window:
            geo = self.target_window.geometry()
            tb_x = geo.x() + max(20, (geo.width() - 420) // 2)
            tb_y = max(30, geo.y() + 20)
            self.toolbar.move(QPoint(tb_x, tb_y))

    @classmethod
    def attach(cls, target_window: QWidget) -> "DesignPen":
        """
        Attaches DesignPen to any native window or widget.
        Usage:
            DesignPen.attach(my_main_window)
        """
        instance = cls(target_window)
        cls._instances[id(target_window)] = instance
        return instance

    def set_active(self, active: bool) -> None:
        """Directly toggle active state programmatically."""
        self.toolbar._update_pen_btn_style(active)
        self.adapter.set_active(active)

    def export(self, file_path: str = "designpen_layout.json") -> str:
        """Exports layout changes."""
        return self.adapter.export_layout(file_path)

    def undo(self) -> bool:
        """Undoes last visual modification."""
        return self.adapter.undo()
