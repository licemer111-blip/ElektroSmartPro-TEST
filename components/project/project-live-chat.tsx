"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Loader2,
} from "lucide-react";
import {
  getProjectMessages,
  sendProjectMessage,
  type ChatMessage,
} from "@/app/dashboard/projects/[id]/chat-actions";
import { createBrowserClient } from "@supabase/ssr";

interface ProjectLiveChatProps {
  projectId: string;
  userId: string;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectLiveChat({ projectId, userId, userName, isOpen, onClose }: ProjectLiveChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load messages when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      loadMessages();
      setUnreadCount(0);
    }
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen, isMinimized, projectId]);

  // Subscribe to realtime messages
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Add minimal info — we'll enrich on next full load
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              ...prev,
              {
                ...newMsg,
                user_email: newMsg.user_id === userId ? userName || "Ty" : "...",
                user_name: newMsg.user_id === userId ? userName || "Ty" : "...",
              },
            ];
          });

          if (newMsg.user_id !== userId) {
            if (!isOpen || isMinimized) {
              setUnreadCount((c) => c + 1);
            }
            // Reload to get proper user names
            loadMessages();
          }

          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, userId, isOpen, isMinimized, userName, scrollToBottom]);

  const loadMessages = async () => {
    setLoading(true);
    const data = await getProjectMessages(projectId, 100);
    setMessages(data);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic add
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      project_id: projectId,
      user_id: userId,
      content,
      created_at: new Date().toISOString(),
      user_email: userName || "Ty",
      user_name: userName || "Ty",
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(scrollToBottom, 50);

    const result = await sendProjectMessage(projectId, content);
    setSending(false);

    if (!result.success) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }

    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }) +
      " " + d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  };

  // Hidden when closed
  if (!isOpen) return null;

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] w-56 sm:w-64 rounded-xl bg-blue-600 shadow-xl cursor-pointer" onClick={() => setIsMinimized(false)}>
        <div className="flex items-center justify-between px-3 py-2 text-white">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            Live Chat
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] h-4 px-1.5 animate-pulse">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }} className="p-1 hover:bg-white/20 rounded">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-white/20 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full chat window
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] w-[calc(100vw-2rem)] sm:w-96 h-[min(480px,70vh)] flex flex-col rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-semibold">Live Chat</span>
          <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">
            {messages.length} wiad.
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/20 rounded transition-colors">
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Ładowanie...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm text-center px-4">
            Brak wiadomości. Napisz coś, aby rozpocząć rozmowę z zespołem!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === userId;
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 px-1">
                    {msg.user_name || msg.user_email}
                  </span>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-1.5 text-sm break-words ${
                    isOwn
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className={`text-[9px] mt-0.5 px-1 ${isOwn ? "text-slate-400" : "text-slate-400"}`}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
        <Input
          id="live-chat-message"
          name="live-chat-message"
          ref={inputRef}
          aria-label="Wpisz wiadomość do czatu"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Napisz wiadomość..."
          className="flex-1 h-8 text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          maxLength={2000}
          autoFocus
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          size="sm"
          className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
        >
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}
