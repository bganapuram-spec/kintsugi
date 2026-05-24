"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";

const GUIDE_SLIDES = [
  {
    icon: "金",
    title: "What is Kintsugi?",
    body: "Kintsugi is the Japanese art of repairing broken pottery with gold lacquer — treating the breakage as part of the object's history, not damage to hide. This app applies that same philosophy to emotional struggle: your pain is not erased. It is gilded into your story.",
  },
  {
    icon: "✦",
    title: "The Restorer's Atelier",
    body: "An AI companion who speaks slowly, with time. Share what's hurting — The Restorer witnesses, validates, and gently helps you find the gold vein inside it.",
  },
  {
    icon: "⌁",
    title: "My Vessel",
    body: "Your personal ceramic grows with every piece of emotional work you complete. After 12 gold seams, The Restorer reads the pattern woven through them and seals your vessel forever.",
  },
  {
    icon: "✿",
    title: "The Gilding Station",
    body: "Five short exercises rooted in CBT and DBT practice. Each prompt fades in word by word at breath pace. Speak instead of typing using Whisper journaling.",
  },
  {
    icon: "◈",
    title: "Gallery & Gold Threads",
    body: "Every saved insight lives in your Gallery as a gilded crack on your vessel. Share one anonymously to Gold Threads — a quiet constellation of whispered truths.",
  },
  {
    icon: "⎔",
    title: "Built for slowness",
    body: "No streaks. No badges. No notifications. Ambient kiln soundscape, light and dark modes, and a Quiet Hour mode — one page, your vessel, sixty minutes of stillness.",
  },
];

export default function SplashGuide({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"logo" | "guide">("logo");
  const [logoReady, setLogoReady] = useState(false);
  const [guideIndex, setGuideIndex] = useState(0);

  // After 2.4s the "Continue" button fades in on the logo screen
  useEffect(() => {
    const t = setTimeout(() => setLogoReady(true), 2400);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => {
    if (guideIndex < GUIDE_SLIDES.length - 1) {
      setGuideIndex((i) => i + 1);
    } else {
      onComplete();
    }
  };

  const slide = GUIDE_SLIDES[guideIndex];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "var(--k-bg)" }}>

      {/* Soft radial glow behind everything */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(201,169,97,0.07) 0%, transparent 70%)" }} />

      <AnimatePresence mode="wait">

        {/* ── Logo screen ── */}
        {phase === "logo" && (
          <motion.div key="logo" className="flex flex-col items-center text-center px-8 space-y-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.8 }}>

            {/* Spinning vessel ring */}
            <motion.div
              className="relative w-28 h-28 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, ease: "linear", repeat: Infinity }}>
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0" style={{ opacity: 0.25 }}>
                <circle cx="50" cy="50" r="46" fill="none" stroke="var(--k-gold)" strokeWidth="0.6"
                  strokeDasharray="4 6" />
              </svg>
            </motion.div>

            {/* Gold mark — static in the center */}
            <motion.div className="absolute w-28 h-28 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              <span className="text-5xl" style={{ color: "var(--k-gold)", filter: "drop-shadow(0 0 18px rgba(201,169,97,0.4))" }}>✦</span>
            </motion.div>

            {/* Wordmark */}
            <motion.div className="space-y-1 pt-20"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="text-4xl font-light italic tracking-wide"
                style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}>
                Kintsugi
              </h1>
              <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "var(--k-gold)" }}>
                Heal in Gold
              </p>
              <p className="text-[10px] italic pt-1" style={{ color: "var(--k-text-faint)" }}>
                The art of mending with gold. Your fractures are not damage to hide.
              </p>
            </motion.div>

            {/* Continue button — fades in after 2.4s */}
            <AnimatePresence>
              {logoReady && (
                <motion.div className="pt-4 w-full max-w-xs"
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
                  <motion.button onClick={() => setPhase("guide")}
                    className="w-full py-3.5 text-[10px] uppercase tracking-widest"
                    style={{ backgroundColor: "var(--k-gold)", color: "var(--k-bg)" }}
                    whileTap={{ scale: 0.97 }}>
                    See how it works
                  </motion.button>
                  <button onClick={onComplete}
                    className="w-full mt-3 text-[9px] uppercase tracking-widest text-center"
                    style={{ color: "var(--k-text-faint)" }}>
                    Skip and enter
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Guide slides ── */}
        {phase === "guide" && (
          <motion.div key="guide" className="w-full max-w-md px-8 space-y-8 relative"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>

            {/* Theme toggle */}
            <div className="absolute top-0 right-8">
              <ThemeToggle />
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-2">
              {GUIDE_SLIDES.map((_, i) => (
                <motion.span key={i}
                  className="rounded-full transition-all duration-700 cursor-pointer"
                  style={{
                    width: i === guideIndex ? "20px" : "6px",
                    height: "6px",
                    backgroundColor: i === guideIndex ? "var(--k-gold)" : "var(--k-border)",
                  }}
                  onClick={() => setGuideIndex(i)} />
              ))}
            </div>

            {/* Slide */}
            <AnimatePresence mode="wait">
              <motion.div key={guideIndex} className="text-center space-y-5 py-2"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <span
                  className="block"
                  style={{
                    color: "var(--k-gold)",
                    fontSize: slide.icon === "金" ? "4rem" : "3rem",
                    fontFamily: slide.icon === "金" ? "var(--font-cormorant,'Cormorant Garamond',serif)" : "inherit",
                    filter: slide.icon === "金" ? "drop-shadow(0 0 12px rgba(201,169,97,0.4))" : "none",
                    lineHeight: 1,
                  }}>
                  {slide.icon}
                </span>
                <h2 className="text-2xl font-light italic leading-snug"
                  style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}>
                  {slide.title}
                </h2>
                <p className="text-sm font-light leading-relaxed" style={{ color: "var(--k-text-muted)" }}>
                  {slide.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="space-y-3">
              <motion.button onClick={handleNext}
                className="w-full py-4 text-[10px] uppercase tracking-widest"
                style={{ backgroundColor: "var(--k-gold)", color: "var(--k-bg)" }}
                whileTap={{ scale: 0.98 }}>
                {guideIndex < GUIDE_SLIDES.length - 1 ? "Next" : "Enter the atelier"}
              </motion.button>
              <button onClick={onComplete}
                className="w-full text-[9px] uppercase tracking-widest text-center py-1"
                style={{ color: "var(--k-text-faint)" }}>
                Skip guide
              </button>
            </div>

            {/* Slide counter */}
            <p className="text-[8px] uppercase tracking-widest text-center" style={{ color: "var(--k-text-faint)" }}>
              {guideIndex + 1} of {GUIDE_SLIDES.length}
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
