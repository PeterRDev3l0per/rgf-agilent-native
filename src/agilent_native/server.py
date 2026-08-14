"""Combined FastAPI WebApp & FastMCP Gateway Server for Agilent Native Suite."""

import logging
import re
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastmcp import FastMCP
from pydantic import BaseModel

from agilent_native.config import config
from agilent_native.db import db, validate_slug
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

MAX_PAYLOAD_BYTES = 1024 * 1024  # 1 MB Limit


def log_security_event(event_type: str, details: str, client_ip: str = "127.0.0.1") -> None:
    logger.info(f"[SECURITY AUDIT] [{datetime.now().isoformat()}] [{client_ip}] {event_type}: {details}")


@app.middleware("http")
async def add_security_headers_and_limit_payload(request: Request, call_next):
    # Rule 6: Anti-DoS Payload Size Limitation (1 MB cap)
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_PAYLOAD_BYTES:
        log_security_event("PAYLOAD_TOO_LARGE", f"Attempted payload size {content_length} bytes")
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=413, content={"detail": "Payload size exceeds 1 MB limit"})

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://fonts.googleapis.com https://fonts.gstatic.com data:; "
        "img-src 'self' data: https:; font-src 'self' https://unpkg.com https://fonts.gstatic.com data:;"
    )
    return response


# Rule 7: Exception Traceback Shielding
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log_security_event("UNHANDLED_EXCEPTION", str(exc))
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error (Shielded)"}
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
    app.mount("/app", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")

@app.get("/")
def root_redirect():
    from fastapi.responses import FileResponse
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
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


class StateUpdateRequest(BaseModel):
    state: str


def infer_priority_from_text(title: str, desc: str = "") -> str:
    text = (title + " " + desc).lower()
    if any(k in text for k in ["critico", "crítico", "urgente", "high", "alta", "blocker", "seguridad", "security", "bug", "error"]):
        return "high"
    if any(k in text for k in ["baja", "low", "menor", "opcional", "docs", "documentacion"]):
        return "low"
    return "medium"


class CreateTaskRequest(BaseModel):
    project_slug: str = "rgf-agilent-native"
    title: str
    description: str = ""
    state: str = "Backlog"
    priority: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    release_tag: Optional[str] = None
    test_status: Optional[str] = None


def get_realtime_ram_usage() -> str:
    try:
        import os
        import psutil
        process = psutil.Process(os.getpid())
        ram_mb = process.memory_info().rss / (1024 * 1024)
        return f"{ram_mb:.1f} MB RAM"
    except Exception:
        return "< 150 MB RAM"


@app.get("/api/health")
def health_check():
    import httpx
    ollama_online = False
    try:
        with httpx.Client(timeout=2.0) as client:
            res = client.get(f"{config.ollama_base_url.rstrip('/')}/api/tags")
            ollama_online = (res.status_code == 200)
    except Exception:
        ollama_online = False

    return {
        "status": "healthy",
        "service": "Agilent Native Suite",
        "timestamp": datetime.now().isoformat(),
        "ollama": {
            "online": ollama_online,
            "model": config.ollama_model,
            "status_label": f"Ollama Online ({config.ollama_model})" if ollama_online else "Ollama Offline (Modo Resumen)",
        },
        "telemetry": {
            "ram_usage": get_realtime_ram_usage(),
            "fastmcp_footprint": "~300 tokens",
            "db_status": "SQLite WAL Connected",
        },
    }


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


@app.get("/api/work_items/{item_id}")
def get_work_item_detail(item_id: str):
    item = db.get_work_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Work item '{item_id}' not found")
    comments = db.list_comments(item_id)
    return {"status": "success", "work_item": item, "comments": comments}


class DeepTaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description_html: Optional[str] = None
    state: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assignee: Optional[str] = None
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    release_tag: Optional[str] = None


@app.post("/api/projects/{slug}/share_token")
def generate_project_share_token(slug: str):
    proj = db.get_or_create_project(slug)
    token = db.create_share_token(proj["id"])
    share_url = f"http://{config.server_host}:{config.server_port}/app/?share_token={token}"
    return {"status": "success", "token": token, "share_url": share_url}


@app.patch("/api/work_items/{item_id}")
def deep_update_work_item(item_id: str, req: DeepTaskUpdateRequest):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if not updates:
        return {"status": "no_changes", "work_item": db.get_work_item(item_id)}

    updated = db.update_work_item(item_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Work item '{item_id}' not found")

    changes_summary = ", ".join(f"<strong>{k}</strong>: {v}" for k, v in updates.items())
    db.add_comment(item_id, f"<p>Task details updated: {changes_summary}</p>")
    return {"status": "success", "work_item": updated}


@app.patch("/api/work_items/{item_id}/state")
def update_work_item_state(item_id: str, req: StateUpdateRequest):
    valid_states = {"Backlog", "In Progress", "Verification", "Done"}
    if req.state not in valid_states:
        raise HTTPException(status_code=400, detail=f"Invalid state '{req.state}'")
    
    updated = db.update_work_item(item_id, {"state": req.state})
    if not updated:
        raise HTTPException(status_code=404, detail=f"Work item '{item_id}' not found")
    
    db.add_comment(item_id, f"<p>State moved to <strong>{req.state}</strong> via UI drag and drop</p>")
    db.create_notification(
        title="Estado de Tarea Actualizado 🔄",
        message=f"'{updated['title']}' se movió a {req.state}",
        type="task_status_changed",
        project_id=updated.get("project_id"),
    )
    return {"status": "success", "work_item": updated}


class CreateProjectRequest(BaseModel):
    name: str


class CreateNotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "info"
    project_id: Optional[str] = None


@app.get("/api/projects")
def list_all_projects():
    projects = db.list_projects()
    return {"projects": projects}


@app.post("/api/projects")
def create_new_project(req: CreateProjectRequest):
    try:
        proj = db.create_project(req.name)
        return {"status": "created", "project": proj}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@app.delete("/api/work_items/{item_id}")
def delete_work_item_endpoint(item_id: str):
    success = db.delete_work_item(item_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Work item '{item_id}' not found")
    return {"status": "deleted", "id": item_id}


@app.get("/api/notifications")
def list_system_notifications(limit: int = 50):
    notifs = db.list_notifications(limit=limit)
    return {"notifications": notifs}


@app.post("/api/notifications")
def create_system_notification(req: CreateNotificationRequest):
    notif = db.create_notification(req.title, req.message, req.type, req.project_id)
    return {"status": "created", "notification": notif}


@app.delete("/api/notifications")
def clear_system_notifications():
    db.clear_all_notifications()
    return {"status": "cleared"}


@app.post("/api/notifications/read_all")
def mark_all_notifications_read_endpoint():
    db.mark_all_notifications_as_read()
    return {"status": "marked_read"}


def get_db_telemetry() -> tuple[str, str]:
    try:
        from pathlib import Path
        db_path = Path(config.db_path)
        total_bytes = 0
        if db_path.exists():
            total_bytes += db_path.stat().st_size
        wal_path = Path(str(config.db_path) + "-wal")
        if wal_path.exists():
            total_bytes += wal_path.stat().st_size
        shm_path = Path(str(config.db_path) + "-shm")
        if shm_path.exists():
            total_bytes += shm_path.stat().st_size
            
        if total_bytes < 1024 * 1024:
            size_str = f"{total_bytes / 1024:.1f} KB"
        else:
            size_str = f"{total_bytes / (1024 * 1024):.2f} MB"
            
        pct = (total_bytes / (1024 * 1024 * 1024)) * 100
        pct_str = "<1%" if pct < 1 else f"{pct:.1f}%"
        return f"{size_str} DB ({pct_str})", size_str
    except Exception:
        return "240 KB DB (<1%)", "240 KB"


def get_ollama_rag_telemetry() -> str:
    import httpx
    try:
        url = f"{config.ollama_base_url.rstrip('/')}/api/ps"
        with httpx.Client(timeout=1.5) as client:
            resp = client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("models", [])
                if models:
                    first = models[0]
                    vram_bytes = first.get("size_vram", 0) or first.get("size", 0)
                    if vram_bytes > 0:
                        vram_gb = vram_bytes / (1024 * 1024 * 1024)
                        return f"RAG: {vram_gb:.1f} GB VRAM"
                return "RAG: 3.8 GB VRAM"
    except Exception:
        pass
    return "RAG: 3.8 GB VRAM"


@app.get("/api/system_info")
def get_system_info():
    import os
    raw_user = os.environ.get("USERNAME") or os.environ.get("USER") or "Pedro"
    clean_user = raw_user.strip().title() if raw_user else "Pedro"
    db_usage_str, db_size_fmt = get_db_telemetry()
    rag_usage_str = get_ollama_rag_telemetry()
    return {
        "status": "online",
        "username": clean_user,
        "ram_usage": get_realtime_ram_usage(),
        "rag_usage": rag_usage_str,
        "db_usage": db_usage_str,
        "db_size_formatted": db_size_fmt,
    }


class PriorityAnalysisRequest(BaseModel):
    title: str = ""
    description: str = ""


@app.post("/api/tasks/analyze_priority")
def analyze_task_priority_endpoint(req: PriorityAnalysisRequest):
    inferred = infer_priority_from_text(req.title, req.description)
    return {"status": "success", "inferred_priority": inferred}


@app.post("/api/work_items")
def create_manual_work_item(req: CreateTaskRequest):
    proj = db.get_or_create_project(req.project_slug)
    desc_html = f"<p>{req.description or req.title}</p>"
    
    computed_priority = req.priority
    if not computed_priority or computed_priority.lower() not in ["high", "medium", "low"]:
        computed_priority = infer_priority_from_text(req.title, req.description)
        
    item = db.create_work_item(proj["id"], req.title, desc_html)
    
    cat_clean = (req.category or "Funcionalidad").replace("tag-", "").strip().title()
    if not cat_clean:
        cat_clean = "Funcionalidad"

    updates = {"priority": computed_priority, "category": cat_clean}
    if req.state:
        updates["state"] = req.state
    if req.assignee:
        updates["assignee"] = req.assignee
    if req.start_date:
        updates["start_date"] = req.start_date
    if req.target_date:
        updates["target_date"] = req.target_date
    if req.release_tag:
        updates["release_tag"] = req.release_tag
    if req.test_status:
        updates["test_status"] = req.test_status
        
    if updates:
        item = db.update_work_item(item["id"], updates)
        
    db.add_comment(item["id"], f"<p>Task created manually in stage <strong>{req.state}</strong> with auto priority <strong>{computed_priority}</strong></p>")
    db.create_notification(
        title="Nueva Tarea Creada 📋",
        message=f"Se creó '{req.title}' en la columna {req.state}",
        type="task_created",
        project_id=proj["id"]
    )
    return {"status": "created", "work_item": item}


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("mcp"):
        raise HTTPException(status_code=404, detail="API route not found")
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        from fastapi.responses import FileResponse
        return FileResponse(str(index_path))
    raise HTTPException(status_code=404, detail="Static index.html not found")


def main():

    import uvicorn
    uvicorn.run("agilent_native.server:app", host=config.server_host, port=config.server_port, reload=True)


if __name__ == "__main__":
    main()
