@echo off
echo Stopping Dhanapal apps...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001 " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

echo All apps stopped.
pause
