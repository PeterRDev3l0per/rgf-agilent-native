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

### Scenario 5: Spanish Offline RAG Summary Fallback
- **Given** local Ollama service is offline or unreachable,
- **When** a user queries the project via Chat UI,
- **Then** the RAG engine MUST return a structured, clean summary in Spanish (`**[Modo Resumen Offline]** Basado en los registros del proyecto:`).

### Scenario 6: Live Health Telemetry & Token Counter UI
- **Given** the Agilent Native Web UI is loaded,
- **When** health status `/api/health` is polled,
- **Then** the header MUST display live indicators for Ollama status, active model name, RAM footprint, and Orchestrator token usage.

### Scenario 7: Task Details View Modal & HTML Render
- **Given** a user interacting with a Kanban card,
- **When** clicking the Eye icon or double-clicking the card,
- **Then** a modal dialog MUST open displaying full task title, rendered HTML description, timeline dates, test status, release tag, and activity log.

### Scenario 8: Native Drag-and-Drop Kanban State Transition
- **Given** a user dragging a task card from one column to another,
- **When** dropping the card into a new stage (`Backlog`, `In Progress`, `Verification`, `Done`),
- **Then** the UI MUST trigger REST API `/api/work_items/{id}/state` to update SQLite state,
- **And** update card count badges and Gantt timeline chart immediately.

### Scenario 9: Manual Task Creation & Local RAG Synchronization
- **Given** a user clicking the "+ Nueva Tarea" button in the Web UI,
- **When** submitting title, description, initial stage, start/completion dates, and release tag,
- **Then** the backend MUST save the work item in SQLite and index it immediately for local RAG chat queries.

### Scenario 10: Rich SDLC Seed Data Initialization
- **Given** fresh application startup,
- **When** `DatabaseManager` initializes default project `rgf-agilent-native`,
- **Then** default SDLC seed tasks MUST be populated if the database is empty, rendering a rich Kanban and Timeline view out-of-the-box.

### Scenario 11: Real-Time Board Updates & Event Stream Push
- **Given** a new task insertion or state transition triggered via FastMCP tool or Web UI,
- **When** the backend receives the event,
- **Then** the UI MUST update the Kanban columns and Gantt timeline in real time without manual browser reloads.

### Scenario 12: iPhone-Style Dynamic Island Notch Notification Alerts
- **Given** a live event or system alert,
- **When** the event occurs,
- **Then** a dynamic island notch notification MUST expand at the top center of the screen with fluid spring animations.

### Scenario 13: Animated Border Beam & Vanguard Aesthetics
- **Given** Kanban cards and active workspace containers,
- **When** hovering or dragging,
- **Then** an animated glowing border-beam CSS gradient effect MUST highlight the active container.

### Scenario 14: Glowing 3D Orb AI RAG Chat Loader
- **Given** a user submitting a chat query to local Ollama RAG assistant,
- **When** the model is generating a response,
- **Then** an animated 3D glowing gradient orb loader MUST pulse gracefully until the response is rendered.

### Scenario 15: 100% Comprehensive Dark / Light Mode Toggle
- **Given** a user clicking the Sun/Moon mode toggle in the header,
- **When** toggled,
- **Then** 100% of UI elements (page background, header, glass panels, cards, text, badges, inputs, modals, and Gantt timeline) MUST transform with high contrast and smooth transitions, persisting choice in `localStorage`.

### Scenario 16: Animated Skeleton Loaders Across Workspace
- **Given** initial data fetching or board updates,
- **When** Kanban columns, Gantt timeline, or telemetry badges are loading,
- **Then** animated skeleton loading card placeholders MUST render to prevent layout shifts.

### Scenario 17: Strict Input Sanitization & Anti-XSS Defense
- **Given** task titles, descriptions, comments, or RAG inputs containing malicious HTML script tags (`<script>`, `onerror=`, `javascript:`),
- **When** processed by backend or rendered by frontend,
- **Then** the application MUST sanitize and escape all inputs, preventing execution of unauthorized scripts.

### Scenario 18: SQL Injection & Path Traversal Immunity
- **Given** malicious user requests containing SQL injection vectors (`UNION SELECT`, `' OR 1=1`) or path traversal sequences (`../`, `..\`, `%2e%2e`),
- **When** received by FastAPI endpoints or FastMCP tools,
- **Then** parameterized SQLite queries and sanitized slug validation MUST neutralize the attack without leaking internal error tracebacks.

### Scenario 19: OWASP HTTP Security Headers & Hardened CORS
- **Given** client connections to the FastAPI application,
- **When** HTTP responses are returned,
- **Then** OWASP security headers (`Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`) MUST be injected in all responses.

### Scenario 20: LLM Prompt Injection & Jailbreak Defense Guardrails
- **Given** user chat queries containing prompt injection attempts ("Ignore system prompt", "Reveal instructions", "Do anything now"),
- **When** processed by the local RAG engine,
- **Then** system guardrails MUST isolate instructions from user inputs, sanitize context snippets, and prevent system instruction exfiltration.

### Scenario 21: Payload Size Limitation & Anti-DoS Throttle
- **Given** oversized HTTP POST/PATCH request payloads (>1 MB),
- **When** sent to FastAPI endpoints,
- **Then** the application MUST reject the request with HTTP 413 Payload Too Large to prevent buffer overflow DoS attacks.

### Scenario 22: Exception Traceback Protection & Internal Error Hiding
- **Given** unhandled backend exceptions or database errors,
- **When** an error occurs,
- **Then** generic HTTP 500 error messages MUST be returned without disclosing internal stack traces, system paths, or database schemas.

### Scenario 23: Security Audit Logging & Anti-Tampering
- **Given** sensitive operations (task creation, state change, security events),
- **When** executed,
- **Then** an append-only audit log entry MUST be generated with timestamping and source context.

### Scenario 24: Indirect LLM Prompt Injection Defense & Output Sanitization
- **Given** RAG documents containing embedded malicious instructions,
- **When** retrieved for context generation,
- **Then** document context MUST be sanitized before prompt construction and LLM outputs MUST be HTML-escaped before frontend rendering.

### Scenario 25: NIST SSDF & OWASP WSTG Compliance Validation
- **Given** source code and dependency changes,
- **When** audited during SDD `verify` phase,
- **Then** SAST analysis and dependency CVE checks MUST validate zero critical vulnerabilities.

### Scenario 26: SHIELD Methodology Full Adoption
- **Given** application operations across all tiers,
- **When** executed,
- **Then** Scope, Harden, Inspect, Exercise, Log, and Defend controls MUST operate continuously in production.

### Scenario 27: Enriched Task Detail Modal with Activity Audit Feed
- **Given** a user opening a task detail modal via eye button or double-click,
- **When** the modal renders,
- **Then** complete task metadata, priority badge, category tags, and an append-only activity audit log feed MUST be displayed cleanly with high contrast.

### Scenario 28: Glassmorphism Card Hover Effects & Micro-Interactions
- **Given** user interactions with Kanban cards, modal buttons, and nav tabs,
- **When** hovered or active,
- **Then** smooth glassmorphism scale transitions, border beam glowing highlights, and micro-interactions MUST render responsively.









