@echo off
title PC MIO - Street AI Edition
color 0A
cls
echo ========================================================
echo          AVVIO DI PC MIO (STREET EDITION)
echo ========================================================
echo.
echo Avvio dell'applicazione desktop nativa in corso...

cd /d "C:\Users\admin\Desktop\PC MIO"
start "" pythonw app_desktop.py
exit
