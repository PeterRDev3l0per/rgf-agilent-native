# Proposal: Agilent Native Suite (`rgf-agilent-native`)

## Intent

Build **Agilent Native Suite**, a zero-overhead, self-hosted web application and FastMCP bridge that replaces heavy third-party Kanban software (Plane) with a hyper-efficient, custom-tailored workspace designed explicitly for AI-assisted SDLC development.

It maintains the ultra-low token footprint for the paid orchestrator (~300 tokens tool schema) while providing an embedded single-process backend (<150 MB RAM), native Kanban board, automatic Gantt timeline, and built-in local RAG project chat powered by Ollama at $0 extra token cost.

---

## Scope

### In Scope
- **FastAPI Backend & Embedded FastMCP Server**: Native Python server providing REST APIs and MCP tools (`track_event`, `sync_change`).
- **Embedded SQLite Database**: Single `.db` file for projects, Work Items, state history, and local embeddings.
- **Custom Web UI (React + Vite)**: Native Kanban Board (Backlog, In Progress, Verification, Done), Gantt Timeline view, and project control dashboard.
- **Local RAG Chat Engine (Ollama)**: Interactive project chat component allowing users to query project specs, architecture, and task history using local `qwen3:14b` at $0 cost.
- **1-Command Smart Installer & CLI (`agilent`)**: Automated launcher with retry-recovery health checks.

### Out of Scope
- Heavy multi-tenant enterprise user management or billing modules.
- External third-party integrations outside MCP, Ollama, and Git.

---

## Capabilities

### New Capabilities
- `agilent-mcp-gateway`: Lightweight FastMCP server exposing `track_event` and `sync_change`.
- `agilent-kanban-gantt-ui`: Custom web interface with Kanban drag-and-drop and automatic Timeline/Gantt rendering.
- `agilent-local-rag-chat`: Built-in RAG query interface connected to local Ollama and project SQLite vector store.
- `agilent-embedded-db`: SQLite storage manager for Work Items, dates, test badges, and release tags.

---

## Approach

1. **Backend**: FastAPI + FastMCP integrated into a single Python process. SQLite with WAL mode for high-concurrency read/write operations.
2. **Frontend**: Lightweight React + Vite single-page application served directly by FastAPI static mount.
3. **Local AI RAG**: Ollama API client (`http://127.0.0.1:11434`) + FTS5 full-text & vector search on project artifacts.
4. **Zero-Overhead Packaging**: Runnable via a single virtualenv process or optional micro-container.

---

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/agilent_native/server.py` | New | Combined FastAPI + FastMCP application |
| `src/agilent_native/db.py` | New | SQLite database schema & repository manager |
| `src/agilent_native/rag.py` | New | Local Ollama RAG search and chat handler |
| `ui/` | New | React + Vite frontend source code |
| `install.py` | New | Transactional cross-platform smart installer |
| `agilent` / `agilent.cmd` | New | Cross-platform CLI launcher & health checker |

---

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Local Ollama service unavailable | Low | Fallback to SQLite FTS5 keyword search & default HTML card summaries |
| Browser CORS or static asset loading issues | Low | Mount React bundle as static files inside FastAPI backend |

---

## Rollback Plan

Revert to using external Plane REST API gateway by switching the FastMCP server endpoint.

---

## Success Criteria

- [ ] FastMCP tool footprint remains $\le 300$ tokens.
- [ ] Application boots in $< 1$ second with $< 150$ MB RAM consumption.
- [ ] Work Items plot automatically on Kanban and Gantt Timeline views upon tracking events.
- [ ] Users can query project status and artifacts via local Ollama RAG chat at $0 paid token cost.
