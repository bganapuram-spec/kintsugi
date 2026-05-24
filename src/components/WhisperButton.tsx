"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";

interface Props {
  onTranscript: (text: string) => void;
}

export default function WhisperButton({ onTranscript }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recogRef = useRef<any>(null);

  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = () => {
    if (!supported) return;
    const SR = ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);
    const recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        interim += e.results[i][0].transcript;
      }
      setTranscript(interim);
    };

    recog.onend = () => {
      setListening(false);
      if (transcript.trim()) onTranscript(transcript.trim());
      setTranscript("");
      // Audio is never stored — only the text result
    };

    recog.start();
    recogRef.current = recog;
    setListening(true);
  };

  const stop = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  if (!supported) return null;

  return (
    <div className="space-y-2">
      <p className="text-[9px] italic text-center" style={{ color: "#8A8580" }}>
        Your voice matters. The recording does not.
      </p>
      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={listening ? stop : start}
          className="relative w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: listening ? "rgba(201,169,97,0.15)" : "transparent",
            border: `1px solid ${listening ? "#C9A961" : "rgba(201,169,97,0.3)"}`,
          }}
          whileTap={{ scale: 0.93 }}
        >
          {listening && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid #C9A961" }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
            style={{ color: listening ? "#C9A961" : "#8A8580" }}>
            <path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <span className="text-[9px] uppercase tracking-widest" style={{ color: listening ? "#C9A961" : "#8A8580" }}>
          {listening ? "Listening — tap to finish" : "Speak instead of typing"}
        </span>
        <AnimatePresence>
          {transcript && (
            <motion.p className="text-xs italic text-center max-w-xs leading-relaxed"
              style={{ color: "#F5F0E8", fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              &ldquo;{transcript}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
