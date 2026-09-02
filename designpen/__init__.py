"""
DesignPen - Open Source Native Visual UI Manipulation Toolkit
A drop-in SDK for AI agents and developers to visually rearrange and edit
desktop UI components at runtime.
"""
from designpen.core import DesignPen
from designpen.cursor import create_pen_cursor
from designpen.overlay import DesignPenOverlay
from designpen.toolbar import DesignPenToolbar

__version__ = "1.0.0"
__all__ = ["DesignPen", "DesignPenToolbar", "DesignPenOverlay", "create_pen_cursor"]
