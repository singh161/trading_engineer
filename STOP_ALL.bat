@echo off
title Stop All Services
color 0C

echo ========================================
echo   STOPPING ALL SERVICES
echo ========================================
echo.

REM Kill Python processes (Backend)
echo [1/2] Stopping Backend Server...
taskkill /FI "WINDOWTITLE eq Backend API Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Trading Engineer - Backend*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq python.exe" /FI "WINDOWTITLE eq *Backend*" /F >nul 2>&1

REM Kill Node processes (Frontend)
echo [2/2] Stopping Frontend Server...
taskkill /FI "WINDOWTITLE eq Frontend Dev Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Trading Engineer - Frontend*" /F >nul 2>&1
taskkill /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *Frontend*" /F >nul 2>&1

REM Alternative: Kill by port (more reliable)
echo.
echo Stopping processes on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do taskkill /F /PID %%a >nul 2>&1

timeout /t 2 /nobreak >nul

echo.
echo ✅ All services stopped!
echo.
pause
