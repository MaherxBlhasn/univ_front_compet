@echo off
echo ================================================
echo Quick Start - University Surveillance App
echo ================================================
echo.

REM Check if Python folder exists
if not exist "python\python.exe" (
    echo [ERROR] Python not found!
    echo Please run setup_python.bat first to download and configure Python.
    echo.
    pause
    exit /b 1
)

REM Check if backend folder exists
if not exist "backend\app.py" (
    echo [ERROR] Backend not found!
    echo The backend folder should contain your Flask app.
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

echo.
echo [SUCCESS] All checks passed!
echo.
echo Starting the application in development mode...
echo.
echo The app will:
echo  1. Launch the Electron window
echo  2. Start the Flask backend automatically
echo  3. Connect frontend to backend
echo.
echo Press Ctrl+C to stop the application
echo.

npm run dev
