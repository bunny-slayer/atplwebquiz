@echo off
REM Launches a tiny Python HTTP server in this folder and opens the quiz in your default browser.
REM Browsers block fetch() on file:// URLs, so a local server is required.

REM This script lives in atplwebquiz\Windows. Step up to the website folder.
cd /d "%~dp0.."

set PORT=8000
set "PY_CMD="

echo Starting ATPL Practice Quiz on http://localhost:%PORT% ...
echo Press Ctrl+C to stop the server when you're done.
echo.

REM Try python first, then the Windows Python launcher.
python --version >nul 2>nul
if %ERRORLEVEL%==0 (
  set "PY_CMD=python"
  goto :start_server
)

py -3 --version >nul 2>nul
if %ERRORLEVEL%==0 (
  set "PY_CMD=py -3"
  goto :start_server
)

echo.
echo [!] Python was not found.
echo     Double-click install_python_then_start.bat to install Python and open the quiz.
echo     Or install Python 3 manually from https://www.python.org/
pause
goto :eof

:start_server
REM Open the browser after Python is confirmed available.
start "" "http://localhost:%PORT%/index.html"
%PY_CMD% -m http.server %PORT%
