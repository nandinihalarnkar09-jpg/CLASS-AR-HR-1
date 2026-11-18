@echo off
title Meridian ATS (local)
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org
  echo then double-click this file again.
  echo Meanwhile, the live version works without installing anything:
  echo   https://nandinihalarnkar09-jpg.github.io/CLASS-AR-HR-1/
  start https://nodejs.org
  pause
  exit /b 1
)

node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 (
  echo Your Node.js is too old. Meridian ATS needs Node 22.13 or newer ^(Node 24 LTS recommended^).
  echo Install the LTS version from https://nodejs.org and run this file again.
  start https://nodejs.org
  pause
  exit /b 1
)

echo [1/3] Installing packages (first run takes a minute)...
call npm install --no-audit --no-fund
if errorlevel 1 goto failed
call npm install --prefix client --no-audit --no-fund
if errorlevel 1 goto failed

echo [2/3] Building the website...
call npm run build
if errorlevel 1 goto failed

echo [3/3] Starting Meridian ATS on http://localhost:5173
echo Keep THIS window open while you use the app. Close it to stop.
set PORT=5173
start "" "http://localhost:5173/"
node server\index.js
pause
exit /b 0

:failed
echo.
echo Something failed above. Take a screenshot of this window.
pause
exit /b 1
