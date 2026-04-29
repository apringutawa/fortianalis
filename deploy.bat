@echo off
REM FortiAnalis Quick Deploy Script for Windows
REM Usage: deploy.bat

echo 🚀 FortiAnalis Deployment Script
echo ================================
echo.

REM Check if git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git is not installed. Please install git first.
    exit /b 1
)

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  Installing Vercel CLI...
    call npm install -g vercel
)

REM Check if Railway CLI is installed
where railway >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Installing Railway CLI...
    call npm install -g @railway/cli
)

echo.
echo 1️⃣ Deploying Backend to Railway...
echo -----------------------------------
cd backend
call railway login 2>nul
call railway init -n fortianalis-backend 2>nul
call railway up -d
cd ..

echo.
echo 2️⃣ Deploying Frontend to Vercel...
echo -----------------------------------
cd frontend
call vercel login 2>nul
call vercel --prod --yes
cd ..

echo.
echo ================================
echo  Deployment Complete!
echo ================================
echo.
echo Next steps:
echo 1. Add GEMINI_API_KEY to Railway environment variables
echo 2. Add your Vercel domain to ALLOWED_ORIGINS in Railway
echo 3. Test your deployed application!
pause
