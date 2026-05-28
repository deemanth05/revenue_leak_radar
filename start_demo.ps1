# =============================================================================
# Revenue Leak Radar — Hackathon Demo Startup Script
# =============================================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         REVENUE LEAK RADAR — DEMO BOOTSTRAPPER            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Port Availability Checks ──────────────────────────────────────────────
Write-Host "[0/5] Checking port availability..." -ForegroundColor Yellow

$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port8000) {
    Write-Host "  ⚠ Port 8000 is already in use by PID $($port8000[0].OwningProcess)." -ForegroundColor Red
    $response = Read-Host "  Kill the process? (y/N)"
    if ($response -eq 'y') {
        Stop-Process -Id $port8000[0].OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  ✔ Killed process on port 8000." -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Error "Port 8000 must be free. Aborting."
        Exit 1
    }
}

if ($port3000) {
    Write-Host "  ⚠ Port 3000 is already in use by PID $($port3000[0].OwningProcess)." -ForegroundColor Red
    $response = Read-Host "  Kill the process? (y/N)"
    if ($response -eq 'y') {
        Stop-Process -Id $port3000[0].OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "  ✔ Killed process on port 3000." -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Error "Port 3000 must be free. Aborting."
        Exit 1
    }
}

Write-Host "✔ Ports 8000 and 3000 are available." -ForegroundColor Green
Write-Host ""

# ── 1. Start Docker Containers ───────────────────────────────────────────────
Write-Host "[1/5] Verifying Docker containers status..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers. Ensure Docker Desktop is running."
    Exit 1
}
Write-Host "✔ Database & Redis containers running." -ForegroundColor Green
Write-Host ""

# ── 2. Wait for Postgres readiness (active poll) ────────────────────────────
Write-Host "[2/5] Waiting for PostgreSQL container to accept connections..." -ForegroundColor Yellow

$maxRetries = 30
$retryCount = 0
$pgReady = $false

while (-not $pgReady -and $retryCount -lt $maxRetries) {
    $retryCount++
    $result = docker exec revenue_leak_radar-postgres-1 pg_isready -U rlr_admin -d revenue_leak_radar 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pgReady = $true
    } else {
        Write-Host "  Attempt $retryCount/$maxRetries — waiting for Postgres..." -ForegroundColor DarkYellow
        Start-Sleep -Seconds 1
    }
}

if (-not $pgReady) {
    # Fallback: try alternate container name
    $retryCount = 0
    while (-not $pgReady -and $retryCount -lt 10) {
        $retryCount++
        $result = docker exec revenue_leak_radar_postgres_1 pg_isready -U rlr_admin -d revenue_leak_radar 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pgReady = $true
        } else {
            Start-Sleep -Seconds 1
        }
    }
}

if (-not $pgReady) {
    Write-Warning "Could not confirm PostgreSQL readiness via pg_isready. Proceeding with 5s fallback wait..."
    Start-Sleep -Seconds 5
} else {
    Write-Host "✔ PostgreSQL is accepting connections." -ForegroundColor Green
}
Write-Host ""

# ── 3. Run Database Migrations ───────────────────────────────────────────────
Write-Host "[3/5] Applying Alembic schemas..." -ForegroundColor Yellow
Push-Location apps/backend
.venv\Scripts\python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Error "Alembic migrations failed."
    Pop-Location
    Exit 1
}
Pop-Location
Write-Host "✔ Database migrations completed successfully." -ForegroundColor Green
Write-Host ""

# ── 4. Seed Scenario Data ────────────────────────────────────────────────────
Write-Host "[4/5] Seeding synthetic operations dataset..." -ForegroundColor Yellow
Push-Location apps/backend
.venv\Scripts\python -X utf8 -m seed.demo_scenario
if ($LASTEXITCODE -ne 0) {
    Write-Error "Database seeding failed."
    Pop-Location
    Exit 1
}
Pop-Location
Write-Host "✔ Synthetic demo scenario seeded." -ForegroundColor Green
Write-Host ""

# ── 5. Launch Server Terminals ───────────────────────────────────────────────
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
Write-Host "  - Landing page:      http://localhost:3000                 " -ForegroundColor Green
Write-Host "  - Command Console:   http://localhost:3000/dashboard       " -ForegroundColor Green
Write-Host "  - Judge Mode:        http://localhost:3000/judge           " -ForegroundColor Green
Write-Host "  - Cinematic Demo:    http://localhost:3000/presentation    " -ForegroundColor Green
Write-Host "  - API Docs:          http://localhost:8000/docs            " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
