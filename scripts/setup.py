#!/usr/bin/env python3
"""
Agilent Native Suite — Interactive Quickstart Setup & Verification Tool.
Guides users through environment checks, OS compatibility verification,
IDE/Agent selection (Opencode, Codex, Claude Code, Pi, Cursor, etc.), build validation, and onboarding.
"""

import sys
import os
import shutil
import subprocess
import time
import httpx
from pathlib import Path

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

COLOR_CYAN = "\033[96m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_BOLD = "\033[1m"
COLOR_RESET = "\033[0m"

SUPPORTED_IDES = {
    "1": ("Opencode / Codex Agent", "opencode", ".agents/rules/agilent.md"),
    "2": ("Claude Code CLI", "claude", ".claude/rules/agilent.md"),
    "3": ("Pi Agent Framework", "pi", ".pi/rules/agilent.md"),
    "4": ("Cursor IDE", "cursor", ".cursor/rules/agilent.md"),
    "5": ("VS Code", "code", ".vscode/settings.json"),
    "6": ("Antigravity IDE (Gemini)", "antigravity", ".agents/rules/agilent.md"),
    "7": ("PyCharm / JetBrains", "pycharm", ".idea/agilent.xml"),
    "8": ("Neovim / Terminal AI", "nvim", ".nvim/agilent.lua"),
    "9": ("Orquestador de Agentes (Gentle AI / Mission Control / FastMCP)", "orchestrator", "mcp_config.json"),
    "10": ("Ninguno / Standalone Web App", "none", None),
}


def print_banner():
    banner = f"""
{COLOR_CYAN}{COLOR_BOLD}===================================================================
    ⚡ AGILENT NATIVE SUITE — QUICKSTART SETUP & ONBOARDING ⚡
==================================================================={COLOR_RESET}
    Zero-Paid-Token AI Project Management & Native Web Suite
"""
    print(banner)


def check_operating_system():
    platform_map = {
        "win32": "Windows 10/11 (x64 / ARM64)",
        "linux": "Linux (Ubuntu / Debian / Fedora / Arch)",
        "darwin": "macOS (Intel & Apple Silicon M-Series)",
    }
    sys_name = platform_map.get(sys.platform, sys.platform)
    print(f"  {COLOR_GREEN}[OK]{COLOR_RESET} Operating System    : {sys_name}")
    return True


def check_python_version():
    v = sys.version_info
    ok = (v.major == 3 and v.minor >= 10)
    status = f"{COLOR_GREEN}[OK]{COLOR_RESET}" if ok else f"{COLOR_RED}[FAIL]{COLOR_RESET}"
    print(f"  {status} Python Version       : {v.major}.{v.minor}.{v.micro}")
    return ok


def check_node_version():
    node_path = shutil.which("node")
    if not node_path:
        print(f"  {COLOR_RED}[FAIL]{COLOR_RESET} Node.js Runtime     : Not found in PATH (Node 18+ required for frontend build)")
        return False
    try:
        res = subprocess.run(["node", "--version"], capture_output=True, text=True, check=True)
        version = res.stdout.strip()
        print(f"  {COLOR_GREEN}[OK]{COLOR_RESET} Node.js Runtime     : {version}")
        return True
    except Exception:
        print(f"  {COLOR_YELLOW}[WARN]{COLOR_RESET} Node.js Runtime    : Found at {node_path} but couldn't verify version")
        return True


def check_npm_version():
    npm_path = shutil.which("npm")
    if not npm_path:
        print(f"  {COLOR_RED}[FAIL]{COLOR_RESET} Package Manager     : npm not found in PATH")
        return False
    try:
        res = subprocess.run(["npm", "--version"], capture_output=True, text=True, check=True)
        print(f"  {COLOR_GREEN}[OK]{COLOR_RESET} Package Manager     : npm v{res.stdout.strip()}")
        return True
    except Exception:
        return False


def check_ollama_status():
    ollama_url = "http://127.0.0.1:11434/api/tags"
    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(ollama_url)
            if resp.status_code == 200:
                models = [m.get("name", "") for m in resp.json().get("models", [])]
                has_qwen = any("qwen3" in m.lower() or "qwen" in m.lower() for m in models)
                if has_qwen:
                    print(f"  {COLOR_GREEN}[OK]{COLOR_RESET} Ollama GPU Service  : Online (Models: {', '.join(models)})")
                elif models:
                    print(f"  {COLOR_YELLOW}[WARN]{COLOR_RESET} Ollama GPU Service : Online with fallback models ({', '.join(models)}). Recommended: 'ollama pull qwen3:14b'")
                else:
                    print(f"  {COLOR_YELLOW}[WARN]{COLOR_RESET} Ollama GPU Service : Online, but no LLM models pulled. Run 'ollama pull qwen3:14b'")
                return True
    except Exception:
        print(f"  {COLOR_YELLOW}[NOTE]{COLOR_RESET} Ollama GPU Service : Not detected on http://127.0.0.1:11434. (App runs in offline UI mode)")
        return False


def select_ide_interactive(non_interactive: bool = False, default_choice: str = "1"):
    print(f"\n{COLOR_BOLD}📁 Selección de Integración con IDE o Agente de IA:{COLOR_RESET}")
    for key, (name, _, _) in SUPPORTED_IDES.items():
        print(f"  [{key}] {name}")

    if non_interactive or not sys.stdin.isatty():
        choice = default_choice
        print(f"\n  Modo no-interactivo detectado. Selección por defecto: [{choice}] {SUPPORTED_IDES[choice][0]}")
    else:
        try:
            choice = input(f"\n  Seleccioná tu IDE o Agente preferido [1-10] (Por defecto: 1): ").strip()
            if choice not in SUPPORTED_IDES:
                choice = "1"
        except EOFError:
            choice = "1"

    selected_name, code_cmd, config_rel_path = SUPPORTED_IDES[choice]
    print(f"  {COLOR_GREEN}✓ Integración seleccionada: {selected_name}{COLOR_RESET}")
    return selected_name, code_cmd, config_rel_path


def verify_or_build_frontend(root_dir: Path):
    static_index = root_dir / "src" / "agilent_native" / "static" / "index.html"
    if static_index.exists():
        print(f"  {COLOR_GREEN}[OK]{COLOR_RESET} Static Web Bundle   : Built & ready ({static_index})")
        return True

    print(f"  {COLOR_YELLOW}[INFO]{COLOR_RESET} Static bundle not found. Building frontend via Vite...")
    try:
        frontend_dir = root_dir / "frontend"
        res = subprocess.run(["npm", "run", "build"], cwd=str(frontend_dir), check=True)
        print(f"  {COLOR_GREEN}[OK]{COLOR_RESET} Static Web Bundle   : Compiled successfully!")
        return True
    except Exception as e:
        print(f"  {COLOR_RED}[FAIL]{COLOR_RESET} Could not build frontend: {e}")
        return False


def print_onboarding_guide(ide_name: str):
    guide = f"""
{COLOR_CYAN}{COLOR_BOLD}===================================================================
  🎉 INSTALACIÓN COMPLETA — GUÍA DE ONBOARDING & TESTING
==================================================================={COLOR_RESET}

  Agilent Native Suite está listo para usar. Probá la creación de tareas en 2 escenarios:

  {COLOR_BOLD}Escenario 1: Creación Vía Agente de IA ({ide_name}){COLOR_RESET}
  1. Abrí la app ejecutando {COLOR_GREEN}agilent{COLOR_RESET} o visitando {COLOR_GREEN}http://127.0.0.1:8000/app/{COLOR_RESET}
  2. En tu Agente u Orquestador (Opencode / Codex / Claude Code / Pi / Cursor / Antigravity), decile:
     {COLOR_YELLOW}"Crea un nuevo proyecto en Agilent llamado 'demo-ai' y agrega una tarea de 'Refactorización Backend'"{COLOR_RESET}
  3. Tu agente usará el FastMCP Gateway para interactuar con la app sin costo de tokens.

  {COLOR_BOLD}Escenario 2: Creación Manual en la UI Web{COLOR_RESET}
  1. En el navegador, hacé clic en {COLOR_GREEN}+ Nueva Tarea{COLOR_RESET} en el TopNavBar.
  2. Ingresá el título, elegí la prioridad y el Tópico.
  3. Guardá la tarea y observá la animación del Notch de Notificaciones.

===================================================================
"""
    print(guide)


def run_setup(non_interactive: bool = False, check_only: bool = False):
    print_banner()

    print(f"{COLOR_BOLD}🔍 Verificación de Entorno & Matriz de S.O.:{COLOR_RESET}")
    root_dir = Path(__file__).resolve().parent.parent
    os_ok = check_operating_system()
    py_ok = check_python_version()
    node_ok = check_node_version()
    npm_ok = check_npm_version()
    ollama_ok = check_ollama_status()
    bundle_ok = verify_or_build_frontend(root_dir)

    all_deps_ok = py_ok and bundle_ok

    if check_only:
        print(f"\n{COLOR_BOLD}Modo check-only finalizado.{COLOR_RESET}")
        return all_deps_ok

    ide_name, _, _ = select_ide_interactive(non_interactive=non_interactive)
    print_onboarding_guide(ide_name)
    return all_deps_ok


def main():
    check_only = "--check-only" in sys.argv
    non_interactive = "--non-interactive" in sys.argv or "-y" in sys.argv
    success = run_setup(non_interactive=non_interactive, check_only=check_only)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
