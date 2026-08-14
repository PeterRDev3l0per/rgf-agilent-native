# Agilent Native Suite ⚡

[![CI/CD Pipeline](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/ci.yml/badge.svg)](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/ci.yml)
[![Release & Publish Version](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/release.yml/badge.svg)](https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](pyproject.toml)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](frontend/package.json)

**Agilent Native Suite** es una suite de productividad y gestión de proyectos nativa para desarrolladores e ingenieros de IA. Diseñada con una arquitectura **Zero-Paid-Token**, combina un tablero Kanban gráfico, timeline Gantt, un asistente de IA RAG local alimentado por GPU y una puerta de enlace FastMCP integrada directamente con tu IDE y Agentes de IA preferidos.

---

## 🚀 Quickstart & Instalación Instantánea

Instalá Agilent Native Suite en tu sistema ejecutando un solo comando en la terminal:

###  macOS & 🐧 Linux (Bash / Zsh)
```bash
curl -fsSL https://raw.githubusercontent.com/PeterRDev3l0per/rgf-agilent-native/main/scripts/install.sh | bash
```

### 🪟 Windows (PowerShell)
```powershell
iwr -useb https://raw.githubusercontent.com/PeterRDev3l0per/rgf-agilent-native/main/scripts/install.ps1 | iex
```

Una vez instalado, ejecutá `agilent setup` o `agilent up` y abrí tu navegador en **`http://127.0.0.1:8000/app/`**.

---

## 🌟 Características Principales

- **Arquitectura Zero-Paid-Token**: Procesa búsquedas semánticas y resúmenes con GPU Ollama local (`qwen3:14b`) sin enviar datos fuera de tu máquina.
- **Interfaz Glassmorphic Fluida**: Tablero Kanban, vista Gantt y notificaciones animadas en el Notch superior.
- **FastMCP Protocol Gateway**: Permite a tu Agente de IA en **Opencode**, **Codex**, **Claude Code**, **Pi**, **Cursor**, **VS Code**, **Antigravity IDE**, **PyCharm** o **Neovim** crear y consultar tareas con un consumo mínimo de contexto (~300 tokens).
- **Inicio Limpio de Producción**: La aplicación y cada nuevo proyecto nacen en **0 proyectos y 0 tareas (`[]`)**, listos para producción.
- **Asistente RAG Local**: Chat interactivo para consultar el estado del backlog, tarjetas y especificaciones en tiempo real.

---

## 💻 Matriz de Sistemas Operativos Soportados

| Sistema Operativo | Arquitectura | Terminal / Shell | Estado |
|-------------------|--------------|-------------------|--------|
| **Windows 10 / 11** | x64 / ARM64 | PowerShell 5.1+, Windows Terminal, CMD | ✅ Certificado |
| **Linux (Ubuntu / Debian / Arch / Fedora)** | x86_64 / AArch64 | Bash, Zsh, Fish | ✅ Certificado |
| **macOS (Intel & Apple Silicon M-Series)** | x86_64 / arm64 (M1-M4) | Zsh, Terminal, iTerm2 | ✅ Certificado |

---

## 🛠️ Integración con IDEs de IA & Orquestadores de Agentes

`agilent setup` te permite elegir tu entorno de desarrollo o agente preferido:

| IDE / Agente / Orquestador | Protocolo de Integración | Configuración |
|----------------------------|---------------------------|---------------|
| **Opencode Agent** | FastMCP / OpenSpec Native | `.agents/rules/agilent.md` |
| **Codex Agent** | FastMCP Protocol Gateway | `.agents/rules/agilent.md` |
| **Claude Code CLI** | FastMCP / Native Tooling | `.claude/rules/agilent.md` |
| **Pi Agent Framework** | Custom Agent Tooling | `.pi/rules/agilent.md` |
| **Cursor IDE** | FastMCP Server | `.cursor/rules/agilent.md` |
| **Antigravity IDE (Gemini)** | Custom Skill / Sidecar | `.agents/rules/agilent.md` |
| **VS Code** | FastMCP Client | `.vscode/settings.json` |
| **PyCharm / JetBrains** | Tool Integration | `.idea/agilent.xml` |
| **Neovim / Terminal AI** | Lua Plugin / CLI | `.nvim/agilent.lua` |
| **Gentle AI / Mission Control** | Agent Teams Gateway | `mcp_config.json` |

---

## 🤝 Contributing

Las contribuciones son las que hacen que la comunidad open-source sea un lugar increíble para aprender, inspirar y crear. Por favor, lee nuestra **[Guía de Contribución (CONTRIBUTING.md)](CONTRIBUTING.md)** para comenzar con el entorno de desarrollo local, ejecución de pruebas y envío de Pull Requests.

---

## 📑 Documentación Adicional

- [Guía de Contribución](CONTRIBUTING.md)
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Modelo Entidad-Relación (ERD)](docs/ER_DIAGRAM.md)
- [Guía de Referencia CLI](docs/CLI_REFERENCE.md)
- [Casos de Uso E2E](docs/E2E_USE_CASES.md)
- [Auditoría de Seguridad OWASP](docs/SECURITY_AUDIT_AND_HARDENING.md)
- [Notas de Release v1.0.0](RELEASE_NOTES.md)
- [Historial de Cambios (Changelog)](CHANGELOG.md)

---

## 📄 Licencia

Publicado bajo la licencia [MIT](LICENSE). Software de código abierto construido para la comunidad de desarrolladores de IA.
