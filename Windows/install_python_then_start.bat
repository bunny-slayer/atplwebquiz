@echo off
REM Installs Python for users who do not already have it, then starts the quiz.
REM This script keeps questions.csv as an external file and does not modify the quiz data.

REM This script lives in atplwebquiz\Windows. Step up to the website folder.
cd /d "%~dp0.."

echo ATPL Air Law Quiz setup
echo =======================
echo.

python --version >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Python is already installed.
  call "%~dp0clicktostart.bat"
  goto :eof
)

py -3 --version >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Python is already installed.
  call "%~dp0clicktostart.bat"
  goto :eof
)

echo Python was not found on this computer.
echo This script will try to install Python 3 automatically.
echo You may see a Windows permission prompt or installer window.
echo.
pause

where winget >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Installing Python with winget...
  winget install --id Python.Python.3.12 -e --source winget --accept-package-agreements --accept-source-agreements
  if not errorlevel 1 goto :refresh_and_start
  echo winget installation did not complete successfully.
  echo Trying direct download from python.org...
)

echo Downloading Python installer from python.org...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$url='https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe';" ^
  "$out=Join-Path $env:TEMP 'python-3.12-installer.exe';" ^
  "Invoke-WebRequest -Uri $url -OutFile $out;" ^
  "Start-Process -FilePath $out -ArgumentList '/quiet InstallAllUsers=0 PrependPath=1 Include_test=0' -Wait"

if not %ERRORLEVEL%==0 (
  echo.
  echo [!] Automatic Python installation failed.
  echo     Please install Python manually from https://www.python.org/downloads/
  echo     Then double-click clicktostart.bat.
  pause
  goto :eof
)

:refresh_and_start
REM Refresh PATH for the current command window after a per-user Python install.
set "PATH=%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts;%PATH%"

python --version >nul 2>nul
if %ERRORLEVEL%==0 (
  echo.
  echo Python installed successfully.
  call "%~dp0clicktostart.bat"
  goto :eof
)

py -3 --version >nul 2>nul
if %ERRORLEVEL%==0 (
  echo.
  echo Python installed successfully.
  call "%~dp0clicktostart.bat"
  goto :eof
)

echo.
echo [!] Python may have installed, but it was not found in this command window yet.
echo     Close this window and double-click clicktostart.bat again.
pause
