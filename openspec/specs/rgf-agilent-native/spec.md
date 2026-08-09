# Capability Spec: `rgf-agilent-native`

## Purpose

Define the requirements for **Agilent Native Suite**, providing an embedded FastMCP server, lightweight Kanban and Gantt UI, and local Ollama RAG chat interface.

---

## Requirements & Scenarios

### Scenario 1: Low Token MCP Gateway Initialization
- **Given** an AI agent session connected to Agilent Native MCP server,
- **When** the agent queries available tool schemas,
- **Then** the total prompt footprint MUST NOT exceed 300 tokens (`track_event` and `sync_change` only).

### Scenario 2: Kanban & Gantt Timeline State Auto-Patching
- **Given** a Work Item tracked with event `in_progress` or `done`,
- **When** `track_event` is executed,
- **Then** the backend MUST patch `start_date` and `target_date` automatically and update state in SQLite,
- **And** the UI MUST plot the card on both Kanban columns and Gantt Timeline views immediately.

### Scenario 3: Local RAG Chat Query Execution
- **Given** a user querying project status via the Agilent Chat UI,
- **When** a question is submitted,
- **Then** the local RAG engine MUST query SQLite context and generate a response using local Ollama (`qwen3:14b`) at 0 paid tokens.

### Scenario 4: Health Check & Auto-Recovery
- **Given** system reboot or service startup,
- **When** `agilent status` or `agilent` CLI command is run,
- **Then** the launcher MUST verify database, API, and Ollama status with automatic retries.
