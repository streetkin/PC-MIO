"""
DesignPen Next-Gen Dynamic Floating Toolbar
A sleek Dynamic-Island-inspired floating pill toolbar with acrylic frosted glass,
interactive micro-animations, real-time widget inspector chip, and collapsible states.
"""
from typing import Callable, Optional
from PyQt6.QtCore import QPoint, QRect, Qt, QTimer
from PyQt6.QtGui import QColor, QFont
from PyQt6.QtWidgets import (
    QFrame,
    QGraphicsDropShadowEffect,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)


class DesignPenToolbar(QWidget):
    """
    Next-Gen Floating Pill Toolbar with Dynamic Island aesthetics,
    real-time inspector readout, and interactive controls.
    """

    def __init__(
        self,
        on_toggle_pen: Optional[Callable[[bool], None]] = None,
        on_undo: Optional[Callable[[], bool]] = None,
        on_export: Optional[Callable[[], str]] = None,
        parent: Optional[QWidget] = None,
    ):
        super().__init__(parent)
        self.on_toggle_pen = on_toggle_pen
        self.on_undo = on_undo
        self.on_export = on_export

        self.is_active = False
        self.is_collapsed = False
        self._drag_start_pos: Optional[QPoint] = None

        self._setup_window_flags()
        self._init_ui()

    def _setup_window_flags(self) -> None:
        self.setWindowFlags(
            Qt.WindowType.Tool
            | Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

    def _init_ui(self) -> None:
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(14, 14, 14, 14)

        # Outer Pill Card (Dynamic Island container)
        self.card = QFrame(self)
        self.card.setObjectName("DynamicPill")
        self.card.setStyleSheet("""
            QFrame#DynamicPill {
                background: qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 rgba(28, 30, 38, 0.97), stop:1 rgba(15, 17, 23, 0.98));
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 24px;
            }
        """)

        # Soft glowing drop shadow
        shadow = QGraphicsDropShadowEffect(self)
        shadow.setBlurRadius(28)
        shadow.setColor(QColor(0, 0, 0, 180))
        shadow.setOffset(0, 8)
        self.card.setGraphicsEffect(shadow)

        self.card_layout = QHBoxLayout(self.card)
        self.card_layout.setContentsMargins(14, 8, 14, 8)
        self.card_layout.setSpacing(10)

        # 1. Drag Handle
        self.grip = QLabel("⠿", self.card)
        self.grip.setToolTip("Trascina la barra ovunque")
        self.grip.setCursor(Qt.CursorShape.SizeAllCursor)
        self.grip.setStyleSheet("""
            color: rgba(255, 255, 255, 0.35);
            font-size: 16px;
            padding: 0 2px;
        """)
        self.card_layout.addWidget(self.grip)

        # 2. Brand Icon & Title with Glowing Dot
        self.brand_container = QWidget(self.card)
        brand_h = QHBoxLayout(self.brand_container)
        brand_h.setContentsMargins(0, 0, 0, 0)
        brand_h.setSpacing(6)

        self.status_dot = QLabel("●", self.brand_container)
        self.status_dot.setStyleSheet("color: #64748b; font-size: 10px;")
        brand_h.addWidget(self.status_dot)

        self.brand_label = QLabel("DesignPen", self.brand_container)
        self.brand_label.setStyleSheet("color: #ffffff; font-weight: 800; font-size: 13px; letter-spacing: 0.5px;")
        brand_h.addWidget(self.brand_label)
        self.card_layout.addWidget(self.brand_container)

        # 3. Dynamic Inspector Chip (Shows active element or status)
        self.inspector_chip = QLabel("✦ Standby", self.card)
        self.inspector_chip.setStyleSheet("""
            background: rgba(255, 255, 255, 0.06);
            color: #94a3b8;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 500;
        """)
        self.card_layout.addWidget(self.inspector_chip)

        # Separator
        self.sep = QFrame()
        self.sep.setFrameShape(QFrame.Shape.VLine)
        self.sep.setStyleSheet("background: rgba(255, 255, 255, 0.12); max-width: 1px; margin: 4px 0;")
        self.card_layout.addWidget(self.sep)

        # 4. Dynamic Pen Toggle Button (Glowing Gradient)
        self.pen_btn = QPushButton("✎ Penna", self.card)
        self.pen_btn.setToolTip("Attiva/Disattiva la modalità di manipolazione visiva")
        self.pen_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.pen_btn.clicked.connect(self._handle_pen_toggle)
        self._update_pen_btn_style(False)
        self.card_layout.addWidget(self.pen_btn)

        # 5. Undo Button with Micro-Interaction
        self.undo_btn = QPushButton("↶ Undo", self.card)
        self.undo_btn.setToolTip("Annulla l'ultima mossa (Ctrl+Z)")
        self.undo_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.undo_btn.setStyleSheet("""
            QPushButton {
                background: rgba(255, 255, 255, 0.07);
                color: #e2e8f0;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 6px 14px;
                font-size: 12px;
                font-weight: 600;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.25);
                color: #ffffff;
            }
            QPushButton:pressed {
                background: rgba(255, 255, 255, 0.05);
            }
        """)
        self.undo_btn.clicked.connect(self._handle_undo)
        self.card_layout.addWidget(self.undo_btn)

        # 6. Export Button (Emerald Glowing Accent)
        self.export_btn = QPushButton("💾 Salva", self.card)
        self.export_btn.setToolTip("Esporta le modifiche visive in designpen_layout.json per l'AI")
        self.export_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.export_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 rgba(16, 185, 129, 0.25), stop:1 rgba(5, 150, 105, 0.35));
                color: #34d399;
                border: 1px solid rgba(52, 211, 153, 0.4);
                border-radius: 14px;
                padding: 6px 14px;
                font-size: 12px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 rgba(16, 185, 129, 0.4), stop:1 rgba(5, 150, 105, 0.5));
                border-color: #34d399;
                color: #ffffff;
            }
            QPushButton:pressed {
                background: rgba(16, 185, 129, 0.2);
            }
        """)
        self.export_btn.clicked.connect(self._handle_export)
        self.card_layout.addWidget(self.export_btn)

        # 7. Collapse / Mini-Pill Button
        self.collapse_btn = QPushButton("—", self.card)
        self.collapse_btn.setToolTip("Riduci a pillola compatta")
        self.collapse_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.collapse_btn.setFixedSize(26, 26)
        self.collapse_btn.setStyleSheet("""
            QPushButton {
                background: rgba(255, 255, 255, 0.05);
                color: #94a3b8;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 13px;
                font-size: 12px;
                font-weight: bold;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #ffffff;
            }
        """)
        self.collapse_btn.clicked.connect(self._toggle_collapse)
        self.card_layout.addWidget(self.collapse_btn)

        main_layout.addWidget(self.card)

    def _update_pen_btn_style(self, active: bool) -> None:
        if active:
            self.pen_btn.setText("⚡ MODALITÀ PENNA")
            self.pen_btn.setStyleSheet("""
                QPushButton {
                    background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #0070f3, stop:1 #00dfd8);
                    color: #ffffff;
                    border: 1px solid #38bdf8;
                    border-radius: 14px;
                    padding: 6px 16px;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.3px;
                }
                QPushButton:hover {
                    background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #0060d0, stop:1 #00c4be);
                }
            """)
            self.status_dot.setText("●")
            self.status_dot.setStyleSheet("color: #00dfd8; font-size: 12px;")
            self.inspector_chip.setText("🎯 Seleziona o trascina un elemento")
            self.inspector_chip.setStyleSheet("""
                background: rgba(0, 223, 216, 0.12);
                color: #38bdf8;
                border: 1px solid rgba(0, 223, 216, 0.25);
                border-radius: 12px;
                padding: 4px 10px;
                font-size: 11px;
                font-weight: 600;
            """)
        else:
            self.pen_btn.setText("✎ Attiva Penna")
            self.pen_btn.setStyleSheet("""
                QPushButton {
                    background: rgba(255, 255, 255, 0.08);
                    color: #cbd5e1;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 14px;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 600;
                }
                QPushButton:hover {
                    background: rgba(255, 255, 255, 0.16);
                    color: #ffffff;
                    border-color: #38bdf8;
                }
            """)
            self.status_dot.setText("●")
            self.status_dot.setStyleSheet("color: #64748b; font-size: 10px;")
            self.inspector_chip.setText("✦ Standby")
            self.inspector_chip.setStyleSheet("""
                background: rgba(255, 255, 255, 0.06);
                color: #94a3b8;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 4px 10px;
                font-size: 11px;
                font-weight: 500;
            """)

    def update_inspected_widget(self, widget: Optional[QWidget], x: int = 0, y: int = 0) -> None:
        """Dynamically updates the live inspector pill with component name and coordinates."""
        if not self.is_active:
            return

        if widget is None:
            self.inspector_chip.setText("🎯 Seleziona o trascina un elemento")
            self.inspector_chip.setStyleSheet("""
                background: rgba(0, 223, 216, 0.12);
                color: #38bdf8;
                border: 1px solid rgba(0, 223, 216, 0.25);
                border-radius: 12px;
                padding: 4px 10px;
                font-size: 11px;
                font-weight: 600;
            """)
        else:
            cls_name = widget.__class__.__name__
            name = widget.objectName() or cls_name
            self.inspector_chip.setText(f"📦 {name}  [X: {x}  Y: {y}]")
            self.inspector_chip.setStyleSheet("""
                background: rgba(13, 153, 255, 0.2);
                color: #60a5fa;
                border: 1px solid #3b82f6;
                border-radius: 12px;
                padding: 4px 12px;
                font-size: 11px;
                font-weight: bold;
            """)

    def set_history_count(self, count: int) -> None:
        """Updates the undo button badge."""
        if count > 0:
            self.undo_btn.setText(f"↶ Undo ({count})")
            self.undo_btn.setStyleSheet("""
                QPushButton {
                    background: rgba(245, 158, 11, 0.2);
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.35);
                    border-radius: 14px;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 600;
                }
                QPushButton:hover {
                    background: rgba(245, 158, 11, 0.35);
                    color: #ffffff;
                }
            """)
        else:
            self.undo_btn.setText("↶ Undo")
            self.undo_btn.setStyleSheet("""
                QPushButton {
                    background: rgba(255, 255, 255, 0.07);
                    color: #94a3b8;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 14px;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 600;
                }
                QPushButton:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: #ffffff;
                }
            """)

    def _toggle_collapse(self) -> None:
        """Collapses the toolbar into a tiny Dynamic Island pill or expands it back."""
        self.is_collapsed = not self.is_collapsed
        if self.is_collapsed:
            self.inspector_chip.hide()
            self.undo_btn.hide()
            self.export_btn.hide()
            self.sep.hide()
            self.collapse_btn.setText("+")
            self.collapse_btn.setToolTip("Espandi la toolbar")
        else:
            self.inspector_chip.show()
            self.undo_btn.show()
            self.export_btn.show()
            self.sep.show()
            self.collapse_btn.setText("—")
            self.collapse_btn.setToolTip("Riduci a pillola compatta")

    def _handle_pen_toggle(self) -> None:
        self.is_active = not self.is_active
        self._update_pen_btn_style(self.is_active)
        if self.on_toggle_pen:
            self.on_toggle_pen(self.is_active)

    def _handle_undo(self) -> None:
        if self.on_undo:
            success = self.on_undo()
            if success:
                self._flash_feedback(self.undo_btn, "✓ Annullato!", "#fbbf24")
            else:
                self._flash_feedback(self.undo_btn, "Nessuna azione", "#94a3b8")

    def _handle_export(self) -> None:
        if self.on_export:
            path = self.on_export()
            self._flash_feedback(self.export_btn, "✓ Salvato JSON!", "#34d399")

    def _flash_feedback(self, btn: QPushButton, msg: str, color: str) -> None:
        original_text = btn.text()
        btn.setText(msg)
        QTimer.singleShot(1400, lambda: btn.setText(original_text))

    # --- Smooth Window Dragging Logic ---
    def mousePressEvent(self, event) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self._drag_start_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event) -> None:
        if self._drag_start_pos is not None and event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_start_pos)
            event.accept()

    def mouseReleaseEvent(self, event) -> None:
        self._drag_start_pos = None
        event.accept()
