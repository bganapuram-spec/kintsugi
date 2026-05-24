"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { request } from "@/lib/api/request";

const QUESTIONS = [
  { id: "reason", prompt: "What brought you here today?", placeholder: "There is no wrong answer...", inputType: "textarea" },
  { id: "feelingWord", prompt: "One word for how you feel right now.", placeholder: "A single word is enough...", inputType: "word" },
  { id: "wholeVision", prompt: "What would \"whole\" look like for you?", placeholder: "Paint it in a sentence or two...", inputType: "textarea" },
] as const;

export default function OnboardingRitual({ onComplete }: {
  onComplete: (answers: { reason: string; feelingWord: string; wholeVision: string }) => void
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ reason: "", feelingWord: "", wholeVision: "" });
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const handleNext = async () => {
    if (!input.trim()) return;
    const updated = { ...answers, [q.id]: input.trim() };
    setAnswers(updated);
    if (isLast) {
      setSaving(true);
      try {
        await request("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
      } catch { /* non-blocking */ }
      onComplete(updated);
    } else {
      setInput("");
      setStep((s) => s + 1);
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: "#221E1D" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.span key={i} className="absolute w-0.5 h-0.5 rounded-full"
            style={{ backgroundColor: "#C9A961", left: `${8 + i * 9}%`, top: `${15 + (i % 5) * 16}%`, opacity: 0.2 }}
            animate={{ y: [0, -10, 0], opacity: [0.12, 0.35, 0.12] }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }} />
        ))}
      </div>
      <div className="flex gap-2 mb-10 relative z-10">
        {QUESTIONS.map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-700"
            style={{ backgroundColor: i === step ? "#C9A961" : "rgba(201,169,97,0.22)" }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} className="w-full max-w-sm space-y-6 relative z-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <p className="text-[9px] uppercase tracking-widest text-center" style={{ color: "#8A8580" }}>{step + 1} of {QUESTIONS.length}</p>
          <h2 className="text-2xl font-light italic text-center leading-relaxed"
            style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
            {q.prompt}
          </h2>
          {q.inputType === "word" ? (
            <input autoFocus value={input}
              onChange={(e) => setInput(e.target.value.split(" ")[0])}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="w-full bg-transparent border-b text-center text-2xl italic font-light py-3 focus:outline-none"
              style={{ borderColor: "rgba(201,169,97,0.3)", color: "#F5F0E8", fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)" }}
              placeholder={q.placeholder} maxLength={30} />
          ) : (
            <textarea autoFocus value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleNext()}
              className="w-full bg-transparent border-b text-base italic font-light py-3 focus:outline-none resize-none"
              style={{ borderColor: "rgba(201,169,97,0.3)", color: "#F5F0E8", fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)" }}
              placeholder={q.placeholder} rows={3} />
          )}
          <motion.button onClick={handleNext} disabled={!input.trim() || saving}
            className="w-full py-3.5 text-[10px] uppercase tracking-widest transition-all duration-500"
            style={{ backgroundColor: input.trim() ? "#C9A961" : "rgba(201,169,97,0.15)", color: input.trim() ? "#221E1D" : "#8A8580" }}
            whileTap={{ scale: 0.98 }}>
            {saving ? "Entering..." : isLast ? "Enter the atelier" : "Continue"}
          </motion.button>
          <p className="text-[9px] italic text-center" style={{ color: "#8A8580" }}>
            These words belong to you. They stay within the atelier.
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
