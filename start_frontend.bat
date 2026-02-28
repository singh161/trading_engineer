@echo off
title Trading Engineer - Frontend Only
color 0E

echo ========================================
echo   Starting React Frontend...
echo ========================================
echo.

cd /d %~dp0frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies (first time only)...
    call npm install
    echo.
)

echo Starting Frontend Development Server...
echo Frontend will open at: http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

npm run dev

pause
