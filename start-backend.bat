@echo off
echo 🚀 Starting Nutrition App Backend Server...
echo ==================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if the backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Set environment variables
set NODE_ENV=development
set PORT=3000

echo 📋 Configuration:
echo    Environment: %NODE_ENV%
echo    Port: %PORT%
echo    API Endpoint: http://localhost:%PORT%/api
echo    tRPC Endpoint: http://localhost:%PORT%/api/trpc
echo.

echo 🔄 Starting server...
echo    Press Ctrl+C to stop the server
echo    Server logs will appear below:
echo ==================================

REM Start the server
node server.js

pause