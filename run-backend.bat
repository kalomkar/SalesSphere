@echo off
setlocal
cd /d "%~dp0backend"

echo ========================================
echo   SalesSphere AI - Backend
echo ========================================
echo.

if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  python -m venv .venv
  if errorlevel 1 (
    echo Failed to create virtual environment.
    pause
    exit /b 1
  )
)

call ".venv\Scripts\activate.bat"

echo Installing/checking backend packages...
python -m pip install -r requirements.txt
if errorlevel 1 (
  echo Failed to install backend packages.
  pause
  exit /b 1
)

echo.
echo Seeding database. This is safe to run again.
python seed.py
if errorlevel 1 (
  echo.
  echo Database seed failed.
  echo Check that XAMPP MySQL is running and root password in .env is correct.
  pause
  exit /b 1
)

echo.
echo Starting Flask API on http://localhost:5000
python run.py
pause
