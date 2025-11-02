@echo off
echo ================================================
echo Setting up Embedded Python for Backend
echo ================================================

REM Download Python 3.11.9 embedded
echo Downloading Python 3.11.9 embedded...
curl -L -o python-3.11.9-embed-amd64.zip https://www.python.org/ftp/python/3.11.9/python-3.11.9-embed-amd64.zip

REM Extract to python folder
echo Extracting Python...
powershell -command "Expand-Archive -Path python-3.11.9-embed-amd64.zip -DestinationPath python -Force"

REM Download get-pip.py
echo Downloading pip installer...
curl -L -o python/get-pip.py https://bootstrap.pypa.io/get-pip.py

REM Uncomment the import line in python311._pth to enable site-packages
echo Enabling site-packages...
powershell -command "(Get-Content python/python311._pth) -replace '#import site', 'import site' | Set-Content python/python311._pth"

REM Install pip
echo Installing pip...
python\python.exe python\get-pip.py

REM Install backend dependencies from requirements.txt
echo Installing all backend dependencies from requirements.txt...
python\python.exe -m pip install -r backend\requirements.txt

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo Python 3.11.9 embedded is now ready in the 'python' folder
echo All dependencies including OR-Tools have been installed
echo.
pause
