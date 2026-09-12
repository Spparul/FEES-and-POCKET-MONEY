@echo off
echo ===================================================
echo   DHANAPAL - Desktop Shortcut Setup
echo ===================================================
echo.

set SCRIPT_DIR=%~dp0
set DESKTOP=%USERPROFILE%\Desktop

echo Installing Python dependencies...
pip install -r "%SCRIPT_DIR%..\..\backend\requirements.txt" >nul 2>&1
pip install -r "%SCRIPT_DIR%..\..\pocket_money_system\backend\requirements.txt" >nul 2>&1
echo Done.
echo.

echo Building frontends...
cd /d "%SCRIPT_DIR%..\..\frontend"
call npm install >nul 2>&1
set VITE_API_BASE=
call npm run build >nul 2>&1

cd /d "%SCRIPT_DIR%..\..\pocket_money_system\frontend"
call npm install >nul 2>&1
set VITE_API_BASE=
call npm run build >nul 2>&1
echo Done.
echo.

echo Creating desktop shortcuts...

:: Create School Fees shortcut
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP%\School Fees.lnk'); $s.TargetPath = '%SCRIPT_DIR%School_Fees.bat'; $s.IconLocation = '%SCRIPT_DIR%school_fees.ico'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'School Fee Management System'; $s.Save()"

:: Create Pocket Money shortcut
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP%\Pocket Money.lnk'); $s.TargetPath = '%SCRIPT_DIR%Pocket_Money.bat'; $s.IconLocation = '%SCRIPT_DIR%pocket_money.ico'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Pocket Money Management System'; $s.Save()"

echo.
echo ===================================================
echo   Setup complete!
echo   Two icons added to your Desktop:
echo     - School Fees (green)
echo     - Pocket Money (blue)
echo.
echo   Double-click either icon to launch that app.
echo ===================================================
echo.
pause
