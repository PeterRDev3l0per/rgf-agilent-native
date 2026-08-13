import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Activity } from "lucide-react";
import { Project } from "@/hooks/useProjects";
import ChatRagView from "./ChatRagView";

interface FloatingRagChatBubbleProps {
  currentProject: Project | null;
}

// ─── Message type shared with ChatRagView ────────────────────────
export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  context_documents?: Array<{ topic_key: string; snippet: string }>;
}

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutos
const MAX_MESSAGES = 15; // cuota por sesión para LLMs pequeños

function makeWelcomeMessage(): ChatMessage {
  return {
    id: `welcome-${Date.now()}`,
    sender: "bot",
    text: "¡Hola! Soy tu asistente de IA para el proyecto. ¿En qué te puedo ayudar hoy con el backlog, estado de tareas o especificaciones?",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export const FloatingRagChatBubble = ({ currentProject }: FloatingRagChatBubbleProps) => {
  const [open, setOpen] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);

  // ── Estado de chat elevado al padre para persistir entre open/close ──
  const [messages, setMessages] = useState<ChatMessage[]>([makeWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Inactivity timer ref — reinicia el chat después de 5 min sin enviar
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      setMessages([makeWelcomeMessage()]);
      setInput("");
    }, INACTIVITY_MS);
  }, []);

  // Iniciar el timer al montar
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [resetInactivityTimer]);

  // ── Send logic elevado al padre ────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    // Auto-reset al alcanzar la cuota de contexto
    const userMsgCount = messages.filter((m) => m.sender === "user").length;
    if (userMsgCount >= MAX_MESSAGES) {
      setMessages([
        {
          id: `system-reset-${Date.now()}`,
          sender: "bot",
          text: `⏱️ Se alcanzó el límite de ${MAX_MESSAGES} mensajes. La sesión se reinició automáticamente para liberar contexto del modelo local.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setInput("");
      resetInactivityTimer();
      return;
    }
    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    resetInactivityTimer(); // reset en cada envío

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_slug: currentProject?.slug || currentProject?.id || "rgf-agilent-native",
          question: userText,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.answer || "No se pudo obtener una respuesta del motor RAG.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        context_documents: data.context_documents,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "Error de conexión con el backend RAG. Por favor intentá de nuevo.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentProject, resetInactivityTimer]);

  // ── Poll Ollama status via /api/health — campo correcto: ollama.online ──
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          // La estructura real es: { ollama: { online: boolean } }
          setOllamaOnline(data?.ollama?.online === true);
        } else {
          setOllamaOnline(false);
        }
      } catch {
        setOllamaOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 6000);
    return () => clearInterval(interval);
  }, []);

  const statusLabel =
    ollamaOnline === null ? "Checking…" : ollamaOnline ? "Online" : "Offline";

  const statusColor =
    ollamaOnline === null
      ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
      : ollamaOnline
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";

  const statusDot =
    ollamaOnline === null
      ? "bg-yellow-400"
      : ollamaOnline
      ? "bg-emerald-400"
      : "bg-red-400";

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end">
      {/*
        ── Panel del chat ──
        Usamos visibility/translate en lugar de condicional JSX para NO
        desmontar ChatRagView → el estado de scroll y refs se preserva.
      */}
      <div
        className={[
          "mb-3 w-[92vw] sm:w-[420px] h-[520px] max-h-[72vh]",
          "rounded-2xl border border-white/10",
          "bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.75)]",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
            : "opacity-0 scale-95 pointer-events-none translate-y-3",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.03] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">
                Agilent — your local LLM
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-mono ${statusColor}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusDot} ${ollamaOnline ? "animate-pulse" : ""}`}
                  />
                  {statusLabel}
                </span>
                {/* Context quota counter */}
                <span className="text-[10px] text-white/30 font-mono">
                  {messages.filter((m) => m.sender === "user").length}/{MAX_MESSAGES} msgs
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat — siempre montado, estado persiste */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatRagView
            currentProject={currentProject}
            embeddedMode
            controlledMessages={messages}
            controlledInput={input}
            controlledLoading={loading}
            onInputChange={setInput}
            onSend={handleSend}
          />
        </div>
      </div>

      {/* ── Bubble trigger ── */}
      <button
        id="btn-floating-rag-bubble"
        onClick={() => setOpen((prev) => !prev)}
        className={[
          "group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full",
          "border border-cyan-500/30 bg-[#0a0a0a]/90 backdrop-blur-xl text-white",
          "shadow-[0_8px_30px_rgba(6,182,212,0.2)]",
          "hover:border-cyan-400 hover:shadow-[0_12px_40px_rgba(6,182,212,0.4)]",
          "transition-all duration-300 hover:scale-105",
        ].join(" ")}
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform flex-shrink-0">
          {open ? <X className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5 animate-pulse" />}
        </div>
        <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
          {open ? "Close" : "Ask AI status"}
        </span>
        {/* Live status dot en el trigger */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDot}`} />
        </span>
      </button>
    </div>
  );
};

export default FloatingRagChatBubble;
