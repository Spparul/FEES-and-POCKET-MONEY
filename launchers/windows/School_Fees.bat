@echo off
title School Fees System
set PORT=8000
set PROJECT_DIR=%~dp0..\..
set BACKEND_DIR=%PROJECT_DIR%\backend
set LOG_FILE=%PROJECT_DIR%\fees_app.log

set DATABASE_URL=postgresql://dhanapal_user:dhanapal_pass@localhost:5432/dhanapal_db

echo ===================================================
echo   SCHOOL FEES MANAGEMENT SYSTEM
echo   Starting on http://127.0.0.1:%PORT%
echo ===================================================

cd /d "%BACKEND_DIR%"

:: Check if port is already in use
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo Server already running. Opening browser...
    start http://127.0.0.1:%PORT%
    exit
)

:: Start the backend in background and open browser
start /b "" python -m uvicorn main:app --host 127.0.0.1 --port %PORT% > "%LOG_FILE%" 2>&1

echo Waiting for server to start...
:waitloop
timeout /t 1 /nobreak >nul
curl -s http://127.0.0.1:%PORT%/ >nul 2>&1
if %errorlevel% neq 0 goto waitloop

echo Server is ready!
start http://127.0.0.1:%PORT%

echo.
echo School Fees is running. Close this window to stop the server.
echo.

:: Keep window open — closing it stops the server
cmd /k
