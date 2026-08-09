# Agilent Native Suite (`rgf-agilent-native`) 🚀

> **Ultra-Lightweight Self-Hosted Visual Kanban, Gantt Timeline & Local RAG Chat Application for AI Coding Agents**

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green.svg)](https://fastapi.tiangolo.com/)
[![FastMCP](https://img.shields.io/badge/MCP-FastMCP-green.svg)](https://github.com/jlowin/fastmcp)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue.svg)](https://www.sqlite.org/)
[![Ollama](https://img.shields.io/badge/Local--LLM-Ollama--qwen3:14b-orange.svg)](https://ollama.com/)

**Agilent Native Suite** is a zero-overhead, self-hosted web application and FastMCP server designed specifically for AI-assisted SDLC development. It replaces heavy third-party software (Plane) with a single-process application consuming **<150 MB RAM** and booting in **<1 second**.

---

## 💡 Key Capabilities

- ⚡ **Ultra-Low Token Footprint**: Exposes only 2 MCP tools (`track_event`, `sync_change`), keeping paid LLM prompt overhead at **~300 tokens**.
- 📋 **Native SDD Kanban Board**: Interactive visual board with native columns (`Backlog`, `In Progress`, `Verification`, `Done`).
- 📅 **Automatic Gantt Timeline**: Automatically plots task start dates, completion dates, and release milestones on a Gantt timeline chart.
- 💬 **Built-in Local RAG Project Chat**: Ask questions about your project architecture, specs, and status directly in the UI using local Ollama (`qwen3:14b`) at **$0 paid token cost**.
- 🗄️ **Embedded SQLite Database**: Single `.db` file for zero-configuration database storage.
- 🛠️ **1-Command CLI & Auto-Recovery**: Includes the `agilent` launcher with automatic retry-recovery health checks.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ AI Agent / IDE (Antigravity, OpenCode, Cursor, Claude)      │
│  • Single terse tool call: track_event(event_type, payload) │
│  • Token Cost: ~200 tokens / event                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ (FastMCP JSON Event)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Agilent Native Suite (FastAPI + FastMCP Server)             │
│  • Embedded SQLite Storage + Local RAG Engine               │
│  • Micro Process (<150 MB RAM, <1s startup)                 │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ (Native Web UI)              │ (Asynchronous Local GPU)
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│ Agilent Web App UI           │ │ Ollama Local LLM           │
│  • Kanban Board & Gantt Chart│ │ (qwen3:14b)                │
│  • Interactive RAG Chat      │ │ • Card Narrative Generator │
│                              │ │ • Project RAG QA Chatbot   │
└──────────────────────────────┘ └────────────────────────────┘
```

---

## 📄 License

Distributed under the [MIT License](LICENSE).
