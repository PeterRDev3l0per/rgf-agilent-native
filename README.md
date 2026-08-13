# Agilent Native Suite ⚡

[![CI/CD Pipeline](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/ci.yml/badge.svg)](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/ci.yml)
[![Release & Publish Version](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/release.yml/badge.svg)](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](pyproject.toml)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](frontend/package.json)

**Agilent Native Suite** es una suite de productividad y gestión de proyectos nativa para desarrolladores e ingenieros de IA. Diseñada con una arquitectura **Zero-Paid-Token**, combina un tablero Kanban gráfico, timeline Gantt, un asistente de IA RAG local alimentado por GPU y una puerta de enlace FastMCP integrada directamente con tu IDE preferido.

---

## 🌟 Características Principales

- **Arquitectura Zero-Paid-Token**: Procesa búsquedas semánticas y resúmenes con GPU Ollama local (`qwen3:14b`) sin enviar datos fuera de tu máquina.
- **Interfaz Glassmorphic Fluida**: Tablero Kanban, vista Gantt y notificaciones animadas en el Notch superior.
- **FastMCP Protocol Gateway**: Permite a tu Agente de IA en Cursor, VS Code, Antigravity IDE, PyCharm o Neovim crear y consultar tareas con un consumo mínimo de contexto (~300 tokens).
- **Inicio Limpio de Producción**: La aplicación y cada nuevo proyecto nacen en **0 proyectos y 0 tareas (`[]`)**, listos para producción.
- **Asistente RAG Local**: Chat interactivo para consultar el estado del backlog, tarjetas y especificaciones en tiempo real.

---

## 🚀 Quickstart & Instalación Rápida

### Opción 1: Asistente Interactivo de Setup (`agilent setup`)

```bash
# 1. Clonar el repositorio
git clone https://github.com/PeterRDev3l0per/rgf-agilent-native.git
cd rgf-agilent-native

# 2. Crear entorno virtual e instalar en modo editable
python -m venv .venv
.venv\Scripts\activate  # Windows (o source .venv/bin/activate en Linux/macOS)
pip install -e .[dev]

# 3. Ejecutar el asistente interactivo de onboarding
agilent setup
```

### Opción 2: Instalación Manual

```bash
# 1. Compilar el frontend React / Vite
cd frontend
npm install
npm run build
cd ..

# 2. Lanzar la aplicación Agilent
agilent up
```

Navegá a **`http://127.0.0.1:8000/app/`** en tu navegador.

---

## 🛠️ Integración con IDEs de IA

`agilent setup` te permite elegir tu entorno de desarrollo preferido:

| IDE | Protocolo de Integración | Configuración |
|-----|---------------------------|---------------|
| **Cursor IDE** | FastMCP Server | `.cursor/rules/agilent.md` |
| **VS Code** | FastMCP Client | `.vscode/settings.json` |
| **Antigravity IDE (Gemini)** | Custom Skill / Sidecar | `.agents/rules/agilent.md` |
| **PyCharm / JetBrains** | Tool Integration | `.idea/agilent.xml` |
| **Neovim / Terminal AI** | Lua Plugin / CLI | `.nvim/agilent.lua` |

---

## 📦 CI/CD & Liberación de Versiones

El repositorio incluye pipelines automatizados en GitHub Actions:

- **CI Build & Test** (`.github/workflows/ci.yml`): Se ejecuta en cada Push y PR probando el código en Python 3.10, 3.11, 3.12 y 3.13.
- **Release Pipeline** (`.github/workflows/release.yml`): Se activa al publicar una etiqueta de versión Git (ej. `git tag v1.0.0 && git push origin v1.0.0`) o mediante disparo manual en GitHub. Genera automáticamente las notas de versión y adjunta los binarios compilados en [GitHub Releases](https://github.com/PeterRDev3l0per/rgf-agilent-native/releases).

---

## 📑 Documentación Adicional

- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Modelo Entidad-Relación (ERD)](docs/ER_DIAGRAM.md)
- [Guía de Referencia CLI](docs/CLI_REFERENCE.md)
- [Casos de Uso E2E](docs/E2E_USE_CASES.md)
- [Auditoría de Seguridad OWASP](docs/SECURITY_AUDIT_AND_HARDENING.md)
- [Notas de Release v1.0.0](RELEASE_NOTES.md)
- [Historial de Cambios (Changelog)](CHANGELOG.md)

---

## 📄 Licencia

Publicado bajo la licencia [MIT](LICENSE).
