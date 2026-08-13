# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-13

### Agregado
- Servidor backend nativo en FastAPI con SQLite WAL manager (`src/agilent_native/db.py`).
- Frontend SPA en React + Vite + TypeScript con Kanban, Timeline Gantt, Chat RAG y Notificaciones.
- Integración RAG Local sobre GPU Ollama (`qwen3:14b`) con cero consumo de tokens de pago.
- Protocolo FastMCP (`src/agilent_native/server.py`) para conexión desde IDEs de IA.
- CLI ejecutable `agilent` con subcomandos `setup`, `status`, `test`, `up`.
- Menú interactivo de selección de IDE de preferencia (Cursor, VS Code, Antigravity IDE, PyCharm, Neovim).
- Suite de pruebas de seguridad OWASP y test de sandbox de instalador (`tests/test_installer_sandbox.py`).
- Pipeline de CI/CD para prueba y publicación de releases automatizados (`.github/workflows/release.yml`).

### Cambios
- Remoción total de datos de plantilla y tareas preexistentes harcodeadas.
- Sincronización de `localStorage` para mantener la persistencia del proyecto activo tras refrescar (F5).
- Rediseño Glassmorphic nativo de la vista 404 (`NotFound.tsx`) con soporte i18n (`es` / `en`).
