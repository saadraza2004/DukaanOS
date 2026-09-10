@echo off
title DukaanOS Launcher
color 0A
cls
echo ===================================================
echo             DUKAAN OS (???? ?? ???)
echo      Pakistani Retail POS & Inventory System
echo ===================================================
echo.
echo [1/3] Checking Database (PostgreSQL)...
sc query postgresql-x64-18 | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting PostgreSQL service...
    net start postgresql-x64-18 >nul 2>&1
)
echo      PostgreSQL is ready!

echo.
echo [2/3] Starting DukaanOS Backend Server...
netstat -ano | findstr ":5000" >nul
if %ERRORLEVEL% NEQ 0 (
    start "DukaanOS Backend" /d "%~dp0backend\DukaanOS.API" dotnet run --urls "http://0.0.0.0:5000"
    echo      Backend started on http://0.0.0.0:5000
) else (
    echo      Backend is already running on port 5000
)

echo.
echo [3/3] Starting DukaanOS Frontend App...
netstat -ano | findstr ":3000" >nul
if %ERRORLEVEL% NEQ 0 (
    start "DukaanOS Frontend" /d "%~dp0frontend" cmd /c "npm run dev"
    echo      Frontend started on http://localhost:3000
) else (
    echo      Frontend is already running on http://localhost:3000
)

echo.
echo Waiting 7 seconds for system and Next.js compiler startup...
timeout /t 7 /nobreak >nul

echo.
echo Launching DukaanOS in your browser...
start http://localhost:3000

echo.
echo ===================================================
echo   DUKAAN OS IS RUNNING!
echo   Browser address: http://localhost:3000
echo.
echo   Owner Login:   owner   / admin123
echo   Cashier Login: cashier / cashier123
echo.
echo   To close DukaanOS at night, double-click:
echo   STOP_DUKAAN_OS.bat
echo ===================================================
echo.
pause
