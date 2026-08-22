@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js is not installed. The ATS web page cannot open without it.
  echo 1. Open https://nodejs.org
  echo 2. Install the LTS version
  echo 3. Close this window and double-click OPEN-THE-WEBSITE.bat again
  echo.
  start https://nodejs.org
  pause
  exit /b 1
)
echo Installing packages if needed...
call npm run install:all
echo.
echo Starting Meridian ATS. Your browser should open http://localhost:5173
echo Leave this window OPEN while you use the site.
echo.
start "" "http://localhost:5173"
call npm run dev
pause
