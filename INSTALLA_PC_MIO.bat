@echo off
chcp 65001 >nul
title PC MIO - Installatore Ufficiale Windows
color 0A

echo ===============================================================================
echo            PC MIO - ASSISTENTE DI OTTIMIZZAZIONE E SICUREZZA
echo ===============================================================================
echo.
echo   [+] Preparazione installazione sul sistema Windows...
set "INSTALL_DIR=%LOCALAPPDATA%\Programs\PC MIO"
set "SOURCE_DIR=%~dp0dist\PC_MIO"

if not exist "%SOURCE_DIR%\PC_MIO.exe" (
    set "SOURCE_DIR=%~dp0PC MIO\dist\PC_MIO"
)

if not exist "%SOURCE_DIR%\PC_MIO.exe" (
    echo   [!] ERRORE: File compilati non trovati in %SOURCE_DIR%.
    pause
    exit /b 1
)

echo   [+] Destinazione: %INSTALL_DIR%
echo   [+] Copia file del software in corso...

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
xcopy "%SOURCE_DIR%" "%INSTALL_DIR%\" /E /I /Y /Q >nul

echo   [+] Creazione scorciatoia ufficiale sul DESKTOP...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine([System.Environment]::GetFolderPath('Desktop'), 'PC MIO.lnk')); $s.TargetPath = '%INSTALL_DIR%\PC_MIO.exe'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'PC MIO - Assistente di Ottimizzazione e Sicurezza'; $s.Save()"

echo   [+] Creazione voce nel MENU START di Windows...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $startMenu = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('StartMenu'), 'Programs'); $s = $ws.CreateShortcut([System.IO.Path]::Combine($startMenu, 'PC MIO.lnk')); $s.TargetPath = '%INSTALL_DIR%\PC_MIO.exe'; $s.WorkingDirectory = '%INSTALL_DIR%'; $s.Description = 'PC MIO - Assistente di Ottimizzazione e Sicurezza'; $s.Save()"

echo.
echo ===============================================================================
echo               INSTALLAZIONE DI PC MIO COMPLETATA CON SUCCESSO!
echo ===============================================================================
echo.
echo   - Il software e ora installato in:
echo     %INSTALL_DIR%
echo.
echo   - Trovi l'icona "PC MIO" direttamente sul tuo DESKTOP e nel MENU START.
echo.
echo   [+] Avvio immediato di PC MIO in corso...
start "" "%INSTALL_DIR%\PC_MIO.exe"
timeout /t 2 >nul
exit /b 0
