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
