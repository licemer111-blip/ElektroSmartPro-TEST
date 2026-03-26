"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  MessageCircle,
  EyeOff,
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "Jak szybko wycenić mieszkanie 60m²?",
  "Kiedy VAT 8% a kiedy 23%?",
  "Jak działa pipeline L0→L1→L2→L3?",
  "Jak wygenerować pozycje z opisu słownego?",
  "Jak skonfigurować rozdzielnicę i wyeksportować BOM?",
  "Jaki kabel na obwód 25A, 20m, cosφ=0.85?",
  "Kiedy stosować współczynnik trudności ×1.22?",
  "Jak wydrukować PDF kosztorysu z KNR?",
];

const STORAGE_KEY_HIDDEN = "ai-helper-hidden";
const STORAGE_KEY_MESSAGES = "ai-helper-messages";
const MAX_STORED_MESSAGES = 200;
const DRAG_THRESHOLD = 6;

export function AiHelperWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (stored) return JSON.parse(stored) as Message[];
    } catch { /* ignore */ }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track visual viewport height for mobile keyboard handling
  useEffect(() => {
    const updateVH = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      setViewportHeight(vh);
    };
    updateVH();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateVH);
      vv.addEventListener("scroll", updateVH);
    }
    window.addEventListener("resize", updateVH);
    return () => {
      if (vv) {
        vv.removeEventListener("resize", updateVH);
        vv.removeEventListener("scroll", updateVH);
      }
      window.removeEventListener("resize", updateVH);
    };
  }, []);

  // Scroll messages to bottom when keyboard opens
  useEffect(() => {
    if (isOpen && viewportHeight > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [viewportHeight, isOpen]);

  // Drag state - use refs to avoid re-renders during drag
  const btnRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const startPos = useRef({ right: 16, bottom: 80 });
  const startMouse = useRef({ x: 0, y: 0 });
  // Position is bottom-right offset in px
  const posRef = useRef({ right: 16, bottom: 80 });

  // Load persisted hidden state on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY_HIDDEN) === "true") {
        setIsHidden(true);
      }
    } catch { /* ignore */ }
  }, []);

  const hideWidget = useCallback(() => {
    setIsHidden(true);
    setIsOpen(false);
    try { localStorage.setItem(STORAGE_KEY_HIDDEN, "true"); } catch { /* ignore */ }
  }, []);

  const showWidget = useCallback(() => {
    setIsHidden(false);
    try { localStorage.removeItem(STORAGE_KEY_HIDDEN); } catch { /* ignore */ }
  }, []);

  // Persist messages to localStorage on every change (capped at MAX_STORED_MESSAGES)
  useEffect(() => {
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(toStore));
    } catch { /* ignore quota errors */ }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `⚠️ ${data.error}` },
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "⚠️ Błąd połączenia. Spróbuj ponownie.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // --- Drag logic using document-level listeners for reliable mobile drag ---
  const applyPosition = useCallback(() => {
    if (!btnRef.current) return;
    btnRef.current.style.right = `${posRef.current.right}px`;
    btnRef.current.style.bottom = `${posRef.current.bottom}px`;
  }, []);

  const onDocPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startMouse.current.x;
    const dy = e.clientY - startMouse.current.y;
    if (!didDrag.current && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    didDrag.current = true;
    const newRight = Math.max(0, Math.min(startPos.current.right - dx, window.innerWidth - 72));
    const newBottom = Math.max(0, Math.min(startPos.current.bottom - dy, window.innerHeight - 72));
    posRef.current = { right: newRight, bottom: newBottom };
    applyPosition();
    e.preventDefault();
  }, [applyPosition]);

  const onDocPointerUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener("pointermove", onDocPointerMove);
    document.removeEventListener("pointerup", onDocPointerUp);
    document.removeEventListener("pointercancel", onDocPointerUp);
  }, [onDocPointerMove]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    didDrag.current = false;
    startMouse.current = { x: e.clientX, y: e.clientY };
    startPos.current = { right: posRef.current.right, bottom: posRef.current.bottom };
    document.addEventListener("pointermove", onDocPointerMove);
    document.addEventListener("pointerup", onDocPointerUp);
    document.addEventListener("pointercancel", onDocPointerUp);
    e.preventDefault();
  }, [onDocPointerMove, onDocPointerUp]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", onDocPointerMove);
      document.removeEventListener("pointerup", onDocPointerUp);
      document.removeEventListener("pointercancel", onDocPointerUp);
    };
  }, [onDocPointerMove, onDocPointerUp]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Toggle with click (not drag)
  const handleButtonClick = () => {
    if (!didDrag.current) {
      setIsOpen((prev) => !prev);
    }
  };

  // Simple markdown rendering (bold, lists)
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (processed.startsWith("- ")) {
        processed = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 mt-[7px] flex-shrink-0"></span>${processed.slice(2)}`;
        return (
          <div key={i} className="flex items-start" dangerouslySetInnerHTML={{ __html: processed }} />
        );
      }
      if (processed.trim() === "") return <br key={i} />;
      return (
        <p key={i} className="mb-1" dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  // --- Hidden state: show edge tab ---
  if (isHidden) {
    return (
      <button
        onClick={showWidget}
        className="fixed z-[9999] right-0 bottom-32 flex items-center gap-1.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white pl-2.5 pr-1.5 py-2.5 rounded-l-xl shadow-lg hover:pl-4 transition-all duration-200 group"
        title="Pokaż Asystenta ES"
      >
        <Bot className="w-4 h-4" />
        <span className="text-[10px] font-semibold opacity-80 group-hover:opacity-100">ES</span>
      </button>
    );
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (() => {
        const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
        const vvH = viewportHeight || (typeof window !== "undefined" ? window.innerHeight : 600);
        const vvTop = (typeof window !== "undefined" ? window.visualViewport?.offsetTop : 0) ?? 0;

        let panelStyle: React.CSSProperties;
        let panelClass: string;

        if (isMobile) {
          panelStyle = { left: 0, top: `${vvTop}px`, width: "100vw", height: `${vvH}px` };
          panelClass = "fixed z-[9999] bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200";
        } else {
          const panelW = Math.min(380, window.innerWidth - 32);
          const panelH = Math.min(520, window.innerHeight - 100);
          const btnBottom = posRef.current.bottom;
          const btnRight = posRef.current.right;
          const spaceAbove = window.innerHeight - btnBottom - 72;
          const openAbove = spaceAbove > panelH + 8;
          const topVal = openAbove ? undefined : (window.innerHeight - btnBottom + 8);
          const bottomVal = openAbove ? (btnBottom + 72) : undefined;
          const rightVal = Math.min(btnRight, window.innerWidth - panelW - 8);
          panelStyle = {
            ...(bottomVal !== undefined ? { bottom: `${bottomVal}px` } : { top: `${topVal}px` }),
            right: `${Math.max(8, rightVal)}px`,
            width: `${panelW}px`,
            height: `${panelH}px`,
          };
          panelClass = "fixed z-[9999] shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300";
        }

        return (
        <div ref={panelRef} className={panelClass} style={panelStyle}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">ES-Expert</h3>
                <p className="text-[10px] text-white/70">Dokumentacja i Normy • ElektroSmart PRO v2.1</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={hideWidget}
                title="Ukryj asystenta"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                title="Zamknij"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
                  ES-Expert v2.1
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Asystent inżynieryjny ElektroSmart PRO. Pytaj o normy KNR, bezpieczeństwo elektryczne, optymalizację kosztorysów, funkcje aplikacji.
                </p>
                <div className="space-y-2">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3 inline mr-2 text-blue-500" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-3 shrink-0">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Input
                  id="ai-helper-input"
                  name="ai-helper-input"
                  ref={inputRef}
                  aria-label="Zadaj pytanie asystentowi ES-Expert"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Zadaj pytanie lub nagraj głosem..."
                  className="text-xs h-9 pr-9"
                  disabled={isLoading}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <VoiceInputButton
                    onTranscript={(text) => {
                      setInput((prev) => prev ? `${prev} ${text}` : text);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    disabled={isLoading}
                    title="Nagraj pytanie głosem (ES Voice)"
                    className="w-6 h-6"
                  />
                </div>
              </div>
              <Button
                size="icon"
                className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {messages.length > 0 && (
              <div className="mt-1.5">
                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors"
                  >
                    Wyczyść historię
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                    <span className="text-[10px] text-red-700 dark:text-red-300 flex-1">
                      Na pewno wyczyścić całą historię?
                    </span>
                    <button
                      onClick={() => {
                        setMessages([]);
                        setShowClearConfirm(false);
                        try { localStorage.removeItem(STORAGE_KEY_MESSAGES); } catch { /* ignore */ }
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      Usuń
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      Anuluj
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* Floating Button */}
      <div
        ref={btnRef}
        className="fixed z-[9999] select-none"
        style={{ right: "16px", bottom: "80px" }}
      >
        {/* Hide button - appears on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); hideWidget(); }}
          className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-red-500 transition-all z-10 shadow-md"
          style={{ opacity: 0 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
          title="Ukryj asystenta ES"
        >
          <X className="w-3 h-3" />
        </button>

        <button
          onPointerDown={onPointerDown}
          onClick={handleButtonClick}
          style={{ touchAction: "none" }}
          className={`group relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${
            isOpen
              ? "bg-slate-700 hover:bg-slate-800"
              : "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
          } cursor-pointer hover:scale-105 active:scale-95`}
          title="ElektroSmart Core — Silnik Inżynieryjny"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-white" />
              {messages.length === 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );
}
