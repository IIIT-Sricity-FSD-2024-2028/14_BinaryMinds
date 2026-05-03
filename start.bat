@echo off
echo ===================================================
echo Starting Digital Governance License System
echo ===================================================

echo.
echo [1/2] Starting Backend Server...
start cmd /k "cd backend && npm run start:dev"

echo.
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Opening Portals...
start "" "frontend\applicant_connected\index.html"
start "" "frontend\fo_connected\login.html"
start "" "frontend\do_connected\login.html"
start "" "frontend\superuser\login.html"
start http://localhost:3000/api/docs

echo.
echo ===================================================
echo ✅ TradeZo System is running!
echo Close this window at any time.
echo ===================================================
pause
