# Agilent Native Suite v1.0.0 — Release Notes

🎉 **Agilent Native Suite v1.0.0** es la versión inicial de producción de la suite nativa de productividad y gestión de proyectos para desarrolladores e ingenieros de IA.

---

## 🌟 Destacados de la Versión

- **Zero-Paid-Token Architecture**: Operación 100% local con cero costo de tokens mediante GPU Ollama (`qwen3:14b`) y SQLite WAL.
- **Visual Kanban & Gantt Timeline UI**: Interfaz gráfica ultrafluida en React + TypeScript + TailwindCSS con diseño glassmorphic nativo.
- **Asistente RAG Local**: Búsqueda semántica sobre backlog, especificaciones y código sin enviar datos a servidores externos.
- **FastMCP Protocol Gateway**: Protocolo MCP de baja latencia (~300 tokens footprint) para interactuar directamente desde tu IDE de IA preferido.
- **Dynamic Island Notch Notifications**: Notificaciones animadas con física de resorte fluido (Apple Easing `cubic-bezier(0.16, 1, 0.3, 1)`).
- **Inicio Limpio desde 0**: Libre de datos harcodeados o tareas plantilla preexistentes.
- **Quickstart Installer & Multi-IDE Menu**: CLI interactivo `agilent setup` con menú contextual para Cursor, VS Code, Antigravity IDE, PyCharm y Neovim.

---

## 🚀 Guía de Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/PeterRDev3l0per/rgf-agilent-native.git
cd rgf-agilent-native

# 2. Ejecutar el Setup Interactivo
agilent setup
# o vía script: python scripts/setup.py
```

---

## 🛡️ Seguridad y Rendimiento

- **Auditoría de Seguridad**: Certificado con 0 vulnerabilidades OWASP (Sanitización XSS, escape SQLi/Path Traversal, defensas contra Prompt Injection).
- **Consumo de Memoria**: Servidor ultra-eficiente en FastAPI (<100 MB RAM, inicio en <1s).

---

## 📄 Licencia

Publicado bajo la licencia [MIT](LICENSE).
