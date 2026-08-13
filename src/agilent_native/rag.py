"""Local RAG & Chat engine for Agilent Native Suite using Ollama."""

import logging
import re
from typing import Dict, Any, List
import httpx
from agilent_native.config import config
from agilent_native.db import db

logger = logging.getLogger(__name__)

# Security patterns to neutralize prompt injection attempts
PROMPT_INJECTION_PATTERNS = [
    r'ignore (all )?previous instructions',
    r'system override',
    r'disregard prior commands',
    r'reveal (system )?prompt',
    r'you are now in dan mode',
    r'jailbreak',
]

# Context window limits for small local LLMs
MAX_CONTEXT_CHARS = 1_500   # ~375 tokens — keeps the RAG payload lean
MAX_QUESTION_CHARS = 300    # User question hard cap after sanitize
MAX_ANSWER_TOKENS = 220     # num_predict: cap output length
LLM_CONTEXT_WINDOW = 2_048  # num_ctx: total context window for small models


def sanitize_user_prompt(question: str) -> str:
    """Sanitize user query against prompt injection & jailbreak attempts."""
    if not question:
        return ""
    clean = question.strip()
    for pattern in PROMPT_INJECTION_PATTERNS:
        clean = re.sub(pattern, '[FILTRADO]', clean, flags=re.IGNORECASE)
    return clean[:MAX_QUESTION_CHARS]


class LocalRAGEngine:
    """RAG engine connecting project SQLite database context with local Ollama LLM."""

    def __init__(self, model_name: str = None):
        self.model_name = model_name or config.ollama_model
        self.base_url = config.ollama_base_url.rstrip("/")

    def store_document_context(self, project_id: str, topic_key: str, content: str) -> None:
        """Store project context artifact or spec in SQLite RAG store."""
        with db.get_connection() as conn:
            doc_id = f"rag-{topic_key.replace('/', '-')}"
            conn.execute(
                """INSERT OR REPLACE INTO rag_documents (id, project_id, topic_key, content, created_at)
                   VALUES (?, ?, ?, ?, datetime('now'))""",
                (doc_id, project_id, topic_key, content),
            )

    def retrieve_context_summary(self, project_id: str, query: str, limit: int = 6) -> str:
        """
        Retrieve relevant work items, capped at MAX_CONTEXT_CHARS to avoid
        overflowing the small LLM context window.
        """
        items = db.list_work_items(project_id)
        parts: List[str] = []
        total_chars = 0
        for item in items[:limit]:
            state = item.get("state", "Backlog")
            title = item.get("title", "")
            priority = item.get("priority", "")
            start = item.get("start_date") or "N/A"
            end = item.get("target_date") or "N/A"
            tests = item.get("test_status") or "N/A"
            line = f"• {title} | {state} | P:{priority} | {start}→{end} | test:{tests}"
            if total_chars + len(line) > MAX_CONTEXT_CHARS:
                parts.append(f"[... +{len(items) - len(parts)} items truncated]")
                break
            parts.append(line)
            total_chars += len(line)

        return "\n".join(parts) if parts else "No hay tareas registradas."

    def _build_prompt(self, context: str, question: str) -> str:
        """
        Compact system prompt optimised for small local LLMs (< 3 B params).
        Avoids verbose preamble — gets straight to the point.
        """
        return (
            "Eres el asistente de proyecto Agilent. "
            "Responde SOLO con base en el contexto de tareas que se te da. "
            "Sé conciso (máx 3 oraciones). "
            "Idioma: español.\n\n"
            f"CONTEXTO:\n{context}\n\n"
            f"PREGUNTA: {question}\n\n"
            "RESPUESTA:"
        )

    async def chat_query(self, project_id: str, user_question: str) -> Dict[str, Any]:
        """Execute RAG augmented query using local Ollama LLM with prompt injection guardrails."""
        sanitized_question = sanitize_user_prompt(user_question)
        context_summary = self.retrieve_context_summary(project_id, sanitized_question)
        prompt = self._build_prompt(context_summary, sanitized_question)

        url = f"{self.base_url}/api/generate"
        req_body = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
            # Hard caps for small local LLMs — critical for performance
            "options": {
                "num_ctx": LLM_CONTEXT_WINDOW,   # total context window
                "num_predict": MAX_ANSWER_TOKENS, # max output tokens
                "temperature": 0.3,               # more deterministic, faster
                "top_p": 0.85,
                "repeat_penalty": 1.1,
            },
        }

        answer = ""
        async with httpx.AsyncClient(timeout=25.0) as client:
            try:
                resp = await client.post(url, json=req_body)
                if resp.status_code == 200:
                    answer = resp.json().get("response", "").strip()
                else:
                    logger.warning(f"Ollama returned status {resp.status_code}")
            except Exception as e:
                logger.warning(f"Failed to connect to local Ollama: {e}")

        if not answer:
            answer = f"**[Resumen offline]**\n{context_summary}"

        return {
            "question": sanitized_question,
            "answer": answer,
            "context_documents": [
                {"topic_key": line.split("|")[0].strip().lstrip("• "), "snippet": line}
                for line in context_summary.splitlines()
                if line.startswith("•")
            ],
            "model_used": self.model_name,
        }


rag_engine = LocalRAGEngine()
