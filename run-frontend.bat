@echo off
setlocal
cd /d "%~dp0frontend"

echo ========================================
echo   SalesSphere AI - Frontend
echo ========================================
echo.

if not exist "node_modules" (
  echo Installing frontend packages...
  npm install
  if errorlevel 1 (
    echo Failed to install frontend packages.
    pause
    exit /b 1
  )
)

echo Starting Vite frontend on http://localhost:5173
npm run dev
pause
