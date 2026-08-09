"""Configuration management for Agilent Native Suite."""

import os
from dataclasses import dataclass, field
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).parent.parent.parent.resolve()
DEFAULT_DB_PATH = str(ROOT_DIR / "agilent_native.db")


@dataclass
class AppConfig:
    db_path: str = field(default_factory=lambda: os.getenv("AGILENT_DB_PATH", DEFAULT_DB_PATH))
    ollama_base_url: str = field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))
    ollama_model: str = field(default_factory=lambda: os.getenv("OLLAMA_MODEL", "qwen3:14b"))
    server_host: str = field(default_factory=lambda: os.getenv("SERVER_HOST", "127.0.0.1"))
    server_port: int = field(default_factory=lambda: int(os.getenv("SERVER_PORT", "8000")))


config = AppConfig()
