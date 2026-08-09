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
- [x] 4.1 Implement `src/agilent_native/cli.py` and `agilent` launcher scripts with health checks.
- [x] 4.2 Write unit and integration tests in `tests/`.
- [x] 4.3 Run end-to-end verification and QA audit via `sdd-qa-docs`.

## Phase 5: Spanish Offline Fallback & Live Telemetry Header Badges
- [x] 5.1 Translate RAG offline fallback in `src/agilent_native/rag.py` to natural Spanish (`**[Modo Resumen Offline]** Basado en los registros del proyecto:`).
- [x] 5.2 Enhance `/api/health` in `src/agilent_native/server.py` to return Ollama online/offline status, active model name, RAM usage (<150 MB), and Orchestrator token usage.
- [x] 5.3 Update `src/agilent_native/static/index.html` header with live visual badges for Ollama status, model name, RAM, and token counter.
- [x] 5.4 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 6: Automated Playwright E2E Test Suite & Real-Time RAM Telemetry
- [x] 6.1 Implement real-time RSS RAM calculation via `psutil` in `src/agilent_native/server.py`.
- [x] 6.2 Update `src/agilent_native/static/index.html` loadTelemetry JS to dynamically render exact process RAM.
- [x] 6.3 Document automated E2E testing use cases in `docs/E2E_USE_CASES.md`.
- [x] 6.4 Implement Playwright E2E browser test suite in `tests/e2e/test_ui_playwright.py`.
- [x] 6.5 Integrate Playwright E2E execution into `sdd-qa-docs` skill protocol.


