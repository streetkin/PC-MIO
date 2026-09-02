"""
DesignPen Layout Exporter Module
Tracks component geometry/text changes and exports them as clean JSON
so AI agents or developers can persist runtime visual edits into source code.
"""
import json
import os
import time
from typing import Any, Dict, Optional
from PyQt6.QtWidgets import QWidget


class LayoutExporter:
    """
    Tracks and exports runtime UI modifications performed with DesignPen.
    """

    def __init__(self, target_window: Optional[QWidget] = None):
        self.target_window = target_window
        self.modifications: Dict[str, Dict[str, Any]] = {}

    def record_move(self, widget: QWidget, old_pos: tuple, new_pos: tuple) -> None:
        """Records a widget reposition event."""
        key = self._widget_key(widget)
        if key not in self.modifications:
            self.modifications[key] = self._snapshot_widget(widget)

        self.modifications[key]["x"] = new_pos[0]
        self.modifications[key]["y"] = new_pos[1]
        self.modifications[key]["last_modified"] = time.time()

    def record_text_change(self, widget: QWidget, old_text: str, new_text: str) -> None:
        """Records a widget text edit event."""
        key = self._widget_key(widget)
        if key not in self.modifications:
            self.modifications[key] = self._snapshot_widget(widget)

        self.modifications[key]["text"] = new_text
        self.modifications[key]["last_modified"] = time.time()

    def _widget_key(self, widget: QWidget) -> str:
        """Generates a stable identifier for a widget."""
        name = widget.objectName()
        if name:
            return name
        return f"{widget.__class__.__name__}_{id(widget)}"

    def _snapshot_widget(self, widget: QWidget) -> Dict[str, Any]:
        """Captures current geometric and textual properties of a widget."""
        pos = widget.pos()
        data: Dict[str, Any] = {
            "class": widget.__class__.__name__,
            "object_name": widget.objectName(),
            "x": pos.x(),
            "y": pos.y(),
            "width": widget.width(),
            "height": widget.height(),
        }
        if hasattr(widget, "text") and callable(getattr(widget, "text")):
            try:
                data["text"] = widget.text()
            except Exception:
                pass
        return data

    def export_to_json(self, file_path: str = "designpen_layout.json") -> str:
        """
        Saves all modifications into a well-formatted JSON file.
        Returns the absolute path of the created file.
        """
        output_data = {
            "version": "1.0.0",
            "generator": "DesignPen SDK",
            "exported_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "components": self.modifications,
        }

        abs_path = os.path.abspath(file_path)
        with open(abs_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        return abs_path
