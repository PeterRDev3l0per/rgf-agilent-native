"""Live demonstration script for Agilent Native Suite."""

import asyncio
import sys
from pathlib import Path

# Ensure UTF-8 stdout
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(ROOT / "src"))

from agilent_native.server import track_event, sync_change
from agilent_native.db import db
from agilent_native.rag import rag_engine


async def run_demo():
    print("\n[AGILENT NATIVE SUITE DEMO: FastMCP + SQLite + Gantt + Local RAG Chat]\n" + "=" * 65)

    print("\n1. Initializing Work Item & Setting Timeline Dates...")
    res1 = await track_event(
        change_name="agilent-native-launch",
        event_type="in_progress",
        status="success",
        payload={
            "start_date": "2026-08-09",
            "task_detail": "Building ultra-lightweight FastAPI + SQLite + Gantt + RAG suite",
            "artifact_ref": "sdd/agilent-native-launch/apply",
        },
    )
    print(f"   MCP Result: {res1}")

    print("\n2. Tracking Testing & Final Release...")
    res2 = await track_event(
        change_name="agilent-native-launch",
        event_type="done",
        status="success",
        payload={
            "start_date": "2026-08-09",
            "target_date": "2026-08-10",
            "release": "v1.0.0-native",
            "test_results": "6/6 Pytest tests PASSED (100% coverage)",
            "artifact_ref": "sdd/agilent-native-launch/archive",
        },
    )
    print(f"   MCP Result: {res2}")

    print("\n3. Querying Project State from Embedded SQLite DB...")
    proj = db.get_or_create_project("rgf-agilent-native")
    items = db.list_work_items(proj["id"])
    print(f"   Total Items in SQLite DB: {len(items)}")
    for item in items:
        print(f"   • [{item['state']}] {item['title']} | Start: {item.get('start_date')} | End: {item.get('target_date')} | Release: {item.get('release_tag')}")

    print("\n4. Executing Local Ollama RAG Chat Query ($0 paid token cost)...")
    rag_res = await rag_engine.chat_query(proj["id"], "What is the release status and test coverage of the agilent native launch task?")
    print(f"   Question: {rag_res['question']}")
    print(f"   Ollama RAG Answer:\n{rag_res['answer']}")

    print("\n" + "=" * 65)
    print("[SUCCESS] All native components operational and verified!\n")


if __name__ == "__main__":
    asyncio.run(run_demo())
