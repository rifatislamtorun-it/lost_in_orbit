@echo off
setlocal EnableExtensions
title Lost In Orbit - StellarSpark
cd /d "%~dp0"
echo ==================================================
echo    LOST IN ORBIT  -  StellarSpark
echo    One-click setup and launcher  (Windows)
echo ==================================================
echo.

rem ---------- 1. Node.js ----------
where node >nul 2>nul
if %errorlevel%==0 goto have_node

echo [1/4] Node.js was not found. Installing Node.js LTS now...
echo       (Windows may ask for permission - click Yes.)
where winget >nul 2>nul
if not %errorlevel%==0 goto manual_node
winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
goto refresh_path

:manual_node
echo       winget not found - downloading the Node.js installer instead...
powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile '%TEMP%\node_setup.msi'"
if not exist "%TEMP%\node_setup.msi" goto node_fail
msiexec /i "%TEMP%\node_setup.msi" /passive /norestart

:refresh_path
set "PATH=%PATH%;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs"
where node >nul 2>nul
if not %errorlevel%==0 goto node_fail

:have_node
for /f "tokens=*" %%v in ('node -v') do set NODEV=%%v
echo [1/4] Node.js %NODEV% is ready.

rem ---------- 2. Packages ----------
if exist node_modules goto have_modules
echo [2/4] Installing game packages - first time only, internet needed...
call npm install --no-audit --no-fund
if errorlevel 1 goto npm_fail
goto after_modules
:have_modules
echo [2/4] Game packages already installed.
:after_modules

rem ---------- 3. Build ----------
if exist "dist\index.html" goto have_build
echo [3/4] Building the game - about 10-30 seconds...
call npm run build
if errorlevel 1 goto build_fail
goto after_build
:have_build
echo [3/4] Game already built. (Delete the "dist" folder to rebuild after changing the code.)
:after_build

rem ---------- 4. Play ----------
echo [4/4] Starting the game. Your browser will open automatically.
echo.
echo    Keep this window OPEN while you play.  Press Ctrl+C here to stop.
echo    If the browser does not open, go to:  http://localhost:4173
echo.
call npm run preview -- --open --port 4173
goto end

:node_fail
echo.
echo [ERROR] Could not install Node.js automatically.
echo         Please install it from https://nodejs.org  (choose the LTS version),
echo         then double-click RUN_GAME.bat again.
goto end

:npm_fail
echo.
echo [ERROR] "npm install" failed. Check your internet connection and try again.
goto end

:build_fail
echo.
echo [ERROR] The build failed. Please send a screenshot of this window.
goto end

:end
echo.
pause
endlocal
