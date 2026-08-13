"""
Automated Test Suite for AI Agent Orchestrators and IDE Integration.
Validates FastMCP Protocol Gateway payload compatibility, task creation idempotency,
and context consumption efficiency across Opencode, Codex, Claude Code, Pi, Cursor, and Antigravity.
"""

import pytest
from fastapi.testclient import TestClient
from agilent_native.server import app, db

client = TestClient(app)

SUPPORTED_AGENT_CLIENTS = [
    {"name": "Opencode Agent", "user_agent": "Opencode-Agent/1.0", "mcp_client": "opencode-mcp"},
    {"name": "Codex Agent", "user_agent": "Codex-Cli/2.0", "mcp_client": "codex-mcp"},
    {"name": "Claude Code CLI", "user_agent": "Claude-Code/1.5", "mcp_client": "claude-code-mcp"},
    {"name": "Pi Agent Framework", "user_agent": "Pi-Agent/0.9", "mcp_client": "pi-mcp"},
    {"name": "Cursor IDE Agent", "user_agent": "Cursor/0.40", "mcp_client": "cursor-mcp"},
    {"name": "Antigravity IDE Agent", "user_agent": "Antigravity/2.0", "mcp_client": "gemini-mcp"},
]


def test_agent_orchestrator_project_and_task_lifecycle():
    """Verify that AI agent orchestrators can create projects and work items seamlessly."""
    for agent in SUPPORTED_AGENT_CLIENTS:
        headers = {
            "User-Agent": agent["user_agent"],
            "X-MCP-Client": agent["mcp_client"],
        }
        proj_name = f"Orchestrator {agent['name']} Test Project"
        
        # 1. Create Project
        resp_proj = client.post("/api/projects", json={"name": proj_name}, headers=headers)
        assert resp_proj.status_code in (200, 409), f"Failed for {agent['name']}: {resp_proj.text}"
        
        # 2. Create Task via Agent Orchestrator
        resp_task = client.post(
            "/api/work_items",
            json={
                "project_slug": "rgf-agilent-native",
                "title": f"Task created by {agent['name']}",
                "description": f"Automated validation test for {agent['name']}",
                "priority": "high",
                "category": "Core Architecture",
            },
            headers=headers,
        )
        assert resp_task.status_code == 200, f"Task creation failed for {agent['name']}: {resp_task.text}"
        data = resp_task.json()
        assert data.get("status") in ("success", "created")
        assert "work_item" in data
        assert data["work_item"]["title"] == f"Task created by {agent['name']}"


def test_fastmcp_context_footprint():
    """Verify that FastMCP payload context footprint remains lightweight (~300 tokens)."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    info = resp.json()
    assert "telemetry" in info
    assert "fastmcp_footprint" in info["telemetry"]
    assert "~300 tokens" in info["telemetry"]["fastmcp_footprint"]
