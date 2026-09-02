"""
DesignPen Cursor Module
Generates a crisp, high-DPI vector stylus/pen cursor with precision hotspot.
"""
from PyQt6.QtCore import QPoint, Qt
from PyQt6.QtGui import QColor, QCursor, QPainter, QPen, QPolygon, QPixmap


def create_pen_cursor() -> QCursor:
    """
    Creates a custom pen/stylus cursor for Design Mode.
    Hotspot is at (2, 2) which corresponds to the sharp tip of the pen.
    """
    size = 32
    pixmap = QPixmap(size, size)
    pixmap.fill(Qt.GlobalColor.transparent)

    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

    tip = QPoint(3, 3)

    # Nib
    nib = QPolygon([
        tip,
        QPoint(11, 6),
        QPoint(6, 11)
    ])
    painter.setPen(QPen(QColor("#0d99ff"), 1.5))
    painter.setBrush(QColor("#ffffff"))
    painter.drawPolygon(nib)

    # Body
    body = QPolygon([
        QPoint(11, 6),
        QPoint(25, 20),
        QPoint(20, 25),
        QPoint(6, 11)
    ])
    painter.setPen(QPen(QColor("#1e1e24"), 1.2))
    painter.setBrush(QColor("#0d99ff"))
    painter.drawPolygon(body)

    # Grip / Cap
    cap = QPolygon([
        QPoint(22, 17),
        QPoint(27, 22),
        QPoint(24, 25),
        QPoint(19, 20)
    ])
    painter.setPen(QPen(QColor("#ffffff"), 1))
    painter.setBrush(QColor("#2c3e50"))
    painter.drawPolygon(cap)

    # Precision dot at tip
    painter.setPen(Qt.PenStyle.NoPen)
    painter.setBrush(QColor("#0d99ff"))
    painter.drawEllipse(2, 2, 2, 2)

    painter.end()

    return QCursor(pixmap, 2, 2)
