@echo off
setlocal

set "APP_DIR=C:\00_master\DevApps\kanban_June"
set "APP_URL=http://127.0.0.1:5184"

echo.
echo [Kanban_June]
echo Directory: %APP_DIR%
echo Web URL:   %APP_URL%
echo.

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo Failed to enter app directory.
  pause
  exit /b 1
)

if /I "%~1"=="tauri" (
  echo Starting Tauri desktop dev app...
  echo Command: npm run tauri:dev
  echo.
  npm run tauri:dev
) else (
  echo Starting local web dev server...
  echo Command: npm run dev
  echo Open:    %APP_URL%
  echo.
  npm run dev
)

pause
