@echo off
set "ROOT=%~dp0"
echo ===================================================
echo Starting Digital Governance License System
echo ===================================================

echo.
if not exist "%ROOT%backend\" (
    echo [ERROR] Backend folder not found: "%ROOT%backend\"
    echo Please run this script from the project package location.
    pause
    exit /b 1
)

echo.
echo [1/2] Starting Backend Server...
start "Backend" cmd /k "cd /d ""%ROOT%backend"" && npm run start:dev"

echo.
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Opening Portals...
set "APPLICANT_PAGE=%ROOT%frontend\applicant_connected\connected\login\index.html"
set "PLATFORM_ADMIN_PAGE=%ROOT%frontend\platform_admin\login\index.html"

if exist "%APPLICANT_PAGE%" (start "" "%APPLICANT_PAGE%") else echo [WARN] Missing Applicant portal: "%APPLICANT_PAGE%"
if exist "%PLATFORM_ADMIN_PAGE%" (start "" "%PLATFORM_ADMIN_PAGE%") else echo [WARN] Missing Platform Admin portal: "%PLATFORM_ADMIN_PAGE%"
start "" "http://localhost:3000/api/docs"

echo.
echo ===================================================
echo ✅ TradeZo System is running!
echo Close this window at any time.
echo ===================================================
pause
