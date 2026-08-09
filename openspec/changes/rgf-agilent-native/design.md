# Design Specification: `rgf-agilent-native`

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ AI Agent / IDE (Antigravity, OpenCode, Cursor, Claude)      │
│  • Terse Tool Calls: track_event / sync_change              │
│  • Token Budget: ~300 tokens                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ (FastMCP JSON Protocol)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Agilent Native Suite (FastAPI + FastMCP + SQLite)           │
│  • Single-process application (<150 MB RAM)                 │
│  • SQLite Embedded Storage (Work Items, Timeline, RAG Docs) │
│  • Native Web UI Static Server                              │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ (Internal REST/WebSocket)    │ (Local GPU HTTP)
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│ Agilent React Web UI         │ │ Ollama Local LLM           │
│  • Kanban Board              │ │ (qwen3:14b)                │
│  • Gantt Timeline Chart      │ │ • Card Narrative Generator │
│  • Interactive RAG Chat Widget│ │ • RAG Project QA Chatbot  │
└──────────────────────────────┘ └────────────────────────────┘
```

## Data Schema (SQLite)

- `projects`: `id`, `name`, `slug`, `created_at`
- `work_items`: `id`, `project_id`, `title`, `description_html`, `state`, `start_date`, `target_date`, `release_tag`, `test_status`, `updated_at`
- `comments`: `id`, `work_item_id`, `content_html`, `created_at`
- `rag_documents`: `id`, `change_name`, `topic_key`, `content`, `embedding`

## Component Interaction Flow

1. Agent calls FastMCP `track_event(change_name, event_type, payload)`.
2. Backend patches `work_items` table in SQLite (`start_date`, `target_date`, `state`).
3. Backend dispatches async background task to local Ollama (`qwen3:14b`) for card narrative enrichment.
4. User opens Web UI (`http://localhost:8000`), views live Kanban/Gantt updates, or chats with the RAG module.
