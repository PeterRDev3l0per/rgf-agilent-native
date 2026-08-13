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

import html
import re

def sanitize_text(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r'<script.*?>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'on\w+=".*?"', '', cleaned, flags=re.IGNORECASE)
    return html.escape(cleaned.strip())


def sanitize_html_content(content_html: str) -> str:
    if not content_html:
        return ""
    cleaned = re.sub(r'<script.*?>.*?</script>', '', content_html, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r'<(?!/?(p|strong|b|em|i|u|code|br|ul|ol|li|h1|h2|h3|h4|span|blockquote|pre)\b)[^>]*>', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'on\w+=".*?"', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def validate_slug(slug: str) -> str:
    if not slug:
        return "default-project"
    clean_slug = slug.lower().replace(" ", "-")
    clean_slug = re.sub(r'[^a-zA-Z0-9_-]', '', clean_slug)
    clean_slug = re.sub(r'-+', '-', clean_slug).strip('-')
    if not clean_slug:
        return "default-project"
    return clean_slug[:64]


class DatabaseManager:
    """Embedded SQLite WAL Database Manager."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or config.db_path
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA journal_mode = WAL;")
        return conn

    def _init_db(self) -> None:
        with self.get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS work_items (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description_html TEXT NOT NULL DEFAULT '',
                    state TEXT NOT NULL DEFAULT 'Backlog',
                    priority TEXT DEFAULT 'Media',
                    category TEXT DEFAULT 'Funcionalidad',
                    assignee TEXT DEFAULT 'Pedro',
                    start_date TEXT,
                    target_date TEXT,
                    release_tag TEXT,
                    test_status TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS share_tokens (
                    id TEXT PRIMARY KEY,
                    project_id TEXT NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,
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

                CREATE TABLE IF NOT EXISTS notifications (
                    id TEXT PRIMARY KEY,
                    project_id TEXT,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT DEFAULT 'info',
                    created_at TEXT NOT NULL
                );
            """)
            # Work items column migrations (idempotent)
            for col, col_def in [
                ("priority", "TEXT DEFAULT 'Media'"), 
                ("category", "TEXT DEFAULT 'Funcionalidad'"), 
                ("assignee", "TEXT DEFAULT 'Pedro'"),
                ("deleted_at", "TEXT DEFAULT NULL"),
                ("is_deleted", "INTEGER DEFAULT 0")
            ]:
                try:
                    conn.execute(f"ALTER TABLE work_items ADD COLUMN {col} {col_def}")
                except Exception:
                    pass

            try:
                conn.execute("ALTER TABLE notifications ADD COLUMN is_read INTEGER DEFAULT 0")
            except Exception:
                pass

    def get_or_create_project(self, name: str) -> Dict[str, Any]:
        """Get or create project by name/slug/id (used by MCP tools — idempotent)."""
        slug = validate_slug(name.strip()) if name else "nuevo-proyecto"
        clean_name = sanitize_text(name.strip()) if name else "Nuevo Proyecto"
        if not clean_name:
            clean_name = "Nuevo Proyecto"
        with self.get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM projects WHERE slug = ? OR LOWER(name) = LOWER(?) OR id = ?", 
                (slug, clean_name, name.strip())
            ).fetchone()
            if row:
                return dict(row)

            project_id = str(uuid.uuid4())
            now = datetime.now().isoformat()
            try:
                conn.execute(
                    "INSERT INTO projects (id, name, slug, created_at) VALUES (?, ?, ?, ?)",
                    (project_id, clean_name, slug, now),
                )
            except sqlite3.IntegrityError:
                row = conn.execute("SELECT * FROM projects WHERE slug = ? OR LOWER(name) = LOWER(?)", (slug, clean_name)).fetchone()
                if row:
                    return dict(row)
                unique_suffix = uuid.uuid4().hex[:4]
                slug = f"{slug}-{unique_suffix}"
                clean_name = f"{clean_name} ({unique_suffix})"
                conn.execute(
                    "INSERT INTO projects (id, name, slug, created_at) VALUES (?, ?, ?, ?)",
                    (project_id, clean_name, slug, now),
                )
            proj = {"id": project_id, "name": clean_name, "slug": slug, "created_at": now}

        self.create_notification(
            title="Nuevo Proyecto Configurado 🚀",
            message=f"El proyecto '{clean_name}' ha sido registrado en el sistema.",
            type="project_created",
            project_id=project_id,
        )
        return proj

    def create_project(self, name: str) -> Dict[str, Any]:
        """Create a new project from the UI (raises ValueError if duplicate name)."""
        clean_name = sanitize_text(name.strip()) if name else ""
        if not clean_name:
            raise ValueError("Project name cannot be empty")
        slug = validate_slug(clean_name)
        with self.get_connection() as conn:
            existing = conn.execute(
                "SELECT id FROM projects WHERE slug = ? OR name = ?", (slug, clean_name)
            ).fetchone()
            if existing:
                raise ValueError(f"A project named '{clean_name}' already exists")
            project_id = str(uuid.uuid4())
            now = datetime.now().isoformat()
            try:
                conn.execute(
                    "INSERT INTO projects (id, name, slug, created_at) VALUES (?, ?, ?, ?)",
                    (project_id, clean_name, slug, now),
                )
            except sqlite3.IntegrityError:
                raise ValueError(f"A project with slug '{slug}' already exists")
            proj = {
                "id": project_id,
                "name": clean_name,
                "slug": slug,
                "created_at": now,
            }
        self.create_notification(
            title="Nuevo Proyecto Creado 🚀",
            message=f"'{clean_name}' fue creado y guardado en SQLite.",
            type="project_created",
            project_id=project_id,
        )
        return proj

    def seed_initial_data(self, project_id: str) -> None:
        """No-op: projects start clean with 0 tasks."""
        pass

    def create_work_item(self, project_id: str, title: str, description_html: str = "") -> Dict[str, Any]:
        """Create new work item in SQLite with sanitized fields."""
        item_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        clean_title = sanitize_text(title)
        clean_desc = sanitize_html_content(description_html or f"<p>{clean_title}</p>")
        with self.get_connection() as conn:
            conn.execute(
                """INSERT INTO work_items 
                   (id, project_id, title, description_html, state, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, 'Backlog', ?, ?)""",
                (item_id, project_id, clean_title, clean_desc, now, now),
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

        valid_keys = {"title", "description_html", "state", "start_date", "target_date", "release_tag", "test_status", "priority", "category", "assignee"}
        filtered = {k: v for k, v in updates.items() if k in valid_keys}
        if not filtered:
            return self.get_work_item(item_id)

        filtered["updated_at"] = datetime.now().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in filtered.keys())
        values = list(filtered.values()) + [item_id]

        with self.get_connection() as conn:
            conn.execute(f"UPDATE work_items SET {set_clause} WHERE id = ?", values)
        return self.get_work_item(item_id)

    def create_share_token(self, project_id: str) -> str:
        """Generate cryptographically strong share token for project dashboard access."""
        import secrets
        token = secrets.token_urlsafe(16)
        token_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO share_tokens (id, project_id, token, created_at) VALUES (?, ?, ?, ?)",
                (token_id, project_id, token, now)
            )
        return token

    def validate_share_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate share token and return matching project."""
        with self.get_connection() as conn:
            row = conn.execute("SELECT * FROM share_tokens WHERE token = ?", (token,)).fetchone()
            if not row:
                return None
            return dict(conn.execute("SELECT * FROM projects WHERE id = ?", (row["project_id"],)).fetchone() or {})

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
        """List active work items for a project (excluding soft-deleted ones)."""
        with self.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM work_items WHERE project_id = ? AND (state != 'deleted' AND state != 'Deleted') AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY updated_at DESC", 
                (project_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    def list_deleted_work_items(self, project_id: str) -> List[Dict[str, Any]]:
        """List soft-deleted work items for audit or RAG queries."""
        with self.get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM work_items WHERE project_id = ? AND (state = 'deleted' OR state = 'Deleted' OR is_deleted = 1) ORDER BY deleted_at DESC",
                (project_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    def list_projects(self) -> List[Dict[str, Any]]:
        """List all projects ordered by creation date."""
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
            return [dict(r) for r in rows]

    def delete_work_item(self, item_id: str) -> bool:
        """Soft delete a work item by ID (sets state='deleted', is_deleted=1, deleted_at timestamp)."""
        now = datetime.now().isoformat()
        with self.get_connection() as conn:
            res = conn.execute(
                "UPDATE work_items SET state = 'deleted', is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?",
                (now, now, item_id)
            )
            return res.rowcount > 0

    def create_notification(self, title: str, message: str, type: str = "info", project_id: Optional[str] = None) -> Dict[str, Any]:
        """Record a notification event."""
        notif_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        with self.get_connection() as conn:
            conn.execute(
                "INSERT INTO notifications (id, project_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (notif_id, project_id, title, message, type, now),
            )
        return {"id": notif_id, "project_id": project_id, "title": title, "message": message, "type": type, "created_at": now}

    def list_notifications(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch latest system notifications."""
        with self.get_connection() as conn:
            rows = conn.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
            return [dict(r) for r in rows]

    def clear_all_notifications(self) -> bool:
        """Clear all notifications from SQLite."""
        with self.get_connection() as conn:
            conn.execute("DELETE FROM notifications")
            return True

    def mark_all_notifications_as_read(self) -> bool:
        """Mark all system notifications as read in SQLite."""
        with self.get_connection() as conn:
            conn.execute("UPDATE notifications SET is_read = 1")
            return True


db = DatabaseManager()

