# VarshaMitra - Startup Script for Windows PowerShell
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Starting VarshaMitra Platform       " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$Root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $Root

# 1. Start FastAPI Backend in a new window
Write-Host "[1/3] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; Write-Host 'VarshaMitra FastAPI Backend' -ForegroundColor Green; .\backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000"

# 2. Wait 2 seconds for backend initialization
Start-Sleep -Seconds 2

# 3. Start Next.js Frontend in a new window
Write-Host "[2/3] Launching Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root'; Write-Host 'VarshaMitra Next.js Frontend' -ForegroundColor Green; npm run dev"

# 4. Wait 3 seconds then open browser
Start-Sleep -Seconds 3
Write-Host "[3/3] Opening browser at http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host "`nVarshaMitra is now running!" -ForegroundColor Green
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "• Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "• API Docs: http://127.0.0.1:8000/docs" -ForegroundColor Yellow

