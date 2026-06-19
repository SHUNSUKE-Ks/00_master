@echo off
setlocal

set "APP_DIR=C:\00_master\APP\kanban-note01"
set "APP_URL=http://127.0.0.1:5185"

echo.
echo [kanban-note01]
echo Directory: %APP_DIR%
echo Web URL:   %APP_URL%
echo.

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo Failed to enter app directory.
  pause
  exit /b 1
)

echo Starting local web dev server...
echo Command: npm run dev -- --host 127.0.0.1 --port 5185
echo Open:    %APP_URL%
echo.
npm run dev -- --host 127.0.0.1 --port 5185

pause
