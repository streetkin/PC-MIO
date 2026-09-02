"""
DesignPen Base Adapter Interface
Defines the base interface for all framework-specific adapters
(Qt, Gaming/Overlay, Tkinter, etc.)
"""
from typing import Any


class BaseAdapter:
    """Base class for DesignPen framework adapters."""

    def __init__(self, target_window: Any):
        self.target_window = target_window
        self.is_active = False

    def set_active(self, active: bool) -> None:
        """Enables or disables Design Mode in the target window."""
        raise NotImplementedError

    def undo(self) -> bool:
        """Reverts the last visual manipulation (drag or text edit)."""
        raise NotImplementedError

    def export_layout(self, file_path: str = "designpen_layout.json") -> str:
        """Exports modified components to a JSON file."""
        raise NotImplementedError
