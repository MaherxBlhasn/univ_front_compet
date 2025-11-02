@echo off
echo ================================================
echo Building Windows Installer
echo ================================================
echo.

REM Check if Python folder exists
if not exist "python\python.exe" (
    echo [ERROR] Python not found!
    echo Please run setup_python.bat first.
    echo.
    pause
    exit /b 1
)

REM Check if backend folder exists
if not exist "backend\app.py" (
    echo [ERROR] Backend not found!
    echo.
    pause
    exit /b 1
)

echo [INFO] Building the application...
echo.
echo This will:
echo  1. Build the React frontend
echo  2. Build the Electron app
echo  3. Bundle Python + Backend + Frontend
echo  4. Create Windows installer
echo.
echo This may take 5-10 minutes...
echo.

call npm run build:win

echo.
if %ERRORLEVEL% EQU 0 (
    echo ================================================
    echo [SUCCESS] Build completed!
    echo ================================================
    echo.
    echo Your installer is ready in the 'dist' folder:
    echo.
    dir /b dist\*.exe
    echo.
    echo You can now distribute this installer to any Windows PC!
    echo.
) else (
    echo [ERROR] Build failed! Check the errors above.
    echo.
)

pause
