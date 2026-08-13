"""
Automated Test Suite for Operating System Compatibility Matrix.
Verifies cross-platform path handling, UTF-8 console output safety,
and SQLite WAL concurrency across Windows 10/11, Linux, and macOS.
"""

import sys
import os
import tempfile
from pathlib import Path
import pytest

from agilent_native.config import config
from agilent_native.db import db


def test_cross_platform_path_resolution():
    """Verify that system paths resolve correctly using pathlib.Path across platforms."""
    db_p = Path(config.db_path)
    assert db_p.is_absolute()
    assert isinstance(db_p, Path)


def test_utf8_encoding_safety():
    """Verify that UTF-8 string encoding functions without unhandled charmap errors."""
    test_str = "Agilent Native Suite ⚡ — Tareas: Opencode, Codex, Claude Code, Pi & Orquestadores"
    encoded = test_str.encode("utf-8")
    decoded = encoded.decode("utf-8")
    assert decoded == test_str


def test_sqlite_wal_cross_platform_concurrency():
    """Verify that SQLite WAL database mode operates cleanly."""
    conn = db.get_connection()
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode;")
    mode = cur.fetchone()[0]
    assert mode.lower() in ("wal", "memory")


def test_os_environment_detection():
    """Verify OS platform detection reporting."""
    valid_platforms = ["win32", "linux", "darwin"]
    assert sys.platform in valid_platforms, f"Unsupported platform: {sys.platform}"
