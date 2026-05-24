"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth as eazoAuth } from "@eazo/sdk";
import { request } from "@/lib/api/request";

interface Vein {
  id: string;
  source: string;
  narrativeText: string;
  goldVeinText: string;
  lessonText?: string | null;
  meaningfulness?: number | null;
  createdAt: string;
}

export default function LessonsPage() {
  const auth = useEazo((s) => s.auth);
  const [veins, setVeins] = useState<Vein[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "rated" | "unrated">("all");

  useEffect(() => {
    if (!auth.authenticated) return;
    request("/api/veins")
      .then((r) => r.json())
      .then((data) => setVeins(data.veins ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auth.authenticated]);

  const setRating = async (vein: Vein, m: number) => {
    setVeins((prev) => prev.map((v) => (v.id === vein.id ? { ...v, meaningfulness: m } : v)));
    try {
      await request(`/api/veins/${vein.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rate", meaningfulness: m }),
      });
    } catch {
      /* revert on failure? best-effort */
    }
  };

  const filtered = veins.filter((v) => {
    if (filter === "rated") return (v.meaningfulness ?? 0) > 0;
    if (filter === "unrated") return !v.meaningfulness;
    return true;
  });

  if (!auth.loading && !auth.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh px-8 text-center" style={{ backgroundColor: "var(--k-bg)" }}>
        <span className="text-3xl mb-6" style={{ color: "var(--k-gold)" }}>✦</span>
        <p className="text-sm font-light italic mb-6" style={{ color: "var(--k-text-muted)" }}>
          Sign in to revisit your lessons.
        </p>
        <button
          onClick={() => eazoAuth.login()}
          className="px-10 py-3 text-xs uppercase tracking-widest"
          style={{ border: "1px solid var(--k-gold)", color: "var(--k-gold)" }}
        >
          Enter
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-svh pb-24" style={{ backgroundColor: "var(--k-bg)" }}>
      {/* Header */}
      <header
        className="px-5 pt-7 pb-5 sticky top-0 z-10"
        style={{
          backgroundColor: "var(--k-bg)",
          borderBottom: "1px solid var(--k-border)",
        }}
      >
        <p className="text-[9px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--k-gold)" }}>
          ✦ Lessons
        </p>
        <h1
          className="text-2xl font-light italic"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}
        >
          What the fractures taught.
        </h1>
        <p className="text-xs italic mt-2 leading-relaxed" style={{ color: "var(--k-text-muted)" }}>
          Tap a card to turn it over. Each one carries the lesson beneath the seam.
        </p>

        {/* Filters */}
        <div className="flex items-center gap-1.5 mt-4">
          {(["all", "rated", "unrated"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-[9px] uppercase tracking-[0.25em] px-3 py-1.5 transition-colors"
              style={{
                color: filter === f ? "var(--k-gold)" : "var(--k-text-muted)",
                border: filter === f ? "1px solid var(--k-border-strong)" : "1px solid var(--k-border)",
                backgroundColor: filter === f ? "var(--k-gold-glow)" : "transparent",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 px-5 pt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton h-48" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center pt-20 max-w-xs mx-auto">
            <span className="text-2xl mb-4" style={{ color: "var(--k-gold)" }}>✧</span>
            <p
              className="text-base font-light italic leading-relaxed mb-2"
              style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}
            >
              No lessons yet.
            </p>
            <p className="text-xs italic" style={{ color: "var(--k-text-muted)" }}>
              Save a gold vein from the Atelier — the lesson will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {filtered.map((vein) => (
              <LessonCard
                key={vein.id}
                vein={vein}
                flipped={flippedId === vein.id}
                onToggle={() => setFlippedId((curr) => (curr === vein.id ? null : vein.id))}
                onRate={(m) => setRating(vein, m)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LessonCard({
  vein,
  flipped,
  onToggle,
  onRate,
}: {
  vein: Vein;
  flipped: boolean;
  onToggle: () => void;
  onRate: (m: number) => void;
}) {
  const date = new Date(vein.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <motion.div
      className="relative w-full"
      style={{ perspective: "1400px", aspectRatio: "5 / 6" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        onClick={onToggle}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 flex flex-col p-5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "linear-gradient(155deg, var(--k-bg-raised) 0%, var(--k-bg-surface) 100%)",
            border: "1px solid var(--k-border)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "var(--k-gold)" }}>
              ✦ Vein
            </span>
            <span className="text-[8px]" style={{ color: "var(--k-text-faint)" }}>{date}</span>
          </div>
          <div className="flex-1 flex items-center">
            <p
              className="text-base font-light italic leading-relaxed"
              style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}
            >
              &ldquo;{vein.goldVeinText}&rdquo;
            </p>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    color: (vein.meaningfulness ?? 0) >= n ? "var(--k-gold)" : "var(--k-text-faint)",
                    fontSize: "12px",
                  }}
                >
                  {(vein.meaningfulness ?? 0) >= n ? "✦" : "✧"}
                </span>
              ))}
            </div>
            <span className="text-[9px] uppercase tracking-[0.25em]" style={{ color: "var(--k-text-muted)" }}>
              Turn ↻
            </span>
          </div>
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 flex flex-col p-5"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(155deg, var(--k-bg-surface) 0%, var(--k-bg-raised) 100%)",
            border: "1px solid var(--k-border-strong)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <span className="text-[9px] uppercase tracking-[0.25em] mb-3" style={{ color: "var(--k-gold)" }}>
            The lesson
          </span>
          <div className="flex-1 flex items-center">
            <p
              className="text-base font-light italic leading-relaxed"
              style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}
            >
              {vein.lessonText ?? "A lesson does not always arrive on the first day."}
            </p>
          </div>
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-4 pt-3"
                style={{ borderTop: "1px solid var(--k-border)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-center text-[9px] uppercase tracking-[0.25em] mb-2" style={{ color: "var(--k-text-muted)" }}>
                  How meaningful?
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => onRate(n)}
                      className="w-7 h-7 flex items-center justify-center"
                      style={{
                        color: (vein.meaningfulness ?? 0) >= n ? "var(--k-gold)" : "var(--k-text-faint)",
                        fontSize: "16px",
                      }}
                    >
                      {(vein.meaningfulness ?? 0) >= n ? "✦" : "✧"}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
