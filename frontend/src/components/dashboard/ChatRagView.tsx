import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Project } from "@/hooks/useProjects";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  context_documents?: Array<{ topic_key: string; snippet: string }>;
}

interface ChatRagViewProps {
  currentProject: Project | null;
  /** When true: fills parent, no page padding, no internal header */
  embeddedMode?: boolean;
  /** Controlled props — used when embeddedMode + parent owns the state */
  controlledMessages?: Message[];
  controlledInput?: string;
  controlledLoading?: boolean;
  onInputChange?: (val: string) => void;
  onSend?: () => void;
}

export const ChatRagView = ({
  currentProject,
  embeddedMode = false,
  controlledMessages,
  controlledInput,
  controlledLoading,
  onInputChange,
  onSend,
}: ChatRagViewProps) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "¡Hola! Soy tu asistente de Inteligencia Artificial para el proyecto. ¿En qué te puedo ayudar hoy con el backlog, estado de tareas o especificaciones?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveMessages = controlledMessages ?? messages;
  const effectiveInput = controlledInput !== undefined ? controlledInput : input;
  const effectiveLoading = controlledLoading !== undefined ? controlledLoading : loading;

  const handleInputChange = (val: string) => {
    if (onInputChange) onInputChange(val);
    else setInput(val);
  };

  const handleTriggerSend = () => {
    if (onSend) onSend();
    else handleSend();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change or on mount
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Also scroll on first render so the latest message is visible when panel opens
  useEffect(() => {
    scrollToBottom();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_slug: currentProject?.slug || currentProject?.id || "rgf-agilent-native",
          question: userText,
        }),
      });

      if (!res.ok) {
        throw new Error("API response error");
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.answer || "No se pudo obtener una respuesta del motor RAG.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        context_documents: data.context_documents,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "Error de conexión con el backend de RAG. Por favor intentá de nuevo.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: "Chat reiniciado. ¿En qué te puedo ayudar?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (embeddedMode) {
    // En modo embebido usa el estado controlado del padre (persiste entre open/close)
    const embeddedMessages = controlledMessages ?? messages;
    const embeddedInput = controlledInput ?? input;
    const embeddedLoading = controlledLoading ?? loading;
    const handleEmbeddedInputChange = onInputChange ?? setInput;
    const handleEmbeddedSend = onSend ?? handleSend;

    const handleEmbeddedKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleEmbeddedSend();
      }
    };

    return (
      <div className="h-full flex flex-col overflow-hidden bg-[#0a0a0a]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {embeddedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[88%] ${
                msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  msg.sender === "user"
                    ? "bg-cyan-500 text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <div
                  className={`px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-cyan-500/20 border border-cyan-500/30 text-white rounded-tr-none"
                      : "bg-white/5 border border-white/10 text-white/85 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.context_documents && msg.context_documents.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/40 space-y-1">
                      {msg.context_documents.map((doc, idx) => (
                        <div key={idx} className="font-mono">📌 {doc.topic_key}</div>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] text-white/30 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
          {embeddedLoading && (
            <div className="flex gap-2.5 mr-auto max-w-[88%]">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="px-3 py-2.5 rounded-xl rounded-tl-none bg-white/5 border border-white/10 text-white/50 text-xs flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                <span>{t("chat.thinking")}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input footer */}
        <div className="px-3 pb-3 pt-2 border-t border-white/[0.08] bg-white/[0.02] flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-500/40 transition-all">
            <input
              id="chat-embedded-input"
              type="text"
              value={embeddedInput}
              onChange={(e) => handleEmbeddedInputChange(e.target.value)}
              onKeyDown={handleEmbeddedKeyDown}
              placeholder={t("chat.placeholder")}
              disabled={embeddedLoading}
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30"
            />
            <Button
              id="btn-send-embedded-chat"
              onClick={handleEmbeddedSend}
              disabled={!embeddedInput.trim() || embeddedLoading}
              size="icon"
              className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white hover:opacity-90 flex-shrink-0"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] flex flex-col p-2 md:p-4 pt-16 md:pt-20">
      {/* Outer Glow Container Google AI Studio Style */}
      <div className="relative flex-1 flex flex-col rounded-2xl p-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 via-purple-500 to-pink-500 shadow-2xl shadow-cyan-500/10 overflow-hidden">
        {/* Inner Card Body */}
        <div className="flex-1 flex flex-col bg-background/95 backdrop-blur-xl rounded-[14px] overflow-hidden border border-border/40">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/60 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-base tracking-tight flex items-center gap-2">
                  {t("chat.title")}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono border border-emerald-500/20">
                    SQLite RAG
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">{t("chat.subtitle")}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("chat.clear")}
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {effectiveMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                  }`}
                >
                  {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                        : "bg-card/90 border border-border/60 text-card-foreground rounded-tl-none shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {msg.context_documents && msg.context_documents.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/40 text-xs text-muted-foreground space-y-1">
                        <span className="font-semibold text-[11px] uppercase tracking-wider text-primary">
                          Documentos RAG consultados:
                        </span>
                        {msg.context_documents.map((doc, idx) => (
                          <div key={idx} className="bg-muted/40 p-1.5 rounded text-[11px] font-mono">
                            📌 {doc.topic_key}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] text-muted-foreground ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {effectiveLoading && (
              <div className="flex gap-3 mr-auto max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-card/90 border border-border/60 text-muted-foreground text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span>{t("chat.thinking")}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-4 border-t border-border/50 bg-card/40 backdrop-blur-md">
            <div className="flex items-center gap-3 bg-muted/20 border border-border/60 rounded-xl px-4 py-2.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <input
                id="chat-input"
                type="text"
                value={effectiveInput}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder")}
                disabled={effectiveLoading}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button
                id="btn-send-chat"
                onClick={handleTriggerSend}
                disabled={!effectiveInput.trim() || effectiveLoading}
                size="icon"
                className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/20 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatRagView;
