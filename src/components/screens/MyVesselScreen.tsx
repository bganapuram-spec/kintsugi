"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { request } from "@/lib/api/request";
import { VesselSVG, type SeamData } from "@/components/VesselSVG";

interface PersonalVessel {
  id: string;
  vesselNumber: number;
  sealed: boolean;
  wisdom?: string;
  glaze?: string;
  sealedAt?: string;
  createdAt: string;
  seams?: SeamData[];
}

const MAX_SEAMS = 12;

export default function MyVesselScreen() {
  const router = useRouter();
  const [active, setActive] = useState<PersonalVessel | null>(null);
  const [seams, setSeams] = useState<SeamData[]>([]);
  const [sealed, setSealed] = useState<PersonalVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDust, setShowDust] = useState(false);
  const [dustCleared, setDustCleared] = useState(true);
  const [dustLevel, setDustLevel] = useState(1);
  const [selectedSeam, setSelectedSeam] = useState<SeamData | null>(null);
  const [selectedSealed, setSelectedSealed] = useState<PersonalVessel | null>(null);
  const [sealingOpen, setSealingOpen] = useState(false);
  const [glaze, setGlaze] = useState("");
  const [sealing, setSealing] = useState(false);
  const [wisdomResult, setWisdomResult] = useState<{ wisdom: string } | null>(null);
  const vesselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragDistRef = useRef(0);

  useEffect(() => {
    request("/api/my-vessel")
      .then((r) => r.json())
      .then((data) => {
        setActive(data.active ?? null);
        setSeams(data.seams ?? []);
        setSealed(data.sealedVessels ?? []);
        const hasDust = data.showDust && !data.dustCleared;
        setShowDust(hasDust);
        setDustCleared(data.dustCleared ?? true);
        if (hasDust) setDustLevel(1);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  /* Dust brush-off interaction */
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !showDust) return;
    dragDistRef.current += Math.abs(e.movementX) + Math.abs(e.movementY);
    const progress = Math.min(dragDistRef.current / 300, 1);
    setDustLevel(1 - progress);
    if (progress >= 1) {
      setShowDust(false);
      setDustLevel(0);
      request("/api/my-vessel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_dust" }),
      }).catch(() => { });
    }
  }, [isDragging, showDust]);

  /* Export as PNG */
  const handleExport = async () => {
    const svgEl = vesselRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const canvas = document.createElement("canvas");
    canvas.width = 800; canvas.height = 860;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx!.fillStyle = "#221E1D";
      ctx!.fillRect(0, 0, 800, 860);
      ctx!.drawImage(img, 0, 0, 800, 800);
      ctx!.fillStyle = "#C9A961";
      ctx!.font = "italic 22px 'Cormorant Garamond', serif";
      ctx!.textAlign = "center";
      ctx!.fillText(active?.glaze ?? "My Vessel", 400, 830);
      ctx!.fillStyle = "#8A8580";
      ctx!.font = "13px Inter, sans-serif";
      ctx!.fillText(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), 400, 855);
      const a = document.createElement("a");
      a.download = "kintsugi-vessel.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleSeal = async () => {
    if (!active) return;
    setSealing(true);
    try {
      const res = await request("/api/my-vessel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seal", glaze: glaze || "Unnamed Glaze" }),
      });
      const data = await res.json();
      setWisdomResult({ wisdom: data.wisdom });
      setSealed((prev) => [{ ...data.sealed, seams }, ...prev]);
      setActive(data.newVessel);
      setSeams([]);
      setSealingOpen(false);
    } catch { }
    finally { setSealing(false); }
  };

  const isComplete = seams.length >= MAX_SEAMS;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh" style={{ backgroundColor: "#221E1D" }}>
        <span className="w-2 h-2 rounded-full gold-pulse" style={{ backgroundColor: "#C9A961" }} />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-svh pb-24" style={{ backgroundColor: "var(--k-bg)" }}>
      {/* Ambient atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 ambient-breath"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,169,97,0.12), transparent 65%), radial-gradient(ellipse 60% 40% at 50% 90%, rgba(212,132,122,0.05), transparent 65%)",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header className="h-[60px] px-4 flex items-center justify-between sticky top-0 z-20"
        style={{ borderBottom: "1px solid var(--k-border)", backgroundColor: "var(--k-bg)" }}>
        <div>
          <h2 className="text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}>
            My Vessel
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <motion.button onClick={handleExport} className="text-[9px] uppercase tracking-widest"
            style={{ color: "#8A8580" }} whileTap={{ scale: 0.9 }}>
            Export
          </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Dust welcome message */}
        <AnimatePresence>
          {showDust && (
            <motion.div className="text-center px-6 pt-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs italic leading-relaxed" style={{ color: "#8A8580" }}>
                welcome back. the gold is still here.
              </p>
              <p className="text-[9px] uppercase tracking-widest mt-1" style={{ color: "rgba(201,169,97,0.5)" }}>
                Drag across your vessel to brush away the settled dust.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vessel */}
        <div className="px-8 pt-4 pb-2 max-w-xs mx-auto">
          <div className="text-center mb-2">
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
              Vessel {active?.vesselNumber ?? 1}
            </span>
          </div>

          <div ref={vesselRef} className="relative aspect-square w-full select-none"
            style={{ maxHeight: "290px", cursor: showDust ? "grab" : "default" }}
            onPointerDown={() => { setIsDragging(true); dragDistRef.current = 0; }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
            onPointerMove={handlePointerMove}>
            <VesselSVG seams={seams} dustLevel={showDust ? dustLevel : 0}
              onSeamClick={(s) => setSelectedSeam(s)} />
          </div>

          {/* Seam count */}
          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
              <span>Seams gilded</span>
              <span>{seams.length} / {MAX_SEAMS}</span>
            </div>
            <div className="w-full h-px" style={{ backgroundColor: "rgba(201,169,97,0.12)" }}>
              <motion.div className="h-full" style={{ backgroundColor: "#C9A961" }}
                initial={{ width: 0 }}
                animate={{ width: `${(seams.length / MAX_SEAMS) * 100}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
            </div>
            {seams.length === 0 && (
              <p className="text-[9px] italic text-center pt-1" style={{ color: "#8A8580" }}>
                Complete exercises or save gold veins from the Atelier to gild your vessel.
              </p>
            )}
          </div>

          {/* Seal button */}
          {isComplete && (
            <motion.button onClick={() => setSealingOpen(true)}
              className="w-full mt-5 py-3 text-[10px] uppercase tracking-widest"
              style={{ border: "1px solid #C9A961", color: "#C9A961" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              whileTap={{ scale: 0.97 }}>
              ✦ This vessel is made whole — seal it
            </motion.button>
          )}
        </div>

        {/* Wisdom reveal */}
        <AnimatePresence>
          {wisdomResult && (
            <motion.div className="mx-6 mt-4 p-5 max-w-xs mx-auto"
              style={{ border: "1px solid rgba(201,169,97,0.4)", backgroundColor: "rgba(201,169,97,0.04)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
              <span className="text-[9px] uppercase tracking-widest block mb-3" style={{ color: "#C9A961" }}>
                ✦ The Restorer&apos;s reading
              </span>
              <p className="text-sm font-light italic leading-relaxed"
                style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                {wisdomResult.wisdom}
              </p>
              <button onClick={() => setWisdomResult(null)} className="mt-4 text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sealed vessel archive */}
        {sealed.length > 0 && (
          <div className="px-6 mt-8">
            <h3 className="text-[9px] uppercase tracking-widest mb-4 max-w-xs mx-auto"
              style={{ color: "#8A8580", borderBottom: "1px solid rgba(201,169,97,0.12)", paddingBottom: "8px" }}>
              Earlier vessels
            </h3>
            <div className="space-y-3 max-w-xs mx-auto">
              {sealed.map((v) => (
                <motion.button key={v.id} onClick={() => setSelectedSealed(v)}
                  className="w-full p-4 text-left"
                  style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.12)" }}
                  whileTap={{ scale: 0.99 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
                      Vessel {v.vesselNumber} — {v.glaze ?? "Sealed"}
                    </span>
                    <span className="text-[8px]" style={{ color: "#8A8580" }}>
                      {v.seams?.length ?? 12} seams
                    </span>
                  </div>
                  {v.wisdom && (
                    <p className="text-xs font-light italic leading-relaxed line-clamp-2"
                      style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                      {v.wisdom}
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Seam detail modal */}
      <AnimatePresence>
        {selectedSeam && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ backgroundColor: "rgba(34,30,29,0.92)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedSeam(null)}>
            <motion.div className="w-full max-w-sm p-6 space-y-4"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.3)" }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
                ✦ Gold Seam — {new Date(selectedSeam.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </span>
              <p className="text-base font-light italic leading-relaxed"
                style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                &ldquo;{selectedSeam.goldVeinText}&rdquo;
              </p>
              <button onClick={() => setSelectedSeam(null)} className="w-full py-2 text-[9px] uppercase tracking-widest"
                style={{ border: "1px solid rgba(201,169,97,0.2)", color: "#8A8580" }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sealed vessel detail modal */}
      <AnimatePresence>
        {selectedSealed && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ backgroundColor: "rgba(34,30,29,0.92)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedSealed(null)}>
            <motion.div className="w-full max-w-sm p-6 space-y-4 overflow-y-auto max-h-[80svh]"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.3)" }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
                Vessel {selectedSealed.vesselNumber} — {selectedSealed.glaze}
              </span>
              {selectedSealed.wisdom && (
                <p className="text-base font-light italic leading-relaxed"
                  style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                  {selectedSealed.wisdom}
                </p>
              )}
              {selectedSealed.seams && selectedSealed.seams.length > 0 && (
                <div className="space-y-2 pt-2" style={{ borderTop: "1px solid rgba(201,169,97,0.12)" }}>
                  {selectedSealed.seams.map((s) => (
                    <p key={s.id} className="text-xs font-light italic leading-relaxed" style={{ color: "#8A8580" }}>
                      · {s.goldVeinText}
                    </p>
                  ))}
                </div>
              )}
              <button onClick={() => setSelectedSealed(null)} className="w-full py-2 text-[9px] uppercase tracking-widest"
                style={{ border: "1px solid rgba(201,169,97,0.2)", color: "#8A8580" }}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seal modal */}
      <AnimatePresence>
        {sealingOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ backgroundColor: "rgba(34,30,29,0.93)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSealingOpen(false)}>
            <motion.div className="w-full max-w-sm p-6 space-y-5"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.3)" }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-light italic"
                style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                Name your glaze.
              </h3>
              <p className="text-xs italic leading-relaxed" style={{ color: "#8A8580" }}>
                This vessel is made whole. Give it a name — the word that lives inside it.
              </p>
              <input value={glaze} onChange={(e) => setGlaze(e.target.value)}
                className="w-full bg-transparent border-b py-2 text-base italic font-light focus:outline-none"
                style={{ borderColor: "rgba(201,169,97,0.3)", color: "#F5F0E8", fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)" }}
                placeholder="e.g. Patience, Becoming, Held..." maxLength={50} />
              <div className="flex gap-3">
                <button onClick={() => setSealingOpen(false)} className="flex-1 py-2.5 text-[9px] uppercase tracking-widest"
                  style={{ border: "1px solid rgba(201,169,97,0.15)", color: "#8A8580" }}>
                  Cancel
                </button>
                <motion.button onClick={handleSeal} disabled={sealing}
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-widest"
                  style={{ backgroundColor: "#C9A961", color: "#221E1D" }}
                  whileTap={{ scale: 0.97 }}>
                  {sealing ? "Sealing..." : "Seal the vessel"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
