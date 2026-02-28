@echo off
title Restart Backend for AI Endpoints
color 0C

echo ========================================
echo   RESTARTING BACKEND FOR AI ENDPOINTS
echo ========================================
echo.

echo [1/3] Stopping existing backend processes...
taskkill /F /FI "WINDOWTITLE eq Backend API Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Trading Engineer - Backend*" >nul 2>&1

REM Kill Python processes on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Killing process %%a on port 8000...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo [2/3] Waiting for ports to free...
timeout /t 3 /nobreak >nul

echo [3/3] Starting backend with AI endpoints...
start "Backend API Server" cmd /k "cd /d %~dp0 && title Backend API Server && python main.py"

echo.
echo ========================================
echo   BACKEND RESTARTED
echo ========================================
echo.
echo Check the backend window for:
echo   "AI Stock Research Engine endpoints registered"
echo.
echo Wait 5 seconds, then test endpoints:
echo   check_ai_endpoints.bat
echo.
timeout /t 5 /nobreak >nul

echo.
echo Testing AI endpoints...
python -c "import requests; r = requests.get('http://localhost:8000/openapi.json'); data = r.json(); paths = [p for p in data.get('paths', {}).keys() if '/ai/' in p]; print('AI Endpoints:' if paths else 'NO AI ENDPOINTS'); [print(f'  - {p}') for p in paths]" 2>nul

echo.
pause
