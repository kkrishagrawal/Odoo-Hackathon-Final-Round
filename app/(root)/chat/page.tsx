"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  _count: { messages: number };
};

export default function HRChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // Load a specific conversation
  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/chat?conversationId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.conversation.messages.map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
        setConversationId(id);
      }
    } catch { /* silent */ }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    inputRef.current?.focus();
  };

  const deleteConversation = async (id: string) => {
    try {
      await fetch("/api/chat", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
      if (conversationId === id) startNewConversation();
      loadConversations();
    } catch { /* silent */ }
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
          conversationId,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages([...updated, { role: "assistant", content: data.reply }]);
      }
      if (data.conversationId) {
        setConversationId(data.conversationId);
        loadConversations();
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation Sidebar */}
      <div
        className={`border-r border-outline-variant/20 flex flex-col bg-surface-container-lowest shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          showSidebar ? "w-72" : "w-0 border-r-0"
        }`}
      >
        <div className="w-72 flex flex-col h-full">
          <div className="p-4 border-b border-outline-variant/20">
            <button
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-container text-white text-sm font-medium hover:bg-[#5A3C53] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Chat
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto py-2">
            {conversations.length === 0 && (
              <p className="text-xs text-on-surface-variant text-center py-8 px-4">
                No conversations yet. Start a new chat!
              </p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                  conversationId === conv.id
                    ? "bg-primary-container/10 border border-primary-container/20"
                    : "hover:bg-surface-container-low"
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant shrink-0">chat_bubble_outline</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{conv.title}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {conv._count.messages} messages
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 transition-all"
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[14px] text-error">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              {showSidebar ? "left_panel_close" : "left_panel_open"}
            </span>
          </button>
          <div>
            <h1 className="text-base font-bold text-on-surface font-h3">EmMCP Assistant</h1>
            <p className="text-[11px] text-on-surface-variant">HR queries, attendance, payslips, leaves</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="material-symbols-outlined text-[48px] text-outline-variant/40 mb-4">smart_toy</span>
              <h2 className="text-lg font-bold text-on-surface mb-2">EmMCP Assistant</h2>
              <p className="text-sm text-on-surface-variant">
                Ask me about attendance records, payslips, leave balances, team statistics, or any HR-related queries.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                {[
                  "Show my attendance for this month",
                  "How many leaves do I have left?",
                  "What is the team attendance today?",
                  "Generate a payroll summary",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="text-left text-xs px-4 py-3 rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low hover:border-primary-container/30 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center shrink-0 mt-1 mr-3">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">smart_toy</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] text-sm ${
                    m.role === "user"
                      ? "bg-primary-container text-white rounded-2xl rounded-br-md px-4 py-2.5"
                      : "prose-container"
                  }`}
                >
                  {m.role === "user" ? (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  ) : (
                    <div className="chat-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-primary-container/10 border border-primary-container/20 flex items-center justify-center shrink-0 mt-1 mr-3">
                  <span className="material-symbols-outlined text-[14px] text-primary-container animate-pulse">smart_toy</span>
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <div className="w-2 h-2 rounded-full bg-primary-container/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary-container/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary-container/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest shrink-0">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <textarea
              ref={inputRef}
              className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container/50 resize-none transition-all"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="h-11 w-11 rounded-xl bg-primary-container text-white flex items-center justify-center hover:bg-[#5A3C53] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}