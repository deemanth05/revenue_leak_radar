# =============================================================================
# Revenue Leak Radar — Demo Startup Script
# =============================================================================

Clear-Host
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "         REVENUE LEAK RADAR — DEMO BOOTSTRAPPER            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Port Availability Checks ──────────────────────────────────────────────
Write-Host "[0/5] Checking port availability..." -ForegroundColor Yellow

function Check-PortAvailability {
    param (
        [int]$Port,
        [string]$ServiceName
    )

    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        $dockerContainer = $null
        $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
        if ($dockerInstalled) {
            $dockerContainer = docker ps --filter "publish=$Port" --format "{{.Names}}"
        }

        if ($dockerContainer) {
            if ($dockerContainer -eq "rlr_postgres" -or $dockerContainer -eq "rlr_redis") {
                Write-Host "  [OK] Port $Port is occupied by our own container ($dockerContainer). Skipping conflict." -ForegroundColor Green
                return
            }
            
            Write-Host "  ⚠ Port $Port ($ServiceName) is already in use." -ForegroundColor Red
            Write-Host "  It is occupied by the Docker container: $dockerContainer" -ForegroundColor Red
            $response = Read-Host "  Stop this container? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Write-Host "  Stopping container $dockerContainer..." -ForegroundColor Yellow
                docker stop $dockerContainer | Out-Null
                Write-Host "  [OK] Stopped container $dockerContainer." -ForegroundColor Green
                Start-Sleep -Seconds 1
            }
            else {
                Write-Error "Port $Port must be free. Aborting."
                Exit 1
            }
        }
        else {
            Write-Host "  ⚠ Port $Port ($ServiceName) is already in use." -ForegroundColor Red
            Write-Host "  It is occupied by a local process with PID $($connection[0].OwningProcess)." -ForegroundColor Red
            $response = Read-Host "  Kill the process? (y/N)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Stop-Process -Id $connection[0].OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "  [OK] Killed process on port $Port." -ForegroundColor Green
                Start-Sleep -Seconds 1
            }
            else {
                Write-Error "Port $Port must be free. Aborting."
                Exit 1
            }
        }
    }
}

Check-PortAvailability -Port 8000 -ServiceName "FastAPI Backend"
Check-PortAvailability -Port 3000 -ServiceName "Next.js Frontend"
Check-PortAvailability -Port 5432 -ServiceName "PostgreSQL"
Check-PortAvailability -Port 6379 -ServiceName "Redis"

Write-Host "[OK] Required ports are available." -ForegroundColor Green
Write-Host ""

# ── 1. Start Docker Containers ───────────────────────────────────────────────
Write-Host "[1/5] Verifying Docker containers status..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers. Ensure Docker Desktop is running."
    Exit 1
}
Write-Host "[OK] Database & Redis containers running." -ForegroundColor Green
Write-Host ""

# ── 2. Wait for Postgres readiness (active poll) ────────────────────────────
Write-Host "[2/5] Waiting for PostgreSQL container to accept connections..." -ForegroundColor Yellow

$maxRetries = 30
$retryCount = 0
$pgReady = $false

# Primary container name is rlr_postgres, fallback to standard compose naming conventions
$containerNames = @("rlr_postgres", "revenue_leak_radar-postgres-1", "revenue_leak_radar_postgres_1")

foreach ($containerName in $containerNames) {
    if ($pgReady) { break }
    
    $containerExists = docker ps --filter "name=$containerName" --format "{{.Names}}"
    if (-not $containerExists) { continue }
    
    $retryCount = 0
    while (-not $pgReady -and $retryCount -lt $maxRetries) {
        $retryCount++
        $result = docker exec $containerName pg_isready -U rlr_user -d revenue_leak_radar 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pgReady = $true
        }
        else {
            Write-Host "  Attempt $retryCount/$maxRetries — waiting for Postgres in $containerName..." -ForegroundColor DarkYellow
            Start-Sleep -Seconds 1
        }
    }
}

if (-not $pgReady) {
    Write-Warning "Could not confirm PostgreSQL readiness via pg_isready. Proceeding with 5s fallback wait..."
    Start-Sleep -Seconds 5
}
else {
    Write-Host "[OK] PostgreSQL is accepting connections." -ForegroundColor Green
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
Write-Host "[OK] Database migrations completed successfully." -ForegroundColor Green
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
Write-Host "[OK] Synthetic demo scenario seeded." -ForegroundColor Green
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
