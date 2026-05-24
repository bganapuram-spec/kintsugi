"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth as eazoAuth } from "@eazo/sdk";
import { request } from "@/lib/api/request";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SoundscapeToggle from "@/components/SoundscapeToggle";
import FlashcardReveal, { type FlashcardVein } from "@/components/FlashcardReveal";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  crisis?: boolean;
  gildReady?: boolean;
}

interface SessionSummary {
  id: string;
  title: string;
  updatedAt: string;
  messages: Array<{ role: string; content: string }>;
}

export default function RestorerAtelierScreen() {
  const router = useRouter();
  const auth = useEazo((s) => s.auth);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [savingVein, setSavingVein] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sidebar state
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Flashcard reveal state
  const [flashcard, setFlashcard] = useState<FlashcardVein | null>(null);

  // History row pending-delete (2-tap confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Always start a fresh session on mount
  useEffect(() => {
    if (!auth.authenticated || sessionLoaded) return;
    setSessionLoaded(true);
    request("/api/chat/session")
      .then((r) => r.json())
      .then((data) => {
        setActiveSessionId(data.sessionId ?? null);
        // Fresh session — always show welcome, no prior messages
        setMessages([defaultWelcome()]);
      })
      .catch(() => setMessages([defaultWelcome()]));
  }, [auth.authenticated, sessionLoaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function defaultWelcome(): Message {
    return {
      role: "assistant",
      content:
        "It's good to see you. Come in — sit down, rest your hands. There is nothing here to fix and nothing you have to perform. Tell me what's heavy today, and we will sit with it together for as long as it takes. What's on your heart?",
      timestamp: new Date(),
    };
  }

  // Load session list when sidebar opens
  const openSidebar = async () => {
    setSidebarOpen(true);
    setLoadingSessions(true);
    try {
      const res = await request("/api/chat/sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch { }
    finally { setLoadingSessions(false); }
  };

  // Switch to a different session (load it via POST)
  const switchSession = async (sessionId: string) => {
    if (sessionId === activeSessionId) { setSidebarOpen(false); return; }
    try {
      const res = await request("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      const prior = (data.messages || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(),
      }));
      setMessages(prior.length > 0 ? prior : [defaultWelcome()]);
      setActiveSessionId(sessionId);
    } catch { }
    setSidebarOpen(false);
  };

  // Start a new session — no-op if we're already in an empty conversation
  const newSession = async () => {
    const hasUserContent = messages.some((m) => m.role === "user");
    if (!hasUserContent && activeSessionId) {
      // already an empty session, nothing to spawn
      setSidebarOpen(false);
      return;
    }
    try {
      const res = await request("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new" }),
      });
      const data = await res.json();
      setActiveSessionId(data.session?.id ?? null);
      setMessages([defaultWelcome()]);
    } catch { }
    setSidebarOpen(false);
  };

  // Delete a session from history
  const deleteSession = async (sessionId: string) => {
    // Optimistic UI: drop it from the list immediately
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    try {
      await request(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
      if (sessionId === activeSessionId) {
        // Active session was deleted — start fresh
        const res = await request("/api/chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "new" }),
        });
        const data = await res.json();
        setActiveSessionId(data.session?.id ?? null);
        setMessages([defaultWelcome()]);
      }
    } catch {
      // Reload list to recover from failed delete
      try {
        const res = await request("/api/chat/sessions");
        const data = await res.json();
        setSessions(data.sessions ?? []);
      } catch { }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: input, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    const sentInput = input;
    setInput("");
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date() }]);

    try {
      const sessionHeader = await eazoAuth.getSessionHeader();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionHeader ? { "x-eazo-session": sessionHeader } : {}),
        },
        body: JSON.stringify({ message: sentInput, sessionId: activeSessionId }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `Server error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let detectedCrisis = false;
      let detectedGild = false;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const raw = trimmed.slice(5).trim();
          if (!raw || raw === "[DONE]") continue;
          try {
            const json = JSON.parse(raw);
            if (json.crisis) detectedCrisis = true;
            if (json.gildReady) detectedGild = true;
            if (json.delta) {
              assistantContent += json.delta;
              setMessages((prev) => prev.map((m, i) =>
                i === prev.length - 1 && m.role === "assistant"
                  ? { ...m, content: assistantContent, crisis: detectedCrisis }
                  : m
              ));
            }
            if (json.done) {
              if (json.sessionId && !activeSessionId) setActiveSessionId(json.sessionId);
              if (detectedGild) {
                setMessages((prev) => prev.map((m, i) =>
                  i === prev.length - 1 && m.role === "assistant" ? { ...m, gildReady: true } : m
                ));
              }
            }
          } catch { /* skip malformed */ }
        }
      }

      if (!assistantContent) {
        setMessages((prev) => prev.map((m, i) =>
          i === prev.length - 1 && m.role === "assistant"
            ? { ...m, content: "The lacquer is still setting. Please try again in a moment." }
            : m
        ));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant"
          ? { ...m, content: `The Restorer could not be reached — ${msg}` }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSaveVein = async (msgIndex: number) => {
    setSavingVein(true);
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || "My emotional fracture";
    const conversationContext = messages.slice(0, msgIndex + 1).map((m) => `${m.role}: ${m.content}`).join("\n");
    try {
      const res = await request("/api/veins/from-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrativeText: lastUserMsg, conversationContext }),
      });
      const data = await res.json().catch(() => ({}));
      const vein = (data as { vein?: FlashcardVein }).vein;

      await request("/api/my-vessel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_seam",
          source: "chat",
          goldVeinText: vein?.goldVeinText ?? lastUserMsg,
        }),
      }).catch(() => {});

      // Remove the gildReady CTA from the bubble so it cannot be saved twice
      setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, gildReady: false } : m)));

      if (vein) {
        setFlashcard(vein);
      } else {
        router.push("/my-vessel");
      }
    } catch { }
    finally { setSavingVein(false); }
  };

  if (!auth.loading && !auth.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-8 text-center" style={{ backgroundColor: "var(--k-bg)" }}>
        <span className="text-3xl mb-6" style={{ color: "var(--k-gold)" }}>✦</span>
        <h2 className="text-2xl font-light italic mb-3" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}>
          The Restorer awaits.
        </h2>
        <p className="text-sm font-light leading-relaxed mb-8 italic" style={{ color: "var(--k-text-muted)" }}>
          Sign in to begin mapping your fractures and gilding what you find.
        </p>
        <motion.button onClick={() => eazoAuth.login()}
          className="px-10 py-4 text-xs uppercase tracking-widest"
          style={{ border: "1px solid var(--k-gold)", color: "var(--k-gold)", backgroundColor: "transparent" }}
          whileTap={{ scale: 0.97 }}>
          Enter the Atelier
        </motion.button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-svh overflow-hidden" style={{ backgroundColor: "var(--k-bg)" }}>
      {/* ── Ambient atmosphere ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 ambient-breath"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,169,97,0.10), transparent 70%), radial-gradient(ellipse 70% 50% at 50% 110%, rgba(212,132,122,0.06), transparent 65%)",
          zIndex: 0,
        }}
      />

      {/* ── Top bar ── */}
      <header className="h-[52px] px-4 flex items-center justify-between shrink-0 z-10"
        style={{ borderBottom: "1px solid var(--k-border)", backgroundColor: "var(--k-bg-surface)" }}>
        {/* History button */}
        <motion.button onClick={openSidebar}
          className="flex items-center gap-2 text-[10px] uppercase tracking-widest px-2 py-1.5"
          style={{ color: "var(--k-text-muted)", border: "1px solid var(--k-border)" }}
          whileTap={{ scale: 0.94 }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          History
        </motion.button>

        <h2 className="text-[10px] uppercase tracking-wider" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-gold)" }}>
          The Restorer&apos;s Atelier
        </h2>

        <div className="flex items-center gap-2">
          <SoundscapeToggle />
          <ThemeToggle />
          {/* New chat */}
          <motion.button onClick={newSession}
            className="w-7 h-7 flex items-center justify-center"
            style={{ border: "1px solid var(--k-border)", color: "var(--k-gold)" }}
            whileTap={{ scale: 0.9 }}
            title="New conversation">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
      </header>

      {/* ── Messages ── */}
      <div ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6"
        style={{ paddingBottom: "180px" }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg}
            onSave={msg.gildReady ? () => handleSaveVein(i) : undefined}
            savingVein={savingVein} />
        ))}
        {isStreaming && (
          <motion.div
            className="flex items-center space-x-3 pl-2 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full exhale-dot" style={{ backgroundColor: "var(--k-gold)" }} />
              <span className="w-1.5 h-1.5 rounded-full exhale-dot" style={{ backgroundColor: "var(--k-gold)" }} />
              <span className="w-1.5 h-1.5 rounded-full exhale-dot" style={{ backgroundColor: "var(--k-gold)" }} />
            </span>
            <span className="text-xs italic" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text-muted)" }}>
              The Restorer is tracing your line in lacquer...
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 md:ml-60 px-4 pt-4 pb-3 z-10"
        style={{
          backgroundColor: "var(--k-bg-surface)",
          borderTop: "1px solid var(--k-border)",
          boxShadow: "0 -12px 24px -16px rgba(0,0,0,0.5)",
        }}>
        <div
          className="relative flex items-center max-w-sm mx-auto chat-input-shell"
          style={{
            backgroundColor: "var(--k-bg)",
            border: "1px solid var(--k-border)",
            transition: "border-color 320ms ease, box-shadow 320ms ease",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-full text-base font-light py-3.5 pl-4 pr-14 focus:outline-none bg-transparent"
            style={{ color: "var(--k-text)" }}
            placeholder="Describe your current emotional fissure..."
          />
          <motion.button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="absolute right-2 w-9 h-9 flex items-center justify-center"
            style={{
              color: input.trim() && !isStreaming ? "var(--k-gold)" : "var(--k-text-faint)",
              backgroundColor: input.trim() && !isStreaming ? "var(--k-gold-glow)" : "transparent",
              border: "1px solid",
              borderColor: input.trim() && !isStreaming ? "var(--k-border-strong)" : "var(--k-border)",
              transition: "all 240ms ease",
            }}
            whileTap={{ scale: 0.92 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>
        <p className="text-center mt-2 text-[8px] uppercase tracking-[0.3em] italic" style={{ color: "var(--k-text-faint)" }}>
          Take your absolute time. Silence is welcome.
        </p>
      </div>

      {/* ── History Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)} />

            {/* Drawer */}
            <motion.div
              className="fixed left-0 top-0 bottom-0 z-50 flex flex-col w-72 shadow-2xl"
              style={{ backgroundColor: "var(--k-bg-surface)", borderRight: "1px solid var(--k-border)" }}
              initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>

              {/* Drawer header */}
              <div className="h-[52px] px-4 flex items-center justify-between shrink-0"
                style={{ borderBottom: "1px solid var(--k-border)" }}>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--k-gold)" }}>
                  Conversations
                </span>
                <motion.button onClick={() => setSidebarOpen(false)} className="p-1"
                  style={{ color: "var(--k-text-muted)" }} whileTap={{ scale: 0.9 }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </div>

              {/* New chat button */}
              <div className="p-3 shrink-0" style={{ borderBottom: "1px solid var(--k-border)" }}>
                <motion.button onClick={newSession}
                  className="w-full py-2.5 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  style={{ border: "1px solid var(--k-gold)", color: "var(--k-gold)", backgroundColor: "transparent" }}
                  whileTap={{ scale: 0.98 }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4.5v15m7.5-7.5h-15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  New conversation
                </motion.button>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                {loadingSessions ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-14 skeleton rounded" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-xs italic text-center p-6" style={{ color: "var(--k-text-faint)" }}>
                    No prior conversations yet.
                  </p>
                ) : (
                  sessions.map((s) => {
                    const isActive = s.id === activeSessionId;
                    const preview = s.messages?.find((m) => m.role === "user")?.content ?? "New conversation";
                    const date = new Date(s.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const pendingDelete = confirmDeleteId === s.id;
                    return (
                      <div
                        key={s.id}
                        className="relative group"
                        style={{
                          backgroundColor: isActive ? "var(--k-gold-glow)" : "transparent",
                          borderLeft: isActive ? `2px solid var(--k-gold)` : "2px solid transparent",
                        }}
                      >
                        <motion.button
                          onClick={() => switchSession(s.id)}
                          className="w-full pl-4 pr-12 py-3 text-left flex flex-col gap-1"
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex justify-between items-center gap-2">
                            <span
                              className="text-[10px] uppercase tracking-widest truncate"
                              style={{ color: isActive ? "var(--k-gold)" : "var(--k-text-muted)" }}
                            >
                              {s.title}
                            </span>
                            <span className="text-[8px] shrink-0" style={{ color: "var(--k-text-faint)" }}>{date}</span>
                          </div>
                          <p
                            className="text-xs font-light italic truncate"
                            style={{ color: "var(--k-text-muted)", fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)" }}
                          >
                            {preview.slice(0, 60)}{preview.length > 60 ? "..." : ""}
                          </p>
                        </motion.button>

                        {/* Delete affordance */}
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (pendingDelete) {
                              setConfirmDeleteId(null);
                              deleteSession(s.id);
                            } else {
                              setConfirmDeleteId(s.id);
                            }
                          }}
                          aria-label={pendingDelete ? "Confirm delete conversation" : "Delete conversation"}
                          className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center justify-center px-2 h-7 transition-opacity"
                          style={{
                            color: pendingDelete ? "var(--k-rose)" : "var(--k-text-faint)",
                            opacity: pendingDelete ? 1 : 0.55,
                            border: pendingDelete ? "1px solid var(--k-rose)" : "1px solid transparent",
                            backgroundColor: pendingDelete ? "rgba(212,132,122,0.08)" : "transparent",
                          }}
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ opacity: 1 }}
                        >
                          {pendingDelete ? (
                            <span className="text-[8px] uppercase tracking-[0.25em]">Confirm</span>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          )}
                        </motion.button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Flashcard reveal after saving a gold vein ── */}
      <FlashcardReveal
        vein={flashcard}
        open={!!flashcard}
        onClose={() => setFlashcard(null)}
        onViewGallery={() => {
          setFlashcard(null);
          router.push("/my-vessel");
        }}
      />
    </div>
  );
}

function MessageBubble({ message, onSave, savingVein }: {
  message: Message; onSave?: () => void; savingVein?: boolean;
}) {
  const time = message.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (message.role === "assistant") {
    return (
      <motion.div className="flex flex-col items-start max-w-sm"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-center space-x-1.5 mb-1">
          <span className="w-1.5 h-1.5 rounded-full gold-pulse" style={{ backgroundColor: "var(--k-gold)" }} />
          <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--k-text-muted)" }}>The Restorer</span>
        </div>
        <div className="p-4 text-base font-light italic leading-relaxed w-full"
          style={{ backgroundColor: "var(--k-bg-surface)", border: "1px solid var(--k-border)", fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}>
          {message.content
            ? <p>{message.content}</p>
            : <span className="inline-block w-4 h-4 rounded-full gold-pulse" style={{ backgroundColor: "var(--k-gold)", opacity: 0.6 }} />}
        </div>

        {onSave && message.content && (
          <motion.button
            onClick={onSave}
            disabled={savingVein}
            className="mt-3 w-full max-w-sm py-3 text-[10px] uppercase tracking-[0.28em] font-medium"
            style={{
              backgroundColor: "var(--k-gold-glow)",
              color: "var(--k-gold)",
              border: "1px solid var(--k-border-strong)",
              boxShadow: "0 0 0 0 var(--k-gold-glow)",
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, boxShadow: ["0 0 0 0 var(--k-gold-glow)", "0 0 14px 0 var(--k-gold-glow)", "0 0 0 0 var(--k-gold-glow)"] }}
            transition={{ opacity: { duration: 0.45 }, y: { duration: 0.45 }, boxShadow: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="mr-1.5">✦</span>{savingVein ? "Gilding..." : "Save this as a gold vein"}
          </motion.button>
        )}

        {message.crisis && (
          <div className="mt-2 p-3 text-xs leading-relaxed w-full max-w-sm"
            style={{ backgroundColor: "var(--k-gold-glow)", border: "1px solid var(--k-border-strong)", color: "var(--k-gold)" }}>
            If you are in crisis, call or text <strong>988</strong> (US) or text HOME to <strong>741741</strong>. You are not alone.
          </div>
        )}
        <span className="mt-1 text-[8px] uppercase tracking-wider" style={{ color: "var(--k-text-faint)" }}>{time}</span>
      </motion.div>
    );
  }

  return (
    <motion.div className="flex flex-col items-end max-w-sm ml-auto"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <span className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "var(--k-text-muted)" }}>Self-Trace</span>
      <div className="p-4 text-sm font-light leading-relaxed"
        style={{ backgroundColor: "var(--k-bg)", borderLeft: "2px solid var(--k-text-faint)", color: "var(--k-text)" }}>
        <p>{message.content}</p>
      </div>
      <span className="mt-1 text-[8px] uppercase tracking-wider text-right" style={{ color: "var(--k-text-faint)" }}>{time}</span>
    </motion.div>
  );
}
