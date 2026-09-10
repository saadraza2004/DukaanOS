@echo off
title DukaanOS Shutdown
color 0C
cls
echo ===================================================
echo             CLOSING DUKAAN OS...
echo ===================================================
echo.
echo Stopping DukaanOS Backend (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Stopping DukaanOS Frontend (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ===================================================
echo   DUKAAN OS IS NOW CLOSED.
echo   Shukriya! Dukaan servers band ho gaye hain.
echo ===================================================
echo.
timeout /t 3 >nul
