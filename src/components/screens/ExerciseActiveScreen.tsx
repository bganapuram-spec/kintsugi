"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { exerciseDefinitions } from "@/lib/exercise-data";
import { request } from "@/lib/api/request";
import WhisperButton from "@/components/WhisperButton";

function speak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.82; utter.pitch = 0.9; utter.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v) => ["Samantha","Karen","Moira","Fiona","Victoria","Tessa","Allison"].some((n) => v.name.includes(n))) || voices.find((v) => v.lang.startsWith("en") && !v.name.toLowerCase().includes("male"));
  if (preferred) utter.voice = preferred;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}
function stopSpeaking() { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); }
function BreathPrompt({ text }: { text: string }) {
  const words = text.split(" ");
  return (<span>{words.map((word, i) => (<motion.span key={i} className="inline-block mr-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.6, duration: 0.5, ease: "easeOut" }}>{word}</motion.span>))}</span>);
}

export default function ExerciseActiveScreen({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const exercise = exerciseDefinitions.find((e) => e.id === exerciseId);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [breathPhase, setBreathPhase] = useState<"in"|"hold-in"|"out"|"hold-out">("in");
  const [breathCycles, setBreathCycles] = useState(0);
  const [promptKey, setPromptKey] = useState(0);
  const step = exercise?.steps[currentStep];
  const isBreathing = step?.inputType === "breathing";

  useEffect(() => {
    setPromptKey((k) => k + 1);
    if (!exercise || !voiceEnabled || !step) return;
    setIsNarrating(true);
    const intro = currentStep === 0 ? `${exercise.title}. ${step.prompt}` : step.prompt;
    speak(intro, () => setIsNarrating(false));
    return () => stopSpeaking();
  }, [currentStep, exerciseId]);

  useEffect(() => {
    if (!isBreathing) return;
    const phases: Array<"in"|"hold-in"|"out"|"hold-out"> = ["in","hold-in","out","hold-out"];
    let idx = 0;
    const advance = () => { idx = (idx + 1) % 4; setBreathPhase(phases[idx]); if (idx === 0) setBreathCycles((c) => c + 1); };
    const timer = setInterval(advance, 4000);
    return () => clearInterval(timer);
  }, [isBreathing, currentStep]);

  if (!exercise) return (<div className="flex items-center justify-center min-h-svh" style={{ backgroundColor: "#221E1D" }}><p className="text-sm italic" style={{ color: "#8A8580" }}>Exercise not found.</p></div>);

  const handleNext = async () => {
    const updatedAnswers = [...answers, input];
    setAnswers(updatedAnswers);
    setInput("");
    if (currentStep < exercise.steps.length - 1) { setCurrentStep((s) => s + 1); }
    else {
      setIsSaving(true);
      try {
        const narrativeText = updatedAnswers.filter(Boolean).join("\n\n---\n\n");
        const goldVeinText = `${exercise.title}: ${updatedAnswers[updatedAnswers.length - 1] || exercise.completionNarrative}`;
        await request("/api/veins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "exercise", narrativeText, goldVeinText }) });
        await request("/api/my-vessel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_seam", source: "exercise", goldVeinText, narrativeText }) }).catch(() => {});
        if (voiceEnabled) speak(exercise.completionNarrative);
        setCompleted(true);
      } catch { setCompleted(true); } finally { setIsSaving(false); }
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-8" style={{ backgroundColor: "#221E1D" }}>
        <motion.div className="text-center max-w-sm space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <span className="text-3xl" style={{ color: "#C9A961" }}>✦</span>
          <h2 className="text-2xl font-light italic" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>{exercise.title} — completed.</h2>
          <p className="text-sm italic leading-relaxed" style={{ color: "#8A8580" }}>{exercise.completionNarrative}</p>
          <div className="flex flex-col gap-3 pt-4">
            <motion.button onClick={() => router.push("/my-vessel")} className="w-full py-3 text-xs uppercase tracking-widest" style={{ backgroundColor: "#C9A961", color: "#221E1D" }} whileTap={{ scale: 0.98 }}>See your vessel</motion.button>
            <motion.button onClick={() => router.push("/gilding-station")} className="w-full py-3 text-xs uppercase tracking-widest" style={{ border: "1px solid rgba(201,169,97,0.3)", color: "#C9A961" }} whileTap={{ scale: 0.98 }}>Return to the station</motion.button>
          </div>
          <p className="text-[9px] italic leading-relaxed" style={{ color: "#8A8580" }}>Kintsugi is a companion, not a clinician. In crisis? Call or text 988 (US).</p>
        </motion.div>
      </div>
    );
  }

  const breathLabel: Record<string, string> = { in: "Breathe in", "hold-in": "Hold", out: "Breathe out", "hold-out": "Rest" };
  const breathScale: Record<string, number> = { in: 1.18, "hold-in": 1.18, out: 0.88, "hold-out": 0.88 };

  return (
    <div className="flex flex-col min-h-svh" style={{ backgroundColor: "#221E1D" }}>
      <header className="h-[60px] px-4 flex items-center justify-between z-10" style={{ borderBottom: "1px solid rgba(201,169,97,0.15)", backgroundColor: "#2A2826" }}>
        <Link href="/gilding-station" className="flex items-center text-xs uppercase tracking-wide gap-1" style={{ color: "#C9A961" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Back
        </Link>
        <h2 className="text-xs uppercase tracking-wider font-light" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>{exercise.title}</h2>
        <motion.button onClick={() => { setVoiceEnabled((v) => !v); if (voiceEnabled) stopSpeaking(); }} className="p-2" style={{ color: voiceEnabled ? "#C9A961" : "#8A8580" }} whileTap={{ scale: 0.9 }}>
          {voiceEnabled ? (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" strokeLinecap="round" strokeLinejoin="round" /></svg>) : (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
        </motion.button>
      </header>

      <div className="flex-1 p-6 flex flex-col justify-between pb-24">
        <div className="space-y-6 max-w-sm mx-auto w-full">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
              <span>Alignment stage</span><span>Step {currentStep + 1} of {exercise.steps.length}</span>
            </div>
            <div className="flex gap-1 w-full">
              {exercise.steps.map((_, i) => (<div key={i} className="h-0.5 flex-1 transition-all duration-700" style={{ backgroundColor: i <= currentStep ? "#C9A961" : "rgba(138,133,128,0.3)" }} />))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentStep} className="py-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              {isNarrating && (<div className="flex items-center gap-2 mb-3"><span className="w-1.5 h-1.5 rounded-full gold-pulse" style={{ backgroundColor: "#C9A961" }} /><span className="text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }}>Narrating...</span></div>)}
              <h3 className="text-xl leading-relaxed italic font-light" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}><BreathPrompt key={promptKey} text={step?.prompt ?? ""} /></h3>
              {voiceEnabled && !isNarrating && step && (<motion.button onClick={() => { setIsNarrating(true); speak(step.prompt, () => setIsNarrating(false)); }} className="mt-3 flex items-center gap-1.5 text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }} whileTap={{ scale: 0.9 }}><svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" strokeLinecap="round" strokeLinejoin="round" /></svg>Hear again</motion.button>)}
            </motion.div>
          </AnimatePresence>

          {isBreathing ? (<div className="flex flex-col items-center py-8 gap-6"><motion.div className="rounded-full border-2" style={{ width: 120, height: 120, borderColor: "#C9A961", backgroundColor: "rgba(201,169,97,0.05)" }} animate={{ scale: breathScale[breathPhase] ?? 1 }} transition={{ duration: 4, ease: "easeInOut" }} /><p className="text-sm italic tracking-widest" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#C9A961" }}>{breathLabel[breathPhase]}</p><span className="text-[10px] uppercase tracking-widest" style={{ color: "#8A8580" }}>{breathCycles} cycles</span></div>) : (<div className="space-y-4"><div className="space-y-2"><label className="text-[9px] uppercase tracking-widest block" style={{ color: "#8A8580" }}>Capture the trace in words</label><textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full p-4 text-base italic font-light focus:outline-none transition-all rounded-none resize-none" style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.15)", color: "#F5F0E8", minHeight: "110px" }} placeholder={step?.placeholder} rows={4} /></div><WhisperButton onTranscript={(t) => setInput((prev) => prev ? `${prev} ${t}` : t)} /></div>)}
        </div>

        <div className="space-y-4 max-w-sm mx-auto w-full pt-6">
          <motion.button onClick={handleNext} disabled={isSaving} className="w-full py-4 text-xs uppercase tracking-widest font-medium transition-all duration-300 rounded-none" style={{ backgroundColor: "#C9A961", color: "#221E1D" }} whileTap={{ scale: 0.98 }}>
            {isSaving ? "Gilding..." : currentStep < exercise.steps.length - 1 ? (step?.advanceLabel ?? "Continue") : "Save as gold vein"}
          </motion.button>
          <p className="text-[9px] leading-relaxed italic text-center" style={{ color: "#8A8580" }}>Kintsugi works alongside recovery, not inside psychiatric diagnosis. Reach assistance via 988 where crisis support stays secure.</p>
        </div>
      </div>
    </div>
  );
}
