"""Local RAG & Chat engine for Agilent Native Suite using Ollama."""

import logging
from typing import Dict, Any, List
import httpx
from agilent_native.config import config
from agilent_native.db import db

logger = logging.getLogger(__name__)


class LocalRAGEngine:
    """RAG engine connecting project SQLite database context with local Ollama LLM."""

    def __init__(self, model_name: str = None):
        self.model_name = model_name or config.ollama_model
        self.base_url = config.ollama_base_url.rstrip("/")

    def store_document_context(self, project_id: str, topic_key: str, content: str) -> None:
        """Store project context artifact or spec in SQLite RAG store."""
        with db.get_connection() as conn:
            doc_id = f"rag-{topic_key.replace('/', '-')}"
            now = db.get_work_item(doc_id) or {}
            conn.execute(
                """INSERT OR REPLACE INTO rag_documents (id, project_id, topic_key, content, created_at)
                   VALUES (?, ?, ?, ?, datetime('now'))""",
                (doc_id, project_id, topic_key, content),
            )

    def retrieve_context_summary(self, project_id: str, query: str, limit: int = 5) -> str:
        """Retrieve relevant project work items and RAG docs from SQLite."""
        items = db.list_work_items(project_id)
        relevant_parts = []
        for item in items[:limit]:
            state = item.get("state", "Backlog")
            title = item.get("title", "")
            dates = f"Inicio: {item.get('start_date') or 'N/A'} | Término: {item.get('target_date') or 'N/A'}"
            tests = item.get("test_status") or "N/A"
            relevant_parts.append(f"• Tarea: {title} | Estado: {state} | Fechas: {dates} | Pruebas: {tests}")

        return "\n".join(relevant_parts) if relevant_parts else "No se encontraron tareas registradas en el proyecto."

    async def chat_query(self, project_id: str, user_question: str) -> Dict[str, Any]:
        """Execute RAG augmented query using local Ollama LLM at $0 token cost."""
        context_summary = self.retrieve_context_summary(project_id, user_question)

        prompt = f"""You are the Agilent Native AI Project Assistant for the current software project.
Here is the active project context & task history from SQLite:
{context_summary}

User Question: {user_question}

Provide a helpful, precise, and professional technical response in SPANISH based on the project context above.
If the answer is present in the context, highlight task states, test results, or timelines clearly.
Keep your response clean and concise (max 200 words)."""

        url = f"{self.base_url}/api/generate"
        req_body = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
        }

        answer = ""
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await client.post(url, json=req_body)
                if resp.status_code == 200:
                    answer = resp.json().get("response", "").strip()
                else:
                    logger.warning(f"Ollama returned status {resp.status_code}")
            except Exception as e:
                logger.warning(f"Failed to connect to local Ollama: {e}")

        if not answer:
            answer = f"**[Modo Resumen Offline]** Basado en los registros del proyecto en SQLite:\n{context_summary}"

        return {
            "question": user_question,
            "answer": answer,
            "context_used": context_summary,
            "model_used": self.model_name,
        }


rag_engine = LocalRAGEngine()
