"""Combined FastAPI WebApp & FastMCP Gateway Server for Agilent Native Suite."""

import logging
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastmcp import FastMCP
from pydantic import BaseModel

from agilent_native.config import config
from agilent_native.db import db
from agilent_native.ollama_enricher import enrich_card_async
from agilent_native.rag import rag_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# State mapping from SDD phases and generic agile events to Kanban columns
SDD_PHASE_STATE_MAP = {
    "explore": "Backlog",
    "propose": "Backlog",
    "spec": "In Progress",
    "design": "In Progress",
    "tasks": "In Progress",
    "apply": "In Progress",
    "verify": "Verification",
    "archive": "Done",
    "backlog": "Backlog",
    "todo": "Backlog",
    "created": "Backlog",
    "task_created": "Backlog",
    "in_progress": "In Progress",
    "started": "In Progress",
    "doing": "In Progress",
    "work": "In Progress",
    "task_started": "In Progress",
    "testing": "Verification",
    "review": "Verification",
    "task_testing": "Verification",
    "done": "Done",
    "completed": "Done",
    "finished": "Done",
    "task_completed": "Done",
    "archived": "Done",
}

# FastMCP Server Instance
mcp = FastMCP("AgilentNativeGateway")

# FastAPI App Instance
app = FastAPI(title="Agilent Native Suite", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

@app.get("/")
def root_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/app/")



def format_card_title(change_name: str) -> str:
    """Format kebab-case change name into a clean, human-readable card title with an emoji."""
    words = [w.capitalize() for w in re.split(r"[-_]", change_name) if w]
    title = " ".join(words)
    return f"{title} 🚀"


@mcp.tool()
async def sync_change(
    change_name: str,
    project_id: Optional[str] = None,
    description: str = "SDD Change initialized",
) -> Dict[str, Any]:
    """Sync or recover an Agilent Work Item card for an SDD change (Idempotent)."""
    proj = db.get_or_create_project(project_id or "rgf-agilent-native")
    target_project_id = proj["id"]

    existing = db.get_work_item_by_title_slug(target_project_id, change_name)
    if existing:
        logger.info(f"Existing valid mapping found for '{change_name}': {existing['id']}")
        return {"work_item_id": existing["id"], "change_name": change_name, "project_id": target_project_id}

    card_title = format_card_title(change_name)
    item = db.create_work_item(target_project_id, title=card_title, description_html=f"<p>{description}</p>")
    logger.info(f"Created new Work Item for '{change_name}': {item['id']}")
    return {"work_item_id": item["id"], "change_name": change_name, "project_id": target_project_id}


@mcp.tool()
async def track_event(
    change_name: str,
    event_type: str,
    phase: Optional[str] = None,
    status: str = "success",
    payload: Optional[Dict[str, Any]] = None,
) -> str:
    """Track an SDD or generic task lifecycle event and update the Agilent Kanban/Gantt board asynchronously."""
    data = payload or {}
    proj = db.get_or_create_project("rgf-agilent-native")
    project_id = proj["id"]
    target_phase = phase or event_type
    today_str = datetime.now().strftime("%Y-%m-%d")

    mapping = await sync_change(change_name, project_id=project_id)
    work_item_id = mapping["work_item_id"]

    item_updates: Dict[str, Any] = {}

    if target_phase and target_phase in SDD_PHASE_STATE_MAP:
        item_updates["state"] = SDD_PHASE_STATE_MAP[target_phase]

    if "start_date" in data:
        item_updates["start_date"] = data["start_date"]
    elif target_phase in ("in_progress", "started", "doing", "spec", "apply", "tasks"):
        item_updates["start_date"] = today_str
        data["start_date"] = today_str

    if "target_date" in data or "completed_date" in data:
        item_updates["target_date"] = data.get("target_date") or data.get("completed_date")
    elif target_phase in ("done", "completed", "finished", "archive"):
        item_updates["target_date"] = today_str
        data["target_date"] = today_str
        if "start_date" not in item_updates and "start_date" not in data:
            item_updates["start_date"] = today_str
            data["start_date"] = today_str

    if "release" in data or "release_date" in data:
        item_updates["release_tag"] = data.get("release") or data.get("release_date")
    if "test_results" in data or "tests" in data:
        item_updates["test_status"] = data.get("test_results") or data.get("tests")

    if item_updates:
        db.update_work_item(work_item_id, item_updates)
        logger.info(f"Updated Work Item '{work_item_id}' with fields: {item_updates}")

    artifact_ref = data.get("artifact_ref", f"task/{change_name}/{target_phase}")
    comment_html = f"<p><strong>DONE {target_phase}</strong> | status: {status} | artifact: <code>{artifact_ref}</code></p>"
    db.add_comment(work_item_id, comment_html)

    if target_phase:
        enrich_card_async(work_item_id, change_name, target_phase, data)

    return f"Successfully tracked {event_type} (phase/event: {target_phase}) for task/change '{change_name}'"


# FastAPI REST API Endpoints for Web UI
class ChatRequest(BaseModel):
    project_slug: str = "rgf-agilent-native"
    question: str


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "Agilent Native Suite", "timestamp": datetime.now().isoformat()}


@app.get("/api/projects/{slug}/board")
def get_project_kanban_board(slug: str):
    proj = db.get_or_create_project(slug)
    items = db.list_work_items(proj["id"])
    columns = {"Backlog": [], "In Progress": [], "Verification": [], "Done": []}
    for item in items:
        state = item.get("state", "Backlog")
        if state in columns:
            columns[state].append(item)
        else:
            columns["Backlog"].append(item)
    return {"project": proj, "board": columns}


@app.get("/api/projects/{slug}/gantt")
def get_project_gantt_timeline(slug: str):
    proj = db.get_or_create_project(slug)
    items = db.list_work_items(proj["id"])
    timeline_items = []
    for item in items:
        if item.get("start_date") or item.get("target_date"):
            timeline_items.append({
                "id": item["id"],
                "title": item["title"],
                "state": item["state"],
                "start_date": item.get("start_date"),
                "target_date": item.get("target_date") or item.get("start_date"),
                "release_tag": item.get("release_tag"),
                "test_status": item.get("test_status"),
            })
    return {"project": proj, "timeline": timeline_items}


@app.post("/api/chat")
async def chat_with_project_rag(req: ChatRequest):
    proj = db.get_or_create_project(req.project_slug)
    result = await rag_engine.chat_query(proj["id"], req.question)
    return result


def main():
    import uvicorn
    uvicorn.run("agilent_native.server:app", host=config.server_host, port=config.server_port, reload=True)


if __name__ == "__main__":
    main()
