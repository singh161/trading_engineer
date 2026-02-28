@echo off
setlocal enabledelayedexpansion
title Trading Engineer - One-Click Startup
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║   TRADING ENGINEER - ONE-CLICK STARTUP               ║
echo ║   Starting Backend + Frontend + AI Stock Engine      ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Get project directory
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo [CHECKING PREREQUISITES...]
echo.

REM Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.10+
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    pause
    exit /b 1
) else (
    python --version
    echo [OK] Python found
)
echo.

REM Check Node.js
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js
    echo.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
) else (
    node --version
    echo [OK] Node.js found
)
echo.

REM Check Chrome browser and set path
echo [2.5/4] Checking Chrome browser...
set "CHROME_PATH="
where chrome.exe >nul 2>&1
if not errorlevel 1 (
    for /f "delims=" %%i in ('where chrome.exe 2^>nul') do (
        set "CHROME_PATH=%%i"
        echo [OK] Chrome found
        goto :chrome_found
    )
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
    echo [OK] Chrome found
    goto :chrome_found
)
if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    echo [OK] Chrome found
    goto :chrome_found
)
echo [INFO] Chrome not found - will use default browser
:chrome_found
echo.

REM Check and install frontend dependencies
echo [3/4] Checking Frontend Dependencies...
if not exist "frontend\node_modules" (
    echo [INFO] Frontend dependencies not found. Installing...
    cd frontend
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies found
)
echo.

REM Create .env files if missing
echo [4/4] Checking Configuration Files...
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy ".env.example" ".env" >nul
        echo [OK] .env file created
    ) else (
        echo [WARNING] .env.example not found
    )
) else (
    echo [OK] .env file exists
)

if not exist "ai_stock\.env" (
    if exist "ai_stock\.env.example" (
        echo [INFO] Creating ai_stock\.env from .env.example...
        copy "ai_stock\.env.example" "ai_stock\.env" >nul
        echo [OK] ai_stock\.env file created
    )
)
echo.

REM Check if ports are already in use
echo [CHECKING PORTS...]
netstat -ano | findstr ":8000" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 8000 is already in use!
    echo [INFO] Backend might already be running or another service is using this port
    echo.
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
)

netstat -ano | findstr ":5173" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 5173 is already in use!
    echo [INFO] Frontend might already be running or another service is using this port
    echo.
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
)
echo.

REM Get actual ports from config (before starting services)
set "BACKEND_PORT=8000"
set "FRONTEND_PORT=5173"

if exist ".env" (
    for /f "tokens=2 delims==" %%a in ('findstr "API_PORT" .env 2^>nul') do set "BACKEND_PORT=%%a"
)

if exist "frontend\.env" (
    for /f "tokens=2 delims==" %%a in ('findstr "VITE_PORT" frontend\.env 2^>nul') do set "FRONTEND_PORT=%%a"
)

echo ╔═══════════════════════════════════════════════════════╗
echo ║   STARTING SERVICES...                                ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Start Backend in new window
echo [1/2] Starting Backend API Server...
echo        Window will open: "Backend API Server"
echo        Checking Python and dependencies...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)
start "Backend API Server" cmd /k "cd /d "%PROJECT_DIR%" && title Backend API Server && color 0A && echo. && echo ═══════════════════════════════════════ && echo   BACKEND API SERVER && echo ═══════════════════════════════════════ && echo. && echo Starting FastAPI on port 8000... && echo Backend URL: http://localhost:8000 && echo API Docs: http://localhost:8000/docs && echo. && echo If you see errors below, check: && echo   1. Python dependencies: pip install -r requirements.txt && echo   2. .env file exists && echo   3. Database connection && echo. && python main.py"
if errorlevel 1 (
    echo [ERROR] Failed to start backend!
    pause
    exit /b 1
)

REM Wait for backend to start
echo        Waiting for backend to initialize...
set "BACKEND_READY=0"
for /l %%i in (1,1,15) do (
    netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 (
        REM Port is listening, verify HTTP response
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
        if not errorlevel 1 (
            set "BACKEND_READY=1"
            echo [OK] Backend is running on port 8000
            goto :backend_ready
        )
    )
    timeout /t 1 /nobreak >nul
    if %%i LEQ 5 (
        echo        Waiting for backend... (attempt %%i/15)
    )
)
:backend_ready
if %BACKEND_READY%==0 (
    echo [WARNING] Backend did not become ready after 15 seconds
    echo           Check "Backend API Server" window for errors
    echo           Frontend will start but may not connect to backend
    echo.
    choice /C YN /M "Continue starting frontend anyway"
    if errorlevel 2 (
        echo [INFO] Aborting startup...
        pause
        exit /b 1
    )
)
timeout /t 2 /nobreak >nul

REM Start Frontend in new window
echo [2/2] Starting Frontend Development Server...
echo        Window will open: "Frontend Dev Server"
echo        Checking frontend directory...
if not exist "%PROJECT_DIR%\frontend" (
    echo [ERROR] Frontend directory not found!
    pause
    exit /b 1
)
if not exist "%PROJECT_DIR%\frontend\node_modules" (
    echo [WARNING] Frontend dependencies not found!
    echo           Installing dependencies first...
    cd "%PROJECT_DIR%\frontend"
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies!
        cd "%PROJECT_DIR%"
        pause
        exit /b 1
    )
    cd "%PROJECT_DIR%"
    echo [OK] Frontend dependencies installed
)
echo        Starting Vite dev server...
echo        Frontend URL will be: http://localhost:%FRONTEND_PORT%
start "Frontend Dev Server" cmd /k "cd /d "%PROJECT_DIR%\frontend" && title Frontend Dev Server && color 0E && echo. && echo ═══════════════════════════════════════ && echo   FRONTEND DEV SERVER && echo ═══════════════════════════════════════ && echo. && echo Starting Vite on port %FRONTEND_PORT%... && echo Frontend URL: http://localhost:%FRONTEND_PORT% && echo. && echo If you see errors below, check: && echo   1. Node modules: npm install && echo   2. Port %FRONTEND_PORT% availability && echo   3. vite.config.js syntax && echo. && npm run dev"
if errorlevel 1 (
    echo [ERROR] Failed to start frontend!
    pause
    exit /b 1
)

REM Wait for frontend to start
echo        Waiting for frontend to initialize...
timeout /t 8 /nobreak >nul

echo.
REM Check if frontend is actually running - wait up to 45 seconds
echo [VERIFYING SERVICES...]
set "FRONTEND_READY=0"
for /l %%i in (1,1,45) do (
    REM First check if port is listening
    netstat -ano | findstr ":!FRONTEND_PORT!" | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 (
        REM Port is listening, now verify URL is actually accessible via HTTP
        echo        Port !FRONTEND_PORT! is listening, verifying HTTP response...
        set "FRONTEND_URL=http://localhost:!FRONTEND_PORT!"
        powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri '!FRONTEND_URL!' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
        if not errorlevel 1 (
            set "FRONTEND_READY=1"
            echo [OK] Frontend is running and accessible on http://localhost:!FRONTEND_PORT!
            echo        Double-checking HTTP response...
            timeout /t 2 /nobreak >nul
            REM Verify one more time before opening browser
            powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $response = Invoke-WebRequest -Uri '!FRONTEND_URL!' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
            if not errorlevel 1 (
                echo [CONFIRMED] Frontend is ready! Safe to open browser.
                timeout /t 1 /nobreak >nul
                goto :frontend_ready
            ) else (
                echo [WARNING] HTTP check failed, resetting ready flag...
                set "FRONTEND_READY=0"
            )
        ) else (
            if %%i LEQ 20 (
                echo        Port listening but HTTP not ready yet... (attempt %%i/45)
            )
        )
    ) else (
        if %%i LEQ 15 (
            echo        Waiting for frontend port... (attempt %%i/45)
        ) else if %%i==20 (
            echo        Still waiting... Frontend may be slow to start
        ) else if %%i==30 (
            echo        Still waiting... Check Frontend Dev Server window for errors
        ) else if %%i==40 (
            echo        Almost timeout... Frontend may have issues starting
        )
    )
    timeout /t 1 /nobreak >nul
)

:frontend_ready
if %FRONTEND_READY%==0 (
    echo.
    echo [WARNING] Frontend did not become accessible after 45 seconds
    echo           Possible issues:
    echo           1. Frontend is still starting (check Frontend Dev Server window)
    echo           2. Port conflict (another app using port !FRONTEND_PORT!)
    echo           3. Frontend startup error (check Frontend Dev Server window)
    echo.
    echo           Browser will NOT open automatically
    echo           Once frontend is ready, open manually: http://localhost:!FRONTEND_PORT!
    echo.
)

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║   ✅ ALL SERVICES STARTED SUCCESSFULLY!              ║
echo ╠═══════════════════════════════════════════════════════╣
echo ║   📊 Backend API:  http://localhost:!BACKEND_PORT!  ║
echo ║   🎨 Frontend UI:  http://localhost:!FRONTEND_PORT! ║
echo ║   📖 API Docs:      http://localhost:!BACKEND_PORT!/docs ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

if !FRONTEND_READY!==1 (
    echo.
    echo [READY] Frontend is running! Opening browser...
    timeout /t 1 /nobreak >nul
    echo [OPENING CHROME BROWSER...]
    if defined CHROME_PATH (
        echo        Chrome path: !CHROME_PATH!
        echo        Opening Frontend: http://localhost:!FRONTEND_PORT!
        start "" "!CHROME_PATH!" --new-window --no-first-run --no-default-browser-check --disable-infobars --disable-background-networking "http://localhost:!FRONTEND_PORT!"
        timeout /t 3 /nobreak >nul
        echo        Opening API Docs: http://localhost:!BACKEND_PORT!/docs
        start "" "!CHROME_PATH!" --new-window --no-first-run --no-default-browser-check --disable-infobars --disable-background-networking "http://localhost:!BACKEND_PORT!/docs"
    ) else (
        echo [WARNING] Chrome not found, using default browser...
        start http://localhost:!FRONTEND_PORT!
        timeout /t 1 /nobreak >nul
        start http://localhost:!BACKEND_PORT!/docs
    )
) else (
    echo.
    echo [SKIP] Browser will NOT open - Frontend not ready
    echo        Please check "Frontend Dev Server" window for errors
    echo        Once frontend is running, open manually:
    echo        http://localhost:!FRONTEND_PORT!
    echo.
    timeout /t 2 /nobreak >nul
    echo Opening API Docs only...
    if defined CHROME_PATH (
        start "" "!CHROME_PATH!" --new-window --no-first-run --no-default-browser-check --disable-infobars --disable-background-networking "http://localhost:!BACKEND_PORT!/docs"
    ) else (
        start http://localhost:!BACKEND_PORT!/docs
    )
)

echo.
echo ✅ Project is running!
echo.
echo 📋 CHECK THE WINDOWS:
echo    • "Backend API Server" - Should show FastAPI starting
echo    • "Frontend Dev Server" - Should show Vite starting
echo.
echo 💡 TIP: Close the command windows to stop services
echo    Or run STOP_ALL.bat to stop everything
echo.
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║   SERVICES ARE RUNNING                                ║
echo ╠═══════════════════════════════════════════════════════╣
echo ║   Backend and Frontend are running in separate windows║
echo ║   This window will stay open                          ║
echo ║   Press any key to close (services keep running)     ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo Waiting for user input...
pause
if errorlevel 1 (
    REM If pause fails, use alternative method
    echo.
    echo Window will close in 10 seconds...
    timeout /t 10 /nobreak >nul
)
