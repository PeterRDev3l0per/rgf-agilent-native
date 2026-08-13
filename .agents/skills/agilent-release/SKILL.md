---
name: agilent-release
description: "Trigger: release agilent, agilent release, publicar version, ejecutar ci cd, release pipeline, deploy version, release notes, publicar release. Execute end-to-end DevOps release pipeline with prechecks, automated test verification, release notes generation, version tagging, and GitHub Actions CI/CD deployment reporting."
license: MIT
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Activate this skill when:
- The user requests a new version release ("release agilent", "publicar version", "ejecutar ci cd", "release pipeline").
- Deploying a new production release tag to GitHub.

Do not activate for minor code edits or simple bugfixes that do not involve version release tagging.

## Hard Rules

- **Prechecks Gate**: Never create a Git tag or push to remote if any precheck or test fails.
- **Clean Working Tree**: Ensure all feature code is committed before running the release pipeline.
- **Zero-Drift Documentation**: Update `RELEASE_NOTES.md` and `CHANGELOG.md` before tagging.
- **No Manual Attribution**: Do not add AI attribution or "Co-Authored-By" trailers to release commits.

## Release Pipeline Execution Phases

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PHASE 1       │ ──>│   PHASE 2       │ ──>│   PHASE 3       │ ──>│   PHASE 4       │
│  Pre-Checks     │    │  Inter-Checks   │    │  Release Notes  │    │ Post-Checks &   │
│ (Env & Status)  │    │(Build & Pytest) │    │ & Version Bump  │    │ GitHub CI Push  │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Phase 1: Pre-Checks (Verificación Previa de Entorno y Estado)

1. Run `git status` to verify current working directory and active branch (`main`).
2. Run `uv run python scripts/setup.py --check-only` to verify Python >=3.10, Node.js >=18, and static build readiness.
3. Determine target release tag version `vX.Y.Z` (read from `pyproject.toml` or prompt/confirm version tag).

### Phase 2: Inter-Checks (Pruebas Automatizadas & Auditoría QA)

1. Rebuild frontend production bundle:
   ```bash
   npm --prefix frontend run build
   ```
2. Execute full Pytest test suite (Unit, OWASP Security, E2E Playwright, and Sandbox Installer):
   ```bash
   uv run pytest --tb=short -v
   ```
3. Confirm 100% test pass rate with 0 failures before proceeding.

### Phase 3: Release Notes & Documentation Sync

1. Update `RELEASE_NOTES.md` with:
   - Release Version Tag (`vX.Y.Z`).
   - Feature Highlights, Security Audit status, and Quickstart guidance.
2. Update `CHANGELOG.md` under `[vX.Y.Z]` section following *Keep a Changelog* standard.
3. Increment version string in `pyproject.toml` if modifying semantic version.

### Phase 4: Post-Checks & DevOps Delivery

1. Commit release documentation and version bump:
   ```bash
   git add .
   git commit -m "feat(release): vX.Y.Z release notes and version bump"
   ```
2. Tag release commit:
   ```bash
   git tag -a vX.Y.Z -m "Agilent Native Suite vX.Y.Z Release"
   ```
3. Push main branch and tags to GitHub:
   ```bash
   git push origin main --tags
   ```

### Phase 5: Output Contract & Summary Report

Generate a clean Markdown summary report formatted as follows:

```markdown
# 🚀 Agilent DevOps Release Summary Report — [vX.Y.Z]

### 📋 Pre-Checks & Environment Status
- **Python Runtime**: OK
- **Node.js / Vite**: OK
- **Working Tree**: Clean on branch `main`

### 🧪 Inter-Checks & Automated Verification
- **Vite Build**: Compiled in X.XXs
- **Pytest Suite**: XX/XX Passed (Unit, Security OWASP, E2E & Sandbox Installer)

### 📦 Release Delivery & CI/CD
- **Version Tag**: `vX.Y.Z`
- **GitHub Repository**: https://github.com/PeterRDev3l0per/rgf-agilent-native
- **GitHub Release Notes**: [RELEASE_NOTES.md](file:///a:/AI-Developments/RG_FLOWS/Projects/rgf-agilent-native/RELEASE_NOTES.md)
- **CI/CD Workflow**: https://github.com/PeterRDev3l0per/rgf-agilent-native/actions/workflows/release.yml
```

## References

- `docs/ARCHITECTURE.md` — System architecture and module boundaries.
- `.github/workflows/release.yml` — GitHub Actions release workflow.
- `scripts/setup.py` — Quickstart environment check script.
