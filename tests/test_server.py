"""Integration tests for Agilent Native FastAPI server and FastMCP tools."""

import pytest
from fastapi.testclient import TestClient
from agilent_native.server import app, sync_change, track_event


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Agilent Native Suite"


def test_system_info_telemetry_fields(client):
    response = client.get("/api/system_info")
    assert response.status_code == 200
    data = response.json()
    assert "ram_usage" in data
    assert "rag_usage" in data
    assert "db_usage" in data


@pytest.mark.asyncio
async def test_fastmcp_sync_and_track_event():
    sync_res = await sync_change("agilent-native-auth")
    assert "work_item_id" in sync_res

    track_res = await track_event(
        change_name="agilent-native-auth",
        event_type="in_progress",
        status="success",
        payload={"start_date": "2026-08-09", "task_detail": "Testing FastMCP integration"},
    )
    assert "Successfully tracked in_progress" in track_res


def test_kanban_board_and_gantt_endpoints(client):
    # Fetch board
    board_resp = client.get("/api/projects/rgf-agilent-native/board")
    assert board_resp.status_code == 200
    b_data = board_resp.json()
    assert "board" in b_data
    assert "Backlog" in b_data["board"]

    # Fetch Gantt timeline
    gantt_resp = client.get("/api/projects/rgf-agilent-native/gantt")
    assert gantt_resp.status_code == 200
    g_data = gantt_resp.json()
    assert "timeline" in g_data


def test_project_crud_and_notifications_endpoints(client):
    # Test list projects
    res = client.get("/api/projects")
    assert res.status_code == 200
    assert "projects" in res.json()

    # Test create new project via REST — use unique name to avoid collision
    import time
    unique_name = f"AutoTest Project {int(time.time())}"
    create_res = client.post("/api/projects", json={"name": unique_name})
    assert create_res.status_code == 200
    proj = create_res.json()["project"]
    assert proj["name"] == unique_name

    # Test duplicate returns 409 Conflict
    dup_res = client.post("/api/projects", json={"name": unique_name})
    assert dup_res.status_code == 409
    assert "already exists" in dup_res.json()["detail"]

    # Test notifications
    notif_res = client.get("/api/notifications")
    assert notif_res.status_code == 200
    notifs = notif_res.json()["notifications"]
    assert len(notifs) >= 1


@pytest.mark.asyncio
async def test_mcp_auto_project_creation():
    # Sync change for a brand new project name coming from OpenCode / Codex
    new_project_name = "opencode-ai-backlog"
    sync_res = await sync_change("opencode-feature-1", project_id=new_project_name)
    assert "work_item_id" in sync_res
    assert sync_res["change_name"] == "opencode-feature-1"


def test_task_soft_delete(client):
    # Create task
    create_res = client.post("/api/work_items", json={
        "project_slug": "rgf-agilent-native",
        "title": "Task To Soft Delete",
        "description": "Test soft delete with timestamp"
    })
    assert create_res.status_code == 200
    item_id = create_res.json()["work_item"]["id"]

    # Delete task (soft delete)
    del_res = client.delete(f"/api/work_items/{item_id}")
    assert del_res.status_code == 200

    # Verify task is excluded from active board
    board_res = client.get("/api/projects/rgf-agilent-native/board")
    assert board_res.status_code == 200
    board_items = board_res.json()["board"]
    active_ids = [item["id"] for items in board_items.values() for item in items]
    assert item_id not in active_ids


