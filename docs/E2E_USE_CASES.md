# Agilent Native Suite: End-to-End (E2E) Test Stages & Use Cases 🧪

> **Automated Playwright E2E Quality Assurance Protocol for SDD Verification**

This document defines the 4 core E2E user testing stages and use cases executed automatically by Playwright at the end of every SDD change.

---

## 🎯 Use Case 1: Kanban Board Navigation & Event Sync
- **Goal**: Verify that work items tracked via FastMCP (`track_event`) appear immediately in the visual Kanban columns (`Backlog`, `In Progress`, `Verification`, `Done`).
- **Playwright Assertion**:
  - Load `http://127.0.0.1:8000/app/`.
  - Verify Kanban columns are present and task count badges reflect active items.
  - Verify card title, description HTML, and release tags render correctly.

---

## 🎯 Use Case 2: Gantt Timeline Chart Plotting
- **Goal**: Verify that task start dates, completion target dates, and release tags plot correctly on the Timeline/Gantt chart.
- **Playwright Assertion**:
  - Click `Timeline / Gantt` tab button.
  - Assert container displays task rows with formatted start and end date badges (`📅 Start: YYYY-MM-DD ➔ 🏁 End: YYYY-MM-DD`).

---

## 🎯 Use Case 3: Local RAG Chat Query Execution
- **Goal**: Verify that the interactive RAG Chat interface submits user questions, queries project SQLite context, and displays responses (either online via Ollama or offline via Spanish summary fallback).
- **Playwright Assertion**:
  - Click `Local RAG Chat` tab button.
  - Type query into chat input (`¿Cuál es el estado del proyecto?`) and press Enter / Click Send.
  - Assert chat feed receives and displays assistant response text.

---

## 🎯 Use Case 4: Live Header Telemetry Badges
- **Goal**: Verify that the top navigation header dynamically polls `/api/health` and displays live indicators for Ollama status, active model name, FastMCP schema token footprint (`~300 tokens`), and real-time RSS RAM consumption (`< 150 MB`).
- **Playwright Assertion**:
  - Assert `#badge-ollama` contains status text (`Ollama Online` or `Ollama Offline (Modo Resumen)`).
  - Assert `#text-ram` displays live RAM usage (e.g. `RAM: 48.2 MB RAM`).

---

## 🎯 Use Case 5: Task Details View Modal
- **Goal**: Verify that clicking the Eye icon or double-clicking a card opens `#modal-task-detail` showing full task title, rendered HTML description, timeline, test badge, and release tag.
- **Playwright Assertion**:
  - Click Eye button on a card.
  - Assert `#modal-task-detail` becomes visible with matching `#detail-title`.

---

## 🎯 Use Case 6: HTML5 Drag & Drop Kanban State Transition
- **Goal**: Verify that dragging a card to a new column sends `PATCH /api/work_items/{id}/state` and updates state in SQLite and Gantt timeline.
- **Playwright Assertion**:
  - Drag card from `#col-backlog` to `#col-in-progress`.
  - Assert task count updates and card is positioned in destination column.

---

## 🎯 Use Case 7: Manual Task Creation & Local RAG Sync
- **Goal**: Verify that clicking `+ Nueva Tarea` opens `#modal-create-task`, saves new item via `POST /api/work_items`, and updates Kanban and Gantt views.
- **Playwright Assertion**:
  - Click `+ Nueva Tarea`.
  - Fill title (`Tarea Creada Manualmente`) and submit.
  - Assert card appears on Kanban board.

---

## 🎯 Use Case 8: iPhone-Style Dynamic Island Notch Notifications
- **Goal**: Verify that task creation and drag-and-drop state updates trigger the Dynamic Island notch notification pill (`#dynamic-island`) with fluid spring expansion.
- **Playwright Assertion**:
  - Trigger task state update or creation.
  - Assert `#dynamic-island` receives `dynamic-island-expanded` class and displays event title.

---

## 🎯 Use Case 9: 3D Glowing Gradient Orb AI Chat Loader
- **Goal**: Verify that submitting a chat query renders the 3D glowing gradient orb loader (`.orb-wrapper`, `.orb-glow`, `.orb-core`) while Ollama generates a response.
- **Playwright Assertion**:
  - Submit chat question.
  - Assert `.orb-wrapper` is rendered during pending state.

---

## 🎯 Use Case 10: 100% Comprehensive Dark / Light Mode Toggle & LocalStorage Persistence
- **Goal**: Verify that clicking `#btn-dark-toggle` toggles 100% of UI elements (cards, text, header, modals, gantt chart) between dark and light themes and updates `localStorage.agilent_mode`.
- **Playwright Assertion**:
  - Click `#btn-dark-toggle`.
  - Assert `html` root class list toggles `dark`.

---

## 🎯 Use Case 11: Animated Skeleton Loading Placeholders
- **Goal**: Verify that skeleton loading cards (`.skeleton`) render shimmers during initial Kanban and Gantt data fetching states to prevent layout shifts.
- **Playwright Assertion**:
  - Load workspace.
  - Assert skeleton loader elements render during initial load.



---

## 🚀 Execution & SDD Skill Integration

The Playwright E2E test suite resides in `tests/e2e/test_ui_playwright.py` and is automatically invoked by `sdd-qa-docs` via:

```bash
.venv/Scripts/pytest tests/e2e/test_ui_playwright.py
```
