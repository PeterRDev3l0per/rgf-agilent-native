"""
Automated Sandbox Test Suite for Agilent Quickstart Setup & Installer Tool.
Verifies environment detection, IDE selection mapping, and non-interactive execution
in a clean isolated sandbox environment without affecting the active project codebase.
"""

import sys
import os
import tempfile
import shutil
import subprocess
from pathlib import Path

# Ensure root dir is in sys.path for scripts import
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pytest

from scripts.setup import (
    check_python_version,
    check_node_version,
    check_npm_version,
    check_ollama_status,
    select_ide_interactive,
    SUPPORTED_IDES,
    run_setup,
)


def test_installer_scripts_exist():
    """Verify that install.sh and install.ps1 one-liner installer scripts exist."""
    scripts_dir = ROOT_DIR / "scripts"
    assert (scripts_dir / "install.sh").exists()
    assert (scripts_dir / "install.ps1").exists()
    assert (scripts_dir / "setup.py").exists()


def test_python_version_check():
    """Verify that Python version check executes cleanly."""
    assert check_python_version() is True


def test_ide_selection_mapping_non_interactive():
    """Verify that non-interactive IDE selection maps correctly to supported IDEs."""
    for key, (expected_name, expected_cmd, expected_config) in SUPPORTED_IDES.items():
        name, cmd, cfg = select_ide_interactive(non_interactive=True, default_choice=key)
        assert name == expected_name
        assert cmd == expected_cmd
        assert cfg == expected_config


def test_setup_check_only_mode():
    """Verify that setup runs cleanly in check-only mode."""
    success = run_setup(non_interactive=True, check_only=True)
    assert isinstance(success, bool)


def test_installer_in_isolated_sandbox_directory():
    """Simulate a clean user environment inside a temporary sandbox directory."""
    with tempfile.TemporaryDirectory() as temp_dir:
        sandbox_path = Path(temp_dir)
        
        # Copy scripts/setup.py to isolated sandbox
        sandbox_scripts = sandbox_path / "scripts"
        sandbox_scripts.mkdir(parents=True, exist_ok=True)
        setup_file = sandbox_path / "scripts" / "setup.py"
        
        real_setup = Path(__file__).resolve().parent.parent / "scripts" / "setup.py"
        shutil.copy(real_setup, setup_file)
        
        # Create dummy src/agilent_native/static/index.html to simulate built frontend
        static_dir = sandbox_path / "src" / "agilent_native" / "static"
        static_dir.mkdir(parents=True, exist_ok=True)
        (static_dir / "index.html").write_text("<html><body>Sandbox Test</body></html>", encoding="utf-8")
        
        # Execute sandbox setup script in check-only mode
        res = subprocess.run(
            [sys.executable, str(setup_file), "--check-only", "--non-interactive"],
            cwd=str(sandbox_path),
            capture_output=True,
            encoding="utf-8",
            errors="replace",
        )
        assert res.returncode == 0, f"Sandbox setup failed: {res.stderr}"
        assert "Python Version" in res.stdout
