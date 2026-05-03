@echo off
echo ===================================================
echo Setting up Digital Governance License System Project
echo ===================================================

echo.
echo [1/2] Setting up Backend Environment...
cd backend

if not exist ".env" (
    echo 📄 Creating .env from .env.example...
    copy .env.example .env >nul
) else (
    echo 📄 .env already exists.
)

echo.
echo [2/2] Installing Backend Dependencies...
call npm install

cd ..

echo.
echo ===================================================
echo ✅ Setup Complete!
echo ===================================================
echo.
echo To start the development server, run:
echo   cd backend
echo   npm run start:dev
echo.
pause
