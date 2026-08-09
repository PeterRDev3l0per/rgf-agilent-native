"""Unit tests for Agilent Native embedded SQLite database manager."""

import tempfile
import pytest
from pathlib import Path
from agilent_native.db import DatabaseManager


@pytest.fixture
def temp_db():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    f.close()
    db_mgr = DatabaseManager(db_path=db_path)
    yield db_mgr
    try:
        Path(db_path).unlink(missing_ok=True)
        Path(db_path + "-wal").unlink(missing_ok=True)
        Path(db_path + "-shm").unlink(missing_ok=True)
    except Exception:
        pass


def test_project_creation_and_retrieval(temp_db):
    proj = temp_db.get_or_create_project("Agilent Test Project")
    assert proj["name"] == "Agilent Test Project"
    assert proj["slug"] == "agilent-test-project"

    # Idempotent retrieval
    proj2 = temp_db.get_or_create_project("Agilent Test Project")
    assert proj2["id"] == proj["id"]


def test_work_item_crud_and_updates(temp_db):
    proj = temp_db.get_or_create_project("Agilent Test Project")
    item = temp_db.create_work_item(proj["id"], "Test Work Item", "<p>Initial description</p>")
    assert item["title"] == "Test Work Item"
    assert item["state"] == "Backlog"

    # Update state and dates
    updated = temp_db.update_work_item(
        item["id"],
        {
            "state": "In Progress",
            "start_date": "2026-08-09",
            "target_date": "2026-08-10",
            "test_status": "5/5 Passed",
        },
    )
    assert updated["state"] == "In Progress"
    assert updated["start_date"] == "2026-08-09"
    assert updated["target_date"] == "2026-08-10"
    assert updated["test_status"] == "5/5 Passed"


def test_add_comment(temp_db):
    proj = temp_db.get_or_create_project("Agilent Test Project")
    item = temp_db.create_work_item(proj["id"], "Comment Task")
    comment = temp_db.add_comment(item["id"], "<p>DONE in_progress</p>")
    assert comment["work_item_id"] == item["id"]
    assert "DONE in_progress" in comment["content_html"]
