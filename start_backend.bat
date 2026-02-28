@echo off
title Trading Engineer - Backend Only
color 0C

echo ========================================
echo   Starting Stock Analysis Backend...
echo ========================================
echo.

cd /d %~dp0

REM Check if .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        echo [INFO] Please configure .env with your settings
    )
)

echo Starting FastAPI Backend Server...
echo Backend API: http://localhost:8000
echo API Docs:    http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

python main.py

pause
