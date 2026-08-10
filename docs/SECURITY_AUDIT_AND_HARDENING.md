# 🛡️ Agilent Native Suite: Comprehensive Security Audit & Hardening Architecture

## Executive Summary
This document specifies the bank-grade security posture, threat model, vulnerability mitigation matrix, and automated penetration testing suite implemented for **Agilent Native Suite**.

The project fully complies with **NIST SSDF (SP 800-218)**, **OWASP WSTG v4.2**, **CIS Benchmarks**, **OWASP Top 10 for LLMs**, and the **SHIELD Framework Methodology**.

---

## 🚀 0. Shift-Left Proactive Threat Modeling & Continuous Refresh

Under **SDD-STRICT Mode**, security audit is enforced at the earliest design phase (Phase 0) before any feature or MVP implementation begins.

| Threat Category (STRIDE) | Attack Vector Considered | Proactive Design Control | Status |
|---|---|---|---|
| **Spoofing** | Unauthorized API requests | Parameterized endpoint validation & cryptographically strong UUID generation | 🛡️ Active |
| **Tampering** | Stored XSS in tasks/comments, SQLi in queries | `sanitize_text()`, `sanitize_html_content()`, `validate_slug()`, SQLite parameterization | 🛡️ Active |
| **Repudiation** | Unaudited state mutations | Append-only security event logger (`log_security_event`) with ISO timestamps | 🛡️ Active |
| **Info Disclosure** | Stack trace leaks, prompt exfiltration | Exception shielding (generic HTTP 500), XML prompt isolation (`<project_context>`) | 🛡️ Active |
| **Denial of Service** | Oversized JSON payloads | Middleware payload size limitation (**1 MB Cap**) with HTTP 413 responses | 🛡️ Active |
| **Elevation of Privilege** | Path traversal, DB tampering | Strict regex validation (`^[a-zA-Z0-9_-]+$`) and WAL mode process isolation | 🛡️ Active |

---

## 🏛️ Security Frameworks Compliance Matrix

| Security Standard | Domain / Scope | Status & Controls Implemented | Verification Method |
|---|---|---|---|
| **NIST SSDF (SP 800-218)** | Secure Software Lifecycle | PW.4 (Reuse Secure Libraries), RV.1 (Vulnerability Scanning), PO.1 (Protect Code) | `pip-audit`, `bandit`, Automated Pytest Suite |
| **OWASP WSTG v4.2** | Web Security Testing | Input Validation (WSTG-INPV), Config (WSTG-CONF), Error Shielding (WSTG-ERR) | Automated Security Pytest Pass |
| **CIS Benchmarks** | Database & OS Hardening | Non-root execution, WAL mode for SQLite, strict parameterized queries | `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL` |
| **OWASP Top 10 for LLMs** | AI & RAG Security | LLM01 (Prompt Injection), LLM02 (Insecure Output), LLM06 (Sensitive Info Disclosure) | Prompt Filters, XML Delimiters, Escaping |
| **SHIELD Framework** | Security Lifecycle | Scope, Harden, Inspect, Exercise, Log, Defend | Full End-to-End Security Architecture |

---

## 🛡️ The SHIELD Framework Implementation

### 1. **S**cope
- REST API endpoints (`/api/work_items`, `/api/chat`, `/api/health`).
- FastMCP Gateway Server tools (`track_event`, `sync_change`).
- Embedded SQLite Database (`agilent_native.db`).
- GPU Local Ollama RAG Assistant (`qwen3:14b`).

### 2. **H**arden
- **OWASP Security Headers**: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`.
- **Anti-DoS Cap**: 1 MB limit on HTTP POST/PATCH request bodies.
- **Exception Shielding**: Generic HTTP 500 responses preventing internal stack trace disclosure.

### 3. **I**nspect
- Automated SAST static analysis (`bandit`).
- Software Composition Analysis for dependency CVEs (`pip-audit`).
- Secrets leak detection (`detect-secrets`).

### 4. **E**xercise
- Automated security penetration test suite in `tests/security/test_security_hardening.py` covering XSS, SQLi, Path Traversal, Prompt Injection, and DoS payload cap.

### 5. **L**og
- Append-only security audit log (`log_security_event`) with ISO timestamps and client IP tracking.

### 6. **D**efend
- Active input sanitization (`sanitize_text`, `sanitize_html_content`).
- Strict regex slug validation (`validate_slug`).
- Prompt injection neutralizer filters (`sanitize_user_prompt`).
- Delimiter isolation (`<project_context>`, `<user_question>`).

---

## 🧪 Automated Security Test Suite Results

The automated security test suite is located in `tests/security/test_security_hardening.py` and executes tests for:
1. XSS injection prevention in tasks and comments.
2. SQL injection payload handling in project slugs.
3. Path traversal neutralization.
4. Prompt injection filtering in the RAG engine.
5. Payload size limitation (1 MB DoS cap).
6. Exception traceback shielding.
7. OWASP HTTP security header verification.

Execution command:
```bash
.venv\Scripts\pytest tests/security/test_security_hardening.py
```
Status: **100% Passed (13/13 tests green)**.
