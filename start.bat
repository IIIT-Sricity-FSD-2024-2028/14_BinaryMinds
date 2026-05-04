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
set "FO_PAGE=%ROOT%frontend\fo_connected\fodashboard\index.html"
set "DO_PAGE=%ROOT%frontend\do_connected\dashboard\index.html"
set "SUPERUSER_PAGE=%ROOT%frontend\superuser\index.html"

if exist "%APPLICANT_PAGE%" (start "" "%APPLICANT_PAGE%") else echo [WARN] Missing Applicant portal: "%APPLICANT_PAGE%"
if exist "%FO_PAGE%" (start "" "%FO_PAGE%") else echo [WARN] Missing FO portal: "%FO_PAGE%"
if exist "%DO_PAGE%" (start "" "%DO_PAGE%") else echo [WARN] Missing DO portal: "%DO_PAGE%"
if exist "%SUPERUSER_PAGE%" (start "" "%SUPERUSER_PAGE%") else echo [WARN] Missing Superuser portal: "%SUPERUSER_PAGE%"
start "" "http://localhost:3000/api/docs"

echo.
echo ===================================================
echo ✅ TradeZo System is running!
echo Close this window at any time.
echo ===================================================
pause
