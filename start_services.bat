@echo off
echo ===================================================
echo   CivicPulse AI - Starting Full Suite (Front & Back)
echo ===================================================

echo [1/4] Starting FastAPI Backend on http://localhost:8000 ...
start "CivicPulse - Backend (8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn civicpulse_app.main:app --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/4] Starting Citizen PWA on http://localhost:3000 ...
start "CivicPulse - Citizen PWA (3000)" cmd /k "cd /d %~dp0 && npm --workspace=@civicpulse/web-citizen run dev"

timeout /t 1 /nobreak >nul

echo [3/4] Starting Field Inspector on http://localhost:3001 ...
start "CivicPulse - Inspector App (3001)" cmd /k "cd /d %~dp0 && npm --workspace=@civicpulse/app-inspector run dev"

timeout /t 1 /nobreak >nul

echo [4/4] Starting Command Center Admin on http://localhost:3002 ...
start "CivicPulse - Command Center (3002)" cmd /k "cd /d %~dp0 && npm --workspace=@civicpulse/web-admin run dev"

echo.
echo All 4 services have been launched!
echo - Citizen Portal:      http://localhost:3000
echo - Field Inspector:     http://localhost:3001
echo - Admin Command Center: http://localhost:3002
echo - FastAPI Backend & Docs: http://localhost:8000/docs
echo ===================================================
pause
