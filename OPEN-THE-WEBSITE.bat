@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. localhost:5173 cannot work without it.
  echo Install LTS from https://nodejs.org then run this file again.
  echo.
  echo Meanwhile you can double-click ats.html to open the demo site.
  start https://nodejs.org
  pause
  exit /b 1
)

echo Installing website packages...
call npm install --prefix client
if errorlevel 1 (
  echo Could not install the website.
  pause
  exit /b 1
)

echo Starting optional API...
call npm install
start "ATS-API" cmd /c "node server\index.js"

echo.
echo ============================================
echo  ATS software is starting
echo  Open Chrome and go to:
echo     http://localhost:5173
echo  Keep THIS window open.
echo  If 5173 is busy, check the URL Vite prints.
echo ============================================
echo.
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"
call npm run web
pause
