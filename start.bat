@echo off
title VarshaMitra Starter
echo ========================================
echo     Starting VarshaMitra Platform       
echo ========================================

cd /d "%~dp0"

echo [1/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "VarshaMitra Backend" cmd /k ".\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak > nul

echo [2/3] Launching Next.js Frontend on http://localhost:3000 ...
start "VarshaMitra Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo [3/3] Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo VarshaMitra is now running!
echo • Frontend: http://localhost:3000
echo • Backend:  http://127.0.0.1:8000
echo • API Docs: http://127.0.0.1:8000/docs

