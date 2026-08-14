# Contributing to RGF Agilent Native Suite ⚡

First off, thank you for considering contributing to **Agilent Native Suite**! It's contributions like yours that make the open-source AI community an inspiring place to innovate.

---

## 📜 Code of Conduct & Principles

1. **AI-First & Zero-Paid-Token**: All core architecture decisions prioritize local GPU execution (Ollama) and local persistence (SQLite WAL) without requiring paid API tokens.
2. **SOLID & Clean Architecture**: Maintain strict separation between UI components (`frontend/src/components/`), application hooks (`frontend/src/hooks/`), and Python backend services (`src/agilent_native/`).
3. **No Unhandled Exceptions**: All CLI entrypoints and FastMCP handlers must fail gracefully with informative error messages.

---

## 🚀 Getting Started with Local Development

### 1. Fork & Clone the Repository

```bash
# 1. Clone your fork
git clone https://github.com/YOUR-USERNAME/rgf-agilent-native.git
cd rgf-agilent-native

# 2. Add upstream remote
git remote add upstream https://github.com/PeterRDev3l0per/rgf-agilent-native.git
```

### 2. Set Up Python Development Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install package in editable mode with development dependencies
pip install -e .[dev]
```

### 3. Set Up Frontend Development (React + Vite)

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server with Hot Module Replacement (HMR)
npm run dev

# Build production bundle to src/agilent_native/static/
npm run build
```

---

## 🧪 Running Automated Tests

We maintain a 100% clean test suite covering Unit, OWASP Security Hardening, Sandbox Installer, and Playwright E2E tests.

```bash
# Run full Pytest suite
uv run pytest -v

# Run specific test modules
uv run pytest tests/test_server.py -v
uv run pytest tests/security/ -v
uv run pytest tests/test_installer_sandbox.py -v
```

---

## 📝 Commit Conventions

We enforce **Conventional Commits**. Please format your commit messages as:

- `feat(scope): add new feature` (e.g. `feat(mcp): add support for new agent protocol`)
- `fix(scope): resolve bug` (e.g. `fix(ui): resolve task card overlay z-index issue`)
- `docs(scope): update documentation` (e.g. `docs(readme): update setup instructions`)
- `refactor(scope): code cleanup without functional change`
- `test(scope): add or update automated test cases`

---

## 🔀 Submitting a Pull Request (PR)

1. Create a feature branch: `git checkout -b feat/my-new-feature`.
2. Commit your changes following Conventional Commits.
3. Ensure all Pytest and build checks pass (`uv run pytest` & `npm run build`).
4. Push to your fork: `git push origin feat/my-new-feature`.
5. Open a Pull Request against the `main` branch of `PeterRDev3l0per/rgf-agilent-native`.
6. GitHub Actions CI/CD will run `ruff` linting and test passes across Python 3.10, 3.11, 3.12, and 3.13.

---

## 📄 License

By contributing to Agilent Native Suite, you agree that your contributions will be licensed under its [MIT License](LICENSE).
