# Agilent Native Suite — CLI Reference Guide

La herramienta de línea de comandos `agilent` permite gestionar, verificar y lanzar la suite de productividad.

## 🛠️ Comandos Disponibles

### 1. `agilent setup`
Ejecuta el asistente interactivo de onboarding e instalación de la suite.
```bash
agilent setup
```
**Opciones**:
- `--check-only`: Ejecuta la verificación de entorno sin solicitar entradas interactivas (ideal para scripts de CI/CD).
- `--non-interactive` / `-y`: Selecciona las opciones por defecto sin bloquear la terminal.

---

### 2. `agilent status` / `agilent`
Muestra el diagnóstico de salud del sistema, incluyendo conectividad a SQLite, GPU Ollama y servidor FastAPI.
```bash
agilent status
```

---

### 3. `agilent test`
Ejecuta la suite completa de pruebas unitarias, de seguridad OWASP y E2E Playwright.
```bash
agilent test
```

---

### 4. `agilent up`
Inicia el servidor backend en FastAPI escuchando en `http://127.0.0.1:8000`.
```bash
agilent up
```
