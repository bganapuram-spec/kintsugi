"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { request } from "@/lib/api/request";

export interface FlashcardVein {
  id: string;
  goldVeinText: string;
  lessonText?: string | null;
  meaningfulness?: number | null;
  createdAt?: string;
}

interface Props {
  vein: FlashcardVein | null;
  open: boolean;
  onClose: () => void;
  onRated?: (meaningfulness: number) => void;
  onViewGallery?: () => void;
}

export default function FlashcardReveal({ vein, open, onClose, onRated, onViewGallery }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [rating, setRating] = useState<number | null>(vein?.meaningfulness ?? null);
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (m: number) => {
    if (!vein) return;
    setRating(m);
    setSubmitting(true);
    try {
      await request(`/api/veins/${vein.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rate", meaningfulness: m }),
      });
      onRated?.(m);
    } catch {
      /* swallow — rating is best-effort */
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setFlipped(false);
    setRating(vein?.meaningfulness ?? null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && vein && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          style={{ backgroundColor: "rgba(20,17,16,0.86)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          {/* candle-flicker ambient gold */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(201,169,97,0.18), transparent 60%)",
            }}
          />

          <motion.div
            className="relative w-full max-w-sm"
            initial={{ y: 32, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-[9px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--k-gold)" }}>
              ✦ A new gold vein
            </p>

            {/* Flip card */}
            <div
              className="relative w-full"
              style={{ perspective: "1400px", aspectRatio: "3 / 4" }}
            >
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* FRONT — gold vein */}
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    background:
                      "linear-gradient(155deg, var(--k-bg-raised) 0%, var(--k-bg-surface) 100%)",
                    border: "1px solid var(--k-border-strong)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(201,169,97,0.06)",
                  }}
                >
                  <div className="flex-1 flex flex-col items-center justify-center p-7 text-center">
                    <span className="text-2xl mb-5" style={{ color: "var(--k-gold)" }}>✦</span>
                    <p
                      className="text-xl font-light italic leading-relaxed"
                      style={{
                        fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)",
                        color: "var(--k-text)",
                      }}
                    >
                      &ldquo;{vein.goldVeinText}&rdquo;
                    </p>
                  </div>
                  <div className="p-4" style={{ borderTop: "1px solid var(--k-border)" }}>
                    <motion.button
                      onClick={() => setFlipped(true)}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-3 text-[10px] uppercase tracking-[0.28em]"
                      style={{
                        color: "var(--k-gold)",
                        backgroundColor: "var(--k-gold-glow)",
                        border: "1px solid var(--k-border-strong)",
                      }}
                    >
                      Turn over · see the lesson
                    </motion.button>
                  </div>
                </div>

                {/* BACK — lesson + rating */}
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background:
                      "linear-gradient(155deg, var(--k-bg-surface) 0%, var(--k-bg-raised) 100%)",
                    border: "1px solid var(--k-border-strong)",
                    boxShadow: "0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(201,169,97,0.06)",
                  }}
                >
                  <div className="flex-1 flex flex-col items-center justify-center p-7 text-center">
                    <span
                      className="text-[9px] uppercase tracking-[0.3em] mb-4"
                      style={{ color: "var(--k-gold)" }}
                    >
                      The lesson
                    </span>
                    <p
                      className="text-lg font-light italic leading-relaxed"
                      style={{
                        fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)",
                        color: "var(--k-text)",
                      }}
                    >
                      {vein.lessonText ?? "Sit with it. A lesson does not always arrive on the first day."}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="p-4 space-y-3" style={{ borderTop: "1px solid var(--k-border)" }}>
                    <p className="text-center text-[9px] uppercase tracking-[0.25em]" style={{ color: "var(--k-text-muted)" }}>
                      How meaningful was this?
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const filled = (rating ?? 0) >= n;
                        return (
                          <motion.button
                            key={n}
                            disabled={submitting}
                            onClick={() => handleRate(n)}
                            whileTap={{ scale: 0.85 }}
                            whileHover={{ y: -1 }}
                            aria-label={`Rate ${n} of 5`}
                            className="w-9 h-9 flex items-center justify-center"
                            style={{
                              color: filled ? "var(--k-gold)" : "var(--k-text-faint)",
                              fontSize: "20px",
                              transition: "color 220ms ease",
                            }}
                          >
                            {filled ? "✦" : "✧"}
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setFlipped(false)}
                        className="flex-1 py-2 text-[9px] uppercase tracking-[0.25em]"
                        style={{ color: "var(--k-text-muted)", border: "1px solid var(--k-border)" }}
                      >
                        Turn back
                      </button>
                      <button
                        onClick={onViewGallery ?? close}
                        className="flex-1 py-2 text-[9px] uppercase tracking-[0.25em]"
                        style={{ color: "var(--k-gold)", border: "1px solid var(--k-border-strong)" }}
                      >
                        {onViewGallery ? "See vessel" : "Close"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Subtle close hint */}
            <button
              onClick={close}
              className="mt-4 w-full text-center text-[9px] uppercase tracking-[0.3em]"
              style={{ color: "var(--k-text-faint)" }}
            >
              Dismiss
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
