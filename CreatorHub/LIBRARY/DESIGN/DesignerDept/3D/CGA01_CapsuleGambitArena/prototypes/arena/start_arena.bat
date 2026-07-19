@echo off
REM 固定ロジック自己対戦アリーナ（ベースライン）をダブルクリックで起動。
REM 引数で戦数を渡せる:  start_arena.bat 20
cd /d "%~dp0"
node arena.mjs %*
echo.
pause
