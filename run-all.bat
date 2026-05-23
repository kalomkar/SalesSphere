@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   SalesSphere AI - Full App Launcher
echo ========================================
echo.

if not exist ".env" (
  echo Creating XAMPP-friendly .env file...
  > ".env" echo FLASK_ENV=development
  >> ".env" echo DEBUG=True
  >> ".env" echo SECRET_KEY=change-this-secret
  >> ".env" echo JWT_SECRET_KEY=change-this-jwt-secret
  >> ".env" echo PORT=5000
  >> ".env" echo CORS_ORIGINS=http://localhost:5173
  >> ".env" echo MYSQL_HOST=localhost
  >> ".env" echo MYSQL_PORT=3306
  >> ".env" echo MYSQL_USER=root
  >> ".env" echo MYSQL_PASSWORD=
  >> ".env" echo MYSQL_DB=salessphere
  >> ".env" echo MAIL_SERVER=smtp.gmail.com
  >> ".env" echo MAIL_PORT=587
  >> ".env" echo MAIL_USERNAME=
  >> ".env" echo MAIL_PASSWORD=
  >> ".env" echo MAIL_DEFAULT_SENDER=noreply@salessphere.ai
  >> ".env" echo GROK_API_KEY=
)

echo Applying XAMPP MySQL settings to .env...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p='.env'; $t=Get-Content $p -Raw; $vars=[ordered]@{MYSQL_HOST='localhost';MYSQL_PORT='3306';MYSQL_USER='root';MYSQL_PASSWORD='';MYSQL_DB='salessphere'}; foreach($k in $vars.Keys){ $line=$k+'='+$vars[$k]; if($t -match ('(?m)^'+[regex]::Escape($k)+'=')){ $t=[regex]::Replace($t, '(?m)^'+[regex]::Escape($k)+'=.*', $line) } else { $t += \"`r`n$line\" } }; Set-Content -Path $p -Value $t -NoNewline"

echo Checking MySQL on localhost:3306...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=(Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded; if($ok){exit 0}else{exit 1}"
if errorlevel 1 (
  echo MySQL is not responding.
  echo.
  echo Please open XAMPP Control Panel and click Start next to MySQL.
  echo Then run this file again.
  echo.
  pause
  exit /b 1
)

echo Starting backend and frontend in separate windows...
start "SalesSphere Backend" cmd /k "%~dp0run-backend.bat"
timeout /t 5 /nobreak >nul
start "SalesSphere Frontend" cmd /k "%~dp0run-frontend.bat"

echo.
echo Launched. Keep both terminal windows open.
echo Frontend: http://localhost:5173
echo Backend health: http://localhost:5000/api/health
echo Login: admin@salessphere.ai / admin123
echo.
pause
