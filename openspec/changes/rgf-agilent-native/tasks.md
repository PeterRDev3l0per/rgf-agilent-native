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

## Phase 7: Task Details Modal, Drag & Drop, Manual Task Creation & Seed Data
- [x] 7.1 Implement SDLC seed data auto-population in `src/agilent_native/db.py`.
- [x] 7.2 Implement REST API endpoints `/api/work_items/{id}/state` and `/api/work_items` in `src/agilent_native/server.py`.
- [x] 7.3 Implement Task Details Modal (Eye icon + double-click), HTML5 Drag and Drop between columns, and Manual Task Creation form in `src/agilent_native/static/index.html`.
- [x] 7.4 Update `docs/E2E_USE_CASES.md` and Playwright E2E test suite in `tests/e2e/test_ui_playwright.py`.
- [x] 7.5 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 8: Real-Time Board Sync, Dynamic Island Notch, Border Beam & Glowing Orb Loader
- [x] 8.1 Add real-time event broadcasting and automatic board polling in `src/agilent_native/server.py` and `static/index.html`.
- [x] 8.2 Implement iPhone-style Dynamic Island Notch notification component in `src/agilent_native/static/index.html`.
- [x] 8.3 Implement glowing border beam CSS animation effects for active cards and panels in `src/agilent_native/static/index.html`.
- [x] 8.4 Implement 3D Glowing Gradient Orb AI Chat Loader inspired by `orbs.jakubatalik.com` in `src/agilent_native/static/index.html`.
- [x] 8.5 Update Playwright E2E test suite in `tests/e2e/test_ui_playwright.py` and run QA verification via `sdd-qa-docs`.

## Phase 9: Dark / Light Mode Toggle & 2026 Trend Color Palette Theme Switcher
- [x] 9.1 Implement Dark/Light mode toggle button and `localStorage` persistence in `src/agilent_native/static/index.html`.
- [x] 9.2 Implement 2026 Trend Color Palette Switcher (Cyber Blue, Neo Emerald, Sunset Nebula, Nordic Aurora) in `src/agilent_native/static/index.html`.
- [x] 9.3 Update `docs/E2E_USE_CASES.md` with Use Cases 10 & 11.
- [x] 9.4 Update Playwright E2E browser test suite in `tests/e2e/test_ui_playwright.py`.
- [x] 9.5 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 10: 100% Comprehensive Light Mode, Skeleton Loaders & Palette Cleanup
- [x] 10.1 Remove color palette switcher buttons completely from `src/agilent_native/static/index.html`.
- [x] 10.2 Implement 100% comprehensive Light Mode CSS & Tailwind classes across all headers, panels, cards, text, inputs, modals, and Gantt charts.
- [x] 10.3 Implement animated Skeleton Loaders for Kanban columns, Gantt timeline, and header telemetry in `src/agilent_native/static/index.html`.
- [x] 10.4 Update `docs/E2E_USE_CASES.md` and Playwright E2E browser test suite in `tests/e2e/test_ui_playwright.py`.
- [x] 10.5 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 11: Comprehensive Security Hardening, Audit & Automated Vulnerability Testing
- [x] 11.1 Implement HTML input sanitization (bleach/html escape), slug validation, and OWASP HTTP security middleware in `src/agilent_native/server.py`.
- [x] 11.2 Implement LLM prompt injection guardrails, delimiter isolation, and context sanitization in `src/agilent_native/rag.py`.
- [x] 11.3 Add CSP meta tags, DOMPurify/text Escaping, and anti-XSS client-side defenses in `src/agilent_native/static/index.html`.
- [x] 11.4 Document threat model, vulnerability matrix, and hardening architecture in `docs/SECURITY_AUDIT_AND_HARDENING.md`.
- [x] 11.5 Implement automated security test suite `tests/security/test_security_hardening.py` covering XSS, SQLi, Path Traversal, and Prompt Injection attacks.
- [x] 11.6 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 12: Advanced Bank-Grade Hardening & Security Protocol Expansion
- [x] 12.1 Expand global skill `bank-grade-security-hardening` with Rules 6–11 (Anti-DoS, Exception Sanitization, Audit Logging, Indirect Injection Defense).
- [x] 12.2 Implement payload size limits (1 MB cap), global exception handlers, and security audit logging in `src/agilent_native/server.py`.
- [x] 12.3 Update `tests/security/test_security_hardening.py` to cover payload limits, exception shielding, and indirect prompt injection.
- [x] 12.4 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 13: Global Security Framework Integration (NIST SSDF, OWASP WSTG, CIS & SHIELD)
- [x] 13.1 Update global skill `bank-grade-security-hardening` with OWASP WSTG, NIST SSDF, CIS Benchmarks, OWASP Top 10 for LLMs, SHIELD methodology, and AI Secure Prompting directives.
- [x] 13.2 Update `docs/SECURITY_AUDIT_AND_HARDENING.md` with SHIELD methodology and compliance matrix.
- [x] 13.3 Run Pytest suite & QA verification via `sdd-qa-docs`.

## Phase 14: Vanguard UI/UX Micro-Interactions, Glassmorphism & Activity Audit Log
- [x] 14.1 Enhance task detail API endpoint in `src/agilent_native/server.py` to return activity audit log events.
- [x] 14.2 Refactor task detail modal in `src/agilent_native/static/index.html` to render glassmorphism panels, tags, priority badges, and activity audit feed.
- [x] 14.3 Add CSS micro-interactions, card hover scale effects, and drop-zone visual indicators in `src/agilent_native/static/index.html`.
- [x] 14.4 Run Pytest suite, Playwright E2E browser tests, and QA verification via `sdd-qa-docs`.

## Phase 15: ClientOS Header Bar & Segmented Control Architecture
- [ ] 15.1 Refactor top bar in `src/agilent_native/static/index.html` into ClientOS header layout with project switcher dropdown, segmented pill navigation, telemetry badges, and primary `+ New Task` pill button.

## Phase 16: Dot Matrix Canvas & Column Accent Containers
- [ ] 16.1 Implement dot grid matrix SVG background pattern and vertical color bar accents for Kanban columns (`To do`, `In Progress`, `Verification`, `Done`).
- [ ] 16.2 Add bottom `+` card quick-add buttons to each column.

## Phase 17: ClientOS Micro-Card Component Design
- [ ] 17.1 Implement ClientOS micro-card rendering template with top row due date badges, `TSK-XX` code IDs, status dots, middle title typography, category pill tags (`Feature`, `Bug`, `Frontend`, `Backend`, `Security`), and assignee avatars.

## Phase 18: ClientOS Glassmorphism Modals & E2E Validation Pass
- [x] 18.1 Align task detail and creation modals with ClientOS glassmorphism aesthetics.
- [x] 18.2 Run Pytest suite, Playwright E2E browser tests, security tests, and QA verification via `sdd-qa-docs`.

## Phase 19: Database Model Expansion & Deep Task Editing
- [x] 19.1 Extend SQLite database schema in `src/agilent_native/db.py` to support `priority`, `category`, `assignee`, and deep attribute updates.
- [x] 19.2 Update `PATCH /api/work_items/{id}` in `src/agilent_native/server.py` to accept and persist all task fields.
- [x] 19.3 Upgrade Task Detail Modal in `src/agilent_native/static/index.html` to an editable deep form with instant SQLite persistence.

## Phase 20: Share Dashboard Link with Secure Tokens
- [x] 20.1 Add share token table & endpoint `POST /api/projects/{slug}/share_token` in `src/agilent_native/server.py`.
- [x] 20.2 Add "Compartir" modal with one-click link copying in `src/agilent_native/static/index.html`.

## Phase 21: Internationalization (ES-MX / EN) & Settings Dropdown
- [x] 21.1 Implement i18n language dictionary (ES 🇲🇽 / EN 🇺🇸) and selector in Settings gear menu & footer.
- [x] 21.2 Set default LLM response tone to warm professional Mexican Spanish in `src/agilent_native/rag.py`.
- [x] 21.3 Clean up redundant column buttons and run full Pytest & Playwright test pass.












