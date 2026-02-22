"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Send,
  Loader2,
  Bot,
  Sparkles,
  Search,
  Brain,
  Heart,
  Wand2,
  Library,
  Save,
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  X,
  History,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

// --- Types ---

interface Message {
  role: "user" | "assistant";
  content: string;
  mediaItem?: Record<string, unknown>;
}

interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

// --- Helpers ---

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New Chat";
  const text = firstUser.content.slice(0, 50);
  return text.length < firstUser.content.length ? text + "..." : text;
}

// --- Quick actions ---

const quickActions = [
  { icon: Sparkles, label: "Recommendations", prompt: "Recommend me something similar to " },
  { icon: Search, label: "Look Up", prompt: "Look up info about " },
  { icon: Brain, label: "Insights", prompt: "Analyze my collection and give me insights about my taste" },
  { icon: Library, label: "Search", prompt: "Find me " },
  { icon: Heart, label: "Mood", prompt: "I'm feeling " },
  { icon: Wand2, label: "Chat", prompt: "Tell me about " },
];

// --- Markdown renderer ---

function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mt-3 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1">{children}</h3>,
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => (
          <strong className={isUser ? "font-bold" : "font-semibold text-foreground"}>{children}</strong>
        ),
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        table: ({ children }) => (
          <div className="my-2 overflow-x-auto rounded-md border">
            <table className="w-full text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className={isUser ? "border-b border-white/20" : "border-b bg-muted/50"}>{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className={isUser ? "border-b border-white/10 last:border-0" : "border-b last:border-0"}>{children}</tr>
        ),
        th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="px-3 py-1.5">{children}</td>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="my-2 rounded-md bg-black/10 dark:bg-white/10 p-3 overflow-x-auto">
                <code className="text-xs">{children}</code>
              </pre>
            );
          }
          return (
            <code className={`rounded px-1 py-0.5 text-xs ${isUser ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
              {children}
            </code>
          );
        },
        hr: () => <hr className={`my-3 ${isUser ? "border-white/20" : "border-border"}`} />,
        blockquote: ({ children }) => (
          <blockquote className={`border-l-2 pl-3 my-2 italic ${isUser ? "border-white/40 text-white/80" : "border-primary/40 text-muted-foreground"}`}>
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// --- Main component ---

export function AIChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, _setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const setActiveId = (id: string | null) => {
    activeIdRef.current = id;
    _setActiveId(id);
  };
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadSessions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSessionsLoading(false);
        return;
      }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setSessions(data);
      }
      setSessionsLoading(false);
    }
    loadSessions();
  }, []);

  const activeSession = sessions.find((s) => s.id === activeId) || null;
  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const startNewChat = () => {
    setActiveId(null);
    setInput("");
    setDrawerOpen(false);
  };

  const switchToSession = (id: string) => {
    setActiveId(id);
    setDrawerOpen(false);
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from("chat_sessions").delete().eq("id", id);
    if (error) {
      toast("Failed to delete chat", "error");
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      setActiveId(null);
    }
    toast("Chat deleted");
  };

  const updateSessionMessages = useCallback(
    async (newMessages: Message[]) => {
      if (!userId) return;
      const title = generateTitle(newMessages);
      const currentId = activeIdRef.current;

      if (currentId) {
        const { error } = await supabase
          .from("chat_sessions")
          .update({ messages: newMessages, title })
          .eq("id", currentId);

        if (!error) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentId
                ? { ...s, messages: newMessages, title, updated_at: new Date().toISOString() }
                : s
            )
          );
        }
      } else {
        const { data, error } = await supabase
          .from("chat_sessions")
          .insert({ user_id: userId, title, messages: newMessages })
          .select()
          .single();

        if (!error && data) {
          setSessions((prev) => [data, ...prev]);
          setActiveId(data.id);
        }
      }
    },
    [userId, supabase]
  );

  const sendMessage = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput("");
    const userMessage: Message = { role: "user", content: message };
    const updatedMessages = [...messages, userMessage];
    await updateSessionMessages(updatedMessages);
    setLoading(true);

    try {
      let collectionData = null;
      if (message.toLowerCase().includes("insight") || message.toLowerCase().includes("collection") || message.toLowerCase().includes("pattern")) {
        const { data } = await supabase
          .from("media_items")
          .select("type, title, genre, status, rating, creator")
          .eq("user_id", userId!)
          .limit(50);
        if (data) collectionData = data;
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          collectionData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg =
          response.status === 429
            ? "I'm being rate-limited right now. Please wait about 30 seconds and try again."
            : data.error || "Sorry, I encountered an error. Please try again.";
        const withError = [...updatedMessages, { role: "assistant" as const, content: errMsg }];
        await updateSessionMessages(withError);
        toast(response.status === 429 ? "Rate limited — wait a moment" : "AI request failed", "error");
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.text,
        mediaItem: data.mediaItem || undefined,
      };
      const withReply = [...updatedMessages, assistantMessage];
      await updateSessionMessages(withReply);
    } catch {
      toast("Failed to get AI response. Please try again.", "error");
      const withError = [
        ...updatedMessages,
        { role: "assistant" as const, content: "Sorry, I encountered a network error. Please try again." },
      ];
      await updateSessionMessages(withError);
    } finally {
      setLoading(false);
    }
  };

  const saveMediaItem = async (mediaItem: Record<string, unknown>) => {
    if (!userId) {
      toast("You must be logged in to save items", "error");
      return;
    }

    const { data, error } = await supabase
      .from("media_items")
      .insert({
        user_id: userId,
        title: mediaItem.title,
        type: mediaItem.type || "movie",
        creator: mediaItem.creator || null,
        genre: mediaItem.genre || null,
        release_date: mediaItem.release_date ? String(mediaItem.release_date) : null,
        platform: mediaItem.platform || null,
        ai_summary: mediaItem.summary || null,
        status: "wishlist",
      })
      .select()
      .single();

    if (error) {
      toast(`Error saving item: ${error.message}`, "error");
    } else {
      toast("Added to your collection!");
      router.push(`/media/${data.id}`);
    }
  };

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-13rem)] bg-background">
      {/* ===== TOP BAR — minimal, full-width ===== */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-slate-50 dark:bg-slate-900/50">
        <Bot className="h-5 w-5 text-indigo-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">
            {activeSession ? activeSession.title : "New Conversation"}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {activeSession && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={startNewChat}>
              <Plus className="h-3 w-3" /> New
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
            onClick={() => setDrawerOpen(true)}
            title="Chat history"
          >
            <History className="h-4 w-4" />
            {sessions.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center font-bold">
                {sessions.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ===== MESSAGES — full width, no sidebar ===== */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Welcome — vertical card layout, NOT grid */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Media AI</h2>
          <p className="text-muted-foreground text-center mb-8 max-w-sm text-sm">
            Your personal media expert. Ask me anything about movies, shows, music, games, or books.
          </p>
          {/* Quick actions — horizontal scrolling chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm transition-colors"
                onClick={() => {
                  setInput(action.prompt);
                  inputRef.current?.focus();
                }}
              >
                <action.icon className="h-3.5 w-3.5 text-indigo-500" />
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-0">
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Thread-style messages — full width, separated by borders */}
                {msg.role === "user" ? (
                  <div className="py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">
                        Y
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">You</p>
                        <div className="text-sm">
                          <MarkdownContent content={msg.content} isUser={false} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 -mx-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-indigo-500 mb-1">Media AI</p>
                        <div className="text-sm">
                          <MarkdownContent content={msg.content} isUser={false} />
                        </div>
                        {msg.mediaItem && (
                          <Button
                            size="sm"
                            className="mt-3 gap-1"
                            onClick={() => saveMediaItem(msg.mediaItem!)}
                          >
                            <Save className="h-3 w-3" />
                            Add to Collection
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="py-4 bg-slate-50/50 dark:bg-slate-900/30 -mx-4 px-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* ===== INPUT — bottom bar with integrated send ===== */}
      <div className="border-t bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500/50 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about movies, music, games, books, or TV shows..."
              className="flex-1 bg-transparent resize-none text-sm outline-none placeholder:text-muted-foreground min-h-[24px] max-h-32 py-0.5"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="h-8 w-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center shrink-0 transition-colors"
            >
              <Send className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== RIGHT DRAWER — session history (slides from right, NOT left) ===== */}
      {drawerOpen && (
        <>
          <div className="absolute inset-0 bg-black/30 z-40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-background border-l z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-sm">Chat History</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat} title="New chat">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDrawerOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {sessionsLoading ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin opacity-40" />
                  Loading...
                </div>
              ) : sortedSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No conversations yet.
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {sortedSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group flex items-start gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                        activeId === session.id
                          ? "bg-indigo-500/10 border border-indigo-500/20"
                          : "hover:bg-muted border border-transparent"
                      }`}
                      onClick={() => switchToSession(session.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(session.updated_at)}
                          <span className="mx-0.5">&middot;</span>
                          {session.messages.filter((m) => m.role === "user").length} msgs
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
