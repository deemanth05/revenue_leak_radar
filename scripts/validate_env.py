# Revenue Leak Radar — Environment Validation Script
# Run: python scripts/validate_env.py
# Checks all prerequisites before starting development

import sys
import subprocess
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def check(label: str, result: bool, detail: str = "", warning: bool = False) -> bool:
    icon = "✓" if result else ("⚠" if warning else "✗")
    color = GREEN if result else (YELLOW if warning else RED)
    print(f"  {color}{icon}{RESET} {label}", end="")
    if detail:
        print(f" {BLUE}({detail}){RESET}", end="")
    print()
    return result


def run_cmd(cmd: list[str]) -> tuple[bool, str]:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        return result.returncode == 0, result.stdout.strip() or result.stderr.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False, "not found"


def check_python_version():
    major, minor = sys.version_info[:2]
    ok = major == 3 and minor >= 11
    check(
        f"Python {major}.{minor}",
        ok,
        f"required: 3.11+",
        warning=not ok,
    )
    return ok


def check_node():
    ok, version = run_cmd(["node", "--version"])
    check("Node.js", ok, version if ok else "not installed")
    return ok


def check_pnpm():
    ok, version = run_cmd(["pnpm", "--version"])
    check("pnpm", ok, version if ok else "run: npm install -g pnpm")
    return ok


def check_docker():
    ok, version = run_cmd(["docker", "--version"])
    check("Docker", ok, version.split(",")[0] if ok else "not installed")
    return ok


def check_docker_running():
    ok, _ = run_cmd(["docker", "info"])
    check("Docker daemon", ok, "running" if ok else "start Docker Desktop")
    return ok


def check_env_file():
    env_path = ROOT / ".env"
    ok = env_path.exists()
    check(".env file", ok, str(env_path) if ok else "copy .env.example → .env")
    return ok


def check_env_vars():
    env_path = ROOT / ".env"
    if not env_path.exists():
        return False

    content = env_path.read_text()
    required = ["DATABASE_URL", "SECRET_KEY"]
    optional_ai = ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"]

    all_ok = True
    for var in required:
        has = var in content and f"{var}=" in content
        val = ""
        for line in content.split("\n"):
            if line.startswith(f"{var}=") and len(line.split("=", 1)[1].strip()) > 0:
                val = "set"
                break
        ok = bool(val)
        if not ok:
            all_ok = False
        check(f"  ENV: {var}", ok, val if ok else "missing or empty")

    # Check at least one AI key
    ai_keys = []
    for var in optional_ai:
        for line in content.split("\n"):
            if line.startswith(f"{var}=") and len(line.split("=", 1)[1].strip()) > 4:
                ai_keys.append(var)
                break

    has_ai = len(ai_keys) > 0
    check(
        "  AI Provider key",
        has_ai,
        ", ".join(ai_keys) if has_ai else "set at least one: GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY (or set AI_MOCK_MODE=true)",
        warning=not has_ai,
    )

    return all_ok


def check_backend_deps():
    venv_path = ROOT / "apps" / "backend" / ".venv"
    ok = venv_path.exists()
    check("Backend .venv", ok, str(venv_path) if ok else "run: cd apps/backend && python -m venv .venv && .venv/Scripts/activate && pip install -r requirements.txt")
    return ok


def check_frontend_deps():
    nm_path = ROOT / "apps" / "frontend" / "node_modules"
    ok = nm_path.exists()
    check("Frontend node_modules", ok, "installed" if ok else "run: pnpm install")
    return ok


def check_postgres_reachable():
    """Try to connect to PostgreSQL via Docker."""
    ok, _ = run_cmd(["docker", "ps", "--filter", "name=rlr_postgres", "--format", "{{.Names}}"])
    # Check if rlr_postgres container is in the output
    _, containers = run_cmd(["docker", "ps", "--filter", "name=rlr_postgres", "--format", "{{.Names}}"])
    running = "rlr_postgres" in containers
    check(
        "PostgreSQL container",
        running,
        "running" if running else "run: docker-compose up -d",
        warning=not running,
    )
    return running


def main():
    print(f"\n{BOLD}Revenue Leak Radar — Environment Validation{RESET}")
    print("=" * 50)

    failures = []
    warnings = []

    print(f"\n{BOLD}[ Runtime ]{RESET}")
    if not check_python_version():
        failures.append("Python 3.11+")
    check_node()
    if not check_pnpm():
        warnings.append("pnpm not installed")

    print(f"\n{BOLD}[ Infrastructure ]{RESET}")
    docker_ok = check_docker()
    if docker_ok:
        daemon_ok = check_docker_running()
        if daemon_ok:
            check_postgres_reachable()
    else:
        failures.append("Docker not installed")

    print(f"\n{BOLD}[ Configuration ]{RESET}")
    env_ok = check_env_file()
    if env_ok:
        check_env_vars()

    print(f"\n{BOLD}[ Dependencies ]{RESET}")
    if not check_backend_deps():
        warnings.append("Backend deps not installed")
    if not check_frontend_deps():
        warnings.append("Frontend deps not installed")

    print("\n" + "=" * 50)

    if failures:
        print(f"\n{RED}{BOLD}✗ FAILED — {len(failures)} critical issue(s):{RESET}")
        for f in failures:
            print(f"  {RED}• {f}{RESET}")
        sys.exit(1)
    elif warnings:
        print(f"\n{YELLOW}{BOLD}⚠ READY WITH WARNINGS — {len(warnings)} issue(s):{RESET}")
        for w in warnings:
            print(f"  {YELLOW}• {w}{RESET}")
        print(f"\n{GREEN}Run 'pnpm setup' to resolve automatically.{RESET}")
    else:
        print(f"\n{GREEN}{BOLD}✓ ALL CHECKS PASSED — Ready to develop!{RESET}")
        print(f"\n  {BLUE}pnpm dev:frontend{RESET}  →  http://localhost:3000")
        print(f"  {BLUE}pnpm dev:backend{RESET}   →  http://localhost:8000")
        print(f"  {BLUE}pnpm seed{RESET}          →  Seed demo data")
    print()


if __name__ == "__main__":
    main()
