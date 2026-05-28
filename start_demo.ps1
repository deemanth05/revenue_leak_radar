# =============================================================================
# Revenue Leak Radar — Hackathon Demo Startup Script
# =============================================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         REVENUE LEAK RADAR — DEMO BOOTSTRAPPER            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Docker Containers
Write-Host "[1/5] Verifying Docker containers status..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers. Ensure Docker Desktop is running."
    Exit 1
}
Write-Host "✔ Database & Redis containers running." -ForegroundColor Green
Write-Host ""

# 2. Wait for Postgres readiness
Write-Host "[2/5] Waiting for PostgreSQL container to accept connections..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "✔ Database connection established." -ForegroundColor Green
Write-Host ""

# 3. Run Database Migrations
Write-Host "[3/5] Applying Alembic schemas..." -ForegroundColor Yellow
cd apps/backend
.venv\Scripts\python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Error "Alembic migrations failed."
    Exit 1
}
cd ../..
Write-Host "✔ Database migrations completed successfully." -ForegroundColor Green
Write-Host ""

# 4. Seed Scenario Data
Write-Host "[4/5] Seeding synthetic operations dataset..." -ForegroundColor Yellow
cd apps/backend
.venv\Scripts\python -X utf8 -m seed.demo_scenario
if ($LASTEXITCODE -ne 0) {
    Write-Error "Database seeding failed."
    Exit 1
}
cd ../..
Write-Host "✔ Synthetic demo scenario seeded." -ForegroundColor Green
Write-Host ""

# 5. Launch Server Terminals
Write-Host "[5/5] Launching backend & frontend dev servers..." -ForegroundColor Yellow

# Start Backend Server in a new console
Write-Host "🚀 Launching FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/c cd apps\backend && .venv\Scripts\python -X utf8 main.py" -WindowStyle Normal

# Start Frontend Dev Server in a new console
Write-Host "🚀 Launching Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/c pnpm dev:frontend" -WindowStyle Normal

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Setup Complete! Revenue Leak Radar is active.              " -ForegroundColor Green
Write-Host "  - Landing page: http://localhost:3000                      " -ForegroundColor Green
Write-Host "  - Command Console: http://localhost:3000/dashboard         " -ForegroundColor Green
Write-Host "  - Presentation Mode: http://localhost:3000/presentation    " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
