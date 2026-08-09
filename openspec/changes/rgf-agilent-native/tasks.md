# Tasks: `rgf-agilent-native`

## Phase 1: Foundation & Database Engine
- [ ] 1.1 Create `pyproject.toml` with `fastmcp`, `fastapi`, `uvicorn`, `httpx`, and `pydantic` dependencies.
- [ ] 1.2 Implement `src/agilent_native/db.py` managing SQLite schema (`projects`, `work_items`, `comments`, `rag_documents`).
- [ ] 1.3 Implement `src/agilent_native/config.py` parsing environment variables and paths.

## Phase 2: FastAPI Backend & FastMCP Gateway
- [ ] 2.1 Implement `src/agilent_native/server.py` with FastAPI REST endpoints and embedded FastMCP tools (`track_event`, `sync_change`).
- [ ] 2.2 Implement `src/agilent_native/ollama_enricher.py` for background card narrative generation via local Ollama (`qwen3:14b`).
- [ ] 2.3 Implement `src/agilent_native/rag.py` for local RAG query search and chat engine.

## Phase 3: Web UI (Kanban, Gantt Timeline & Chat)
- [ ] 3.1 Setup React + Vite frontend in `ui/` with Tailwind CSS styling.
- [ ] 3.2 Implement Kanban Board component with state columns (`Backlog`, `In Progress`, `Verification`, `Done`).
- [ ] 3.3 Implement Gantt Timeline chart component plotting `start_date` and `target_date`.
- [ ] 3.4 Implement Interactive Project Chat widget connected to local Ollama RAG backend.

## Phase 4: CLI Launcher & Verification
- [ ] 4.1 Implement `src/agilent_native/cli.py` and `agilent` launcher scripts with health checks.
- [ ] 4.2 Write unit and integration tests in `tests/`.
- [ ] 4.3 Run end-to-end verification and QA audit via `sdd-qa-docs`.
