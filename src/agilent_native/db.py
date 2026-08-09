"""SQLite Database Manager for Agilent Native Suite."""

import logging
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from agilent_native.config import config

logger = logging.getLogger(__name__)


class DatabaseManager:
    """Embedded SQLite database repository with WAL mode support."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or config.db_path
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        """Create connection with WAL mode and row factory."""
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def _init_db(self) -> None:
        """Create tables if they do not exist."""
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        with self.get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL UNIQUE,
                    slug TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS work_items (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description_html TEXT NOT NULL DEFAULT '',
                    state TEXT NOT NULL DEFAULT 'Backlog',
                    start_date TEXT,
                    target_date TEXT,
                    release_tag TEXT,
                    test_status TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS comments (
                    id TEXT PRIMARY KEY,
                    work_item_id TEXT NOT NULL,
                    content_html TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (work_item_id) REFERENCES work_items(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS rag_documents (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    topic_key TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );
            """)

    def get_or_create_project(self, name: str) -> Dict[str, Any]:
        """Get or create project by name."""
        slug = name.lower().replace(" ", "-")
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM projects WHERE slug = ?", (slug,)).fetchone()
            if row:
                return dict(row)

            project_id = str(uuid.uuid4())
            now = datetime.now().isoformat()
            conn.execute(
                "INSERT INTO projects (id, name, slug, created_at) VALUES (?, ?, ?, ?)",
                (project_id, name, slug, now),
            )
            proj = {"id": project_id, "name": name, "slug": slug, "created_at": now}

        self.seed_initial_data(project_id)
        return proj

    def seed_initial_data(self, project_id: str) -> None:
        """Seed initial SDLC tasks if project has no work items."""
        items = self.list_work_items(project_id)
        if items:
            return

        seed_tasks = [
            {
                "title": "Agilent Native Architecture & Spec Setup 🚀",
                "description_html": "<p>Defined 3-layer architecture, OpenSpec contract, and low-token FastMCP schema.</p>",
                "state": "Done",
                "start_date": "2026-08-07",
                "target_date": "2026-08-08",
                "release_tag": "v0.1.0-alpha",
                "test_status": "Passed",
            },
            {
                "title": "FastMCP Gateway & SQLite DB Engine ⚡",
                "description_html": "<p>Implemented FastMCP server with track_event and sync_change tools and SQLite WAL manager.</p>",
                "state": "Done",
                "start_date": "2026-08-08",
                "target_date": "2026-08-09",
                "test_status": "6/6 Passed",
            },
            {
                "title": "Visual Kanban Board & Gantt Timeline UI 🎨",
                "description_html": "<p>Built glassmorphism React/Vite SPA with visual Kanban columns, drag and drop, and Gantt charts.</p>",
                "state": "In Progress",
                "start_date": "2026-08-09",
                "target_date": "2026-08-10",
                "test_status": "Testing",
            },
            {
                "title": "Interactive Local RAG Chatbot Integration 💬",
                "description_html": "<p>Integrated GPU Ollama (qwen3:14b) for zero paid token project QA and Spanish summary fallback.</p>",
                "state": "Verification",
                "start_date": "2026-08-09",
                "target_date": "2026-08-10",
                "test_status": "QA Verification",
            },
            {
                "title": "Playwright Automated E2E Regression Testing 🎭",
                "description_html": "<p>Automated Chromium browser testing for Kanban, Gantt, and RAG chat workflows.</p>",
                "state": "Backlog",
                "start_date": "2026-08-10",
                "target_date": "2026-08-11",
            },
        ]

        for task in seed_tasks:
            item = self.create_work_item(project_id, task["title"], task["description_html"])
            self.update_work_item(item["id"], {
                "state": task["state"],
                "start_date": task.get("start_date"),
                "target_date": task.get("target_date"),
                "release_tag": task.get("release_tag"),
                "test_status": task.get("test_status"),
            })

    def create_work_item(self, project_id: str, title: str, description_html: str = "") -> Dict[str, Any]:
        """Create new work item in SQLite."""
        item_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with self.get_connection() as conn:
            conn.execute(
                """INSERT INTO work_items 
                   (id, project_id, title, description_html, state, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, 'Backlog', ?, ?)""",
                (item_id, project_id, title, description_html or f"<p>{title}</p>", now, now),
            )
        return self.get_work_item(item_id)  # type: ignore

    def get_work_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve work item by ID."""
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM work_items WHERE id = ?", (item_id,)).fetchone()
            return dict(row) if row else None

    def get_work_item_by_title_slug(self, project_id: str, title: str) -> Optional[Dict[str, Any]]:
        """Find work item by title in a project."""
        with self.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM work_items WHERE project_id = ? AND title LIKE ?",
                (project_id, f"%{title}%"),
            ).fetchone()
            return dict(row) if row else None

    def update_work_item(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update fields of a work item dynamically."""
        if not updates:
            return self.get_work_item(item_id)

        valid_keys = {"title", "description_html", "state", "start_date", "target_date", "release_tag", "test_status"}
        filtered = {k: v for k, v in updates.items() if k in valid_keys}
        if not filtered:
            return self.get_work_item(item_id)

        filtered["updated_at"] = datetime.now().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in filtered.keys())
        values = list(filtered.values()) + [item_id]

        with self.get_connection() as conn:
            conn.execute(f"UPDATE work_items SET {set_clause} WHERE id = ?", values)
        return self.get_work_item(item_id)

    def add_comment(self, item_id: str, content_html: str) -> Dict[str, Any]:
        """Add an activity comment to a work item."""
        comment_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO comments (id, work_item_id, content_html, created_at) VALUES (?, ?, ?, ?)",
                (comment_id, item_id, content_html, now),
            )
        return {"id": comment_id, "work_item_id": item_id, "content_html": content_html, "created_at": now}

    def list_work_items(self, project_id: str) -> List[Dict[str, Any]]:
        """List all work items for a project."""
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM work_items WHERE project_id = ? ORDER BY updated_at DESC", (project_id,)).fetchall()
            return [dict(r) for r in rows]


db = DatabaseManager()
