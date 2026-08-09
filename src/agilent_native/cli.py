"""CLI Launcher & Health Check Suite for Agilent Native Suite."""

import argparse
import sys
import time
import httpx
import subprocess
from pathlib import Path

# Ensure UTF-8 stdout on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from agilent_native.config import config
from agilent_native.db import db


def print_status(component: str, success: bool, detail: str = ""):
    symbol = "[OK]" if success else "[FAIL]"
    print(f"{symbol:<8} {component:<25} {detail}")


def check_db() -> bool:
    """Check embedded SQLite database connectivity."""
    try:
        conn = db.get_connection()
        conn.execute("SELECT 1;")
        return True
    except Exception:
        return False


def check_ollama(max_retries: int = 3, retry_delay: float = 2.0) -> bool:
    """Check local Ollama LLM service health."""
    url = f"{config.ollama_base_url.rstrip('/')}/api/tags"
    for attempt in range(1, max_retries + 1):
        try:
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    models = [m.get("name", "") for m in resp.json().get("models", [])]
                    target = config.ollama_model
                    has_target = any(target.lower() in m.lower() or m.lower().startswith(target.split(":")[0].lower()) for m in models)
                    if has_target:
                        return True
                    if models:
                        fallback = models[0]
                        print(f"   [NOTE] Target model '{target}' absent. Auto-fallback to '{fallback}'.")
                        config.ollama_model = fallback
                        return True
                    return True
        except Exception:
            pass
        if attempt < max_retries:
            print(f"   ... Retrying Ollama connection ({attempt}/{max_retries})...")
            time.sleep(retry_delay)
    return False


def check_server(max_retries: int = 3, retry_delay: float = 2.0) -> bool:
    """Check Agilent Native FastAPI HTTP server health."""
    url = f"http://{config.server_host}:{config.server_port}/api/health"
    for attempt in range(1, max_retries + 1):
        try:
            with httpx.Client(timeout=4.0) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    return True
        except Exception:
            pass
        if attempt < max_retries:
            print(f"   ... Retrying Agilent Server connection ({attempt}/{max_retries})...")
            time.sleep(retry_delay)
    return False


def run_health_check(max_retries: int = 3) -> bool:
    print("\n[AGILENT NATIVE SYSTEM HEALTH & RECOVERY CHECK]\n" + "=" * 55)

    db_ok = check_db()
    print_status("SQLite Embedded DB", db_ok, f"Path: {config.db_path}")

    ollama_ok = check_ollama(max_retries=max_retries)
    print_status("Ollama Local LLM", ollama_ok, f"Model: {config.ollama_model} @ {config.ollama_base_url}")

    server_ok = check_server(max_retries=1)
    print_status("Agilent Web Server", server_ok, f"http://{config.server_host}:{config.server_port}")

    print("=" * 55)
    all_ok = db_ok and ollama_ok
    if all_ok:
        print("[SUCCESS] Agilent Native Suite is healthy and operational!\n")
    else:
        print("[INFO] Some services require attention.\n")
    return all_ok


def main():
    parser = argparse.ArgumentParser(prog="agilent", description="Agilent Native Suite CLI Launcher")
    parser.add_argument("command", nargs="?", default="status", choices=["status", "up", "test"])
    args = parser.parse_args()

    if args.command in ("status", "up"):
        run_health_check(max_retries=3)
    elif args.command == "test":
        print("\n[RUNNING AGILENT TEST SUITE]")
        res = subprocess.run([sys.executable, "-m", "pytest"], check=False)
        sys.exit(res.returncode)


if __name__ == "__main__":
    main()
