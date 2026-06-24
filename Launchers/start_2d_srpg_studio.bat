@echo off
setlocal

set "APP_DIR=C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio"
set "APP_URL=http://127.0.0.1:8088"
set "TODO_URL=http://127.0.0.1:8088/todo.html"
set "RUNTIME_TODO_URL=http://127.0.0.1:8088/runtime-json-todo.html"

echo.
echo [2D_SRPGStudio]
echo Directory:     %APP_DIR%
echo Studio URL:    %APP_URL%
echo TODO URL:      %TODO_URL%
echo Runtime TODO:  %RUNTIME_TODO_URL%
echo.

cd /d "%APP_DIR%"
if errorlevel 1 (
  echo Failed to enter studio directory.
  pause
  exit /b 1
)

echo Starting static server for TitleGameStudio package...
echo Command: python -m http.server 8088
echo Open:    %TODO_URL%
echo.
python -m http.server 8088

pause
