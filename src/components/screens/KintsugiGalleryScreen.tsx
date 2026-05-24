"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { request } from "@/lib/api/request";

interface Vein {
  id: string;
  source: string;
  narrativeText: string;
  goldVeinText: string;
  createdAt: string;
}
interface Vessel {
  id: string;
  vesselNumber: number;
  wisdom: string;
  veinIds: string[];
  createdAt: string;
}

// Organic, contained vein paths that stay within the vessel silhouette
function veinPath(i: number): string {
  const paths = [
    "M 100,45 C 95,70 108,95 98,120 C 91,138 78,148 76,168",
    "M 148,46 C 138,68 142,90 150,112 C 156,128 164,138 160,158",
    "M 62,58 C 72,78 65,100 70,120 C 74,136 86,150 84,168",
    "M 115,45 C 125,72 118,98 128,118 C 135,132 148,140 145,160",
    "M 88,44 C 82,68 90,92 84,114 C 80,130 68,142 70,162",
    "M 130,50 C 140,74 132,96 138,115 C 143,130 155,142 152,162",
    "M 74,55 C 68,80 78,104 72,124 C 68,138 56,148 58,166",
    "M 118,46 C 110,70 104,96 112,116 C 118,132 130,146 126,166",
  ];
  return paths[i % paths.length];
}

function VesselSVG({
  veins,
  completedVeinIds,
  onVeinClick,
  highlight,
}: {
  veins: Vein[];
  completedVeinIds?: string[];
  onVeinClick: (v: Vein) => void;
  highlight?: string;
}) {
  return (
    <svg viewBox="0 0 200 210" className="w-full h-full" style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.7))" }}>
      <defs>
        <radialGradient id="vesselGrad" cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#3a2e2b" />
          <stop offset="55%" stopColor="#27201e" />
          <stop offset="100%" stopColor="#18100f" />
        </radialGradient>
        <radialGradient id="vesselSheen" cx="30%" cy="25%" r="45%">
          <stop offset="0%" stopColor="#5a4540" stopOpacity="0.35" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="veinGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="vesselClip">
          <path d="M 52,42 C 52,42 22,64 22,118 C 22,166 60,182 100,182 C 140,182 178,166 178,118 C 178,64 148,42 148,42 Z" />
        </clipPath>
      </defs>

      {/* Vessel body */}
      <path d="M 52,42 C 52,42 22,64 22,118 C 22,166 60,182 100,182 C 140,182 178,166 178,118 C 178,64 148,42 148,42 Z"
        fill="url(#vesselGrad)" stroke="#C9A961" strokeWidth="0.6" />
      {/* Sheen highlight */}
      <path d="M 52,42 C 52,42 22,64 22,118 C 22,166 60,182 100,182 C 140,182 178,166 178,118 C 178,64 148,42 148,42 Z"
        fill="url(#vesselSheen)" clipPath="url(#vesselClip)" />
      {/* Rim */}
      <path d="M 52,42 Q 100,33 148,42" fill="none" stroke="#C9A961" strokeWidth="0.7" strokeOpacity="0.7" />
      {/* Rim inner */}
      <path d="M 58,44 Q 100,36 142,44" fill="none" stroke="#C9A961" strokeWidth="0.3" strokeOpacity="0.3" />
      {/* Base */}
      <ellipse cx="100" cy="182" rx="28" ry="4" fill="#C9A961" fillOpacity="0.12" />

      {/* Veins */}
      <g clipPath="url(#vesselClip)">
        {veins.map((vein, i) => {
          const isHighlighted = highlight === vein.id;
          const isCompleted = completedVeinIds?.includes(vein.id);
          return (
            <motion.path
              key={vein.id}
              d={veinPath(i)}
              fill="none"
              stroke={isCompleted ? "#a07840" : "#C9A961"}
              strokeWidth={isHighlighted ? 2.4 : 1.6}
              strokeLinecap="round"
              filter={isHighlighted ? "url(#activeGlow)" : "url(#veinGlow)"}
              style={{ cursor: "pointer", opacity: isCompleted ? 0.55 : 1 }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isCompleted ? 0.55 : 1 }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => onVeinClick(vein)}
            />
          );
        })}
      </g>
    </svg>
  );
}

export default function KintsugiGalleryScreen() {
  const [activeVeins, setActiveVeins] = useState<Vein[]>([]);
  const [completedVessels, setCompletedVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVein, setSelectedVein] = useState<Vein | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [wisdomReady, setWisdomReady] = useState(false);
  const [wisdomLoading, setWisdomLoading] = useState(false);
  const [wisdomResult, setWisdomResult] = useState<{ wisdom: string; vessel: Vessel } | null>(null);
  const [highlightId, setHighlightId] = useState<string | undefined>();

  const loadGallery = async () => {
    try {
      const res = await request("/api/vessels");
      const data = await res.json();
      setActiveVeins(data.activeVeins ?? []);
      setCompletedVessels(data.vessels ?? []);
      setWisdomReady(data.activeVeins?.length >= 6);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadGallery(); }, []);

  const handleSealVessel = async () => {
    setWisdomLoading(true);
    try {
      const res = await request("/api/vessels/wisdom", { method: "POST" });
      const data = await res.json();
      if (data.wisdom && data.vessel) {
        setWisdomResult({ wisdom: data.wisdom, vessel: data.vessel });
        await loadGallery();
      }
    } catch { }
    finally { setWisdomLoading(false); }
  };

  const totalVeins = activeVeins.length + completedVessels.reduce((acc, v) => acc + (v.veinIds as string[]).length, 0);

  return (
    <div className="flex flex-col min-h-svh pb-24" style={{ backgroundColor: "#221E1D" }}>
      {/* Header */}
      <header className="h-[60px] px-4 flex items-center justify-between z-10 sticky top-0" style={{ borderBottom: "1px solid rgba(201,169,97,0.15)", backgroundColor: "#221E1D" }}>
        <Link href="/" className="flex items-center text-xs uppercase tracking-wide gap-1" style={{ color: "#C9A961" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atelier
        </Link>
        <h2 className="text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
          The Kintsugi Gallery
        </h2>
        <div className="w-12" />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Count */}
        <div className="text-center pt-8 pb-2 px-6">
          {loading ? (
            <div className="h-8 w-48 skeleton rounded mx-auto" />
          ) : (
            <motion.span className="text-2xl font-light italic block" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#C9A961" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {totalVeins} fracture{totalVeins !== 1 ? "s" : ""} gilded.
            </motion.span>
          )}
          <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#8A8580" }}>
            Tap a vein to read the entry
          </p>
        </div>

        {/* Active vessel */}
        <div className="px-6 pt-4">
          <div className="max-w-xs mx-auto">
            <p className="text-[9px] uppercase tracking-widest mb-2 text-center" style={{ color: "#C9A961" }}>
              Vessel {completedVessels.length + 1} — in progress
            </p>
            <div className="relative aspect-square w-full" style={{ maxHeight: "300px" }}>
              {loading ? (
                <div className="w-full h-full skeleton rounded" />
              ) : (
                <VesselSVG veins={activeVeins} onVeinClick={(v) => { setSelectedVein(v); setHighlightId(v.id); }} highlight={highlightId} />
              )}
            </div>

            {/* Progress to seal */}
            {!loading && activeVeins.length < 6 && activeVeins.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
                  <span>Fractures to complete vessel</span>
                  <span>{activeVeins.length} / 6</span>
                </div>
                <div className="w-full h-px" style={{ backgroundColor: "rgba(201,169,97,0.12)" }}>
                  <motion.div className="h-full" style={{ backgroundColor: "#C9A961" }}
                    initial={{ width: 0 }} animate={{ width: `${(activeVeins.length / 6) * 100}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
                </div>
              </div>
            )}

            {/* Seal vessel button */}
            {wisdomReady && !wisdomResult && (
              <motion.div className="mt-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-xs italic text-center mb-3 leading-relaxed" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#8A8580" }}>
                  Your vessel holds six fractures. It is ready to be sealed.
                </p>
                <motion.button onClick={handleSealVessel} disabled={wisdomLoading}
                  className="w-full py-3 text-[10px] uppercase tracking-widest"
                  style={{ border: "1px solid #C9A961", color: "#C9A961", backgroundColor: "transparent" }}
                  whileTap={{ scale: 0.98 }}>
                  {wisdomLoading ? "The Restorer is reading your vessel..." : "✦ Seal this vessel"}
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Wisdom reveal */}
        <AnimatePresence>
          {wisdomResult && (
            <motion.div className="mx-6 mt-6 p-5 max-w-xs mx-auto"
              style={{ border: "1px solid rgba(201,169,97,0.4)", backgroundColor: "rgba(201,169,97,0.04)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
              <span className="text-[9px] uppercase tracking-widest block mb-3" style={{ color: "#C9A961" }}>
                ✦ The Restorer's reading — Vessel {wisdomResult.vessel.vesselNumber}
              </span>
              <p className="text-sm font-light italic leading-relaxed" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                {wisdomResult.wisdom}
              </p>
              <motion.button onClick={() => setWisdomResult(null)} className="mt-4 text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }} whileTap={{ scale: 0.9 }}>
                Close
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && activeVeins.length === 0 && completedVessels.length === 0 && (
          <div className="text-center px-8 py-8 max-w-xs mx-auto">
            <p className="text-sm italic leading-relaxed" style={{ color: "#8A8580" }}>
              Your vessel awaits its first gilding.<br />
              Speak to The Restorer, or complete an exercise in the Gilding Station.
            </p>
            <Link href="/" className="mt-4 inline-block text-[10px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
              Return to the Atelier →
            </Link>
          </div>
        )}

        {/* Completed vessels archive */}
        {completedVessels.length > 0 && (
          <div className="px-6 mt-10">
            <h3 className="text-xs uppercase tracking-widest mb-4 max-w-xs mx-auto" style={{ color: "#8A8580", borderBottom: "1px solid rgba(201,169,97,0.12)", paddingBottom: "8px" }}>
              Sealed Vessels
            </h3>
            <div className="space-y-3 max-w-xs mx-auto">
              {completedVessels.map((vessel) => (
                <motion.button key={vessel.id} onClick={() => setSelectedVessel(vessel)}
                  className="w-full p-4 text-left"
                  style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.15)" }}
                  whileTap={{ scale: 0.99 }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
                      Vessel {vessel.vesselNumber}
                    </span>
                    <span className="text-[8px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
                      {(vessel.veinIds as string[]).length} fractures
                    </span>
                  </div>
                  <p className="text-sm font-light italic leading-relaxed line-clamp-2"
                    style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                    {vessel.wisdom}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vein detail modal */}
      <AnimatePresence>
        {selectedVein && (
          <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(34,30,29,0.92)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setSelectedVein(null); setHighlightId(undefined); }}>
            <motion.div className="w-full max-w-sm p-6 space-y-4"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.35)" }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C9A961" }} />
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "#C9A961" }}>
                  Gold Vein — {new Date(selectedVein.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <p className="text-base font-light italic leading-relaxed"
                style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                &ldquo;{selectedVein.narrativeText.slice(0, 300)}{selectedVein.narrativeText.length > 300 ? "..." : ""}&rdquo;
              </p>
              <div className="pt-3" style={{ borderTop: "1px solid rgba(201,169,97,0.15)" }}>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#C9A961" }}>
                  {selectedVein.goldVeinText}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <motion.button onClick={() => { setSelectedVein(null); setHighlightId(undefined); }}
                  className="flex-1 py-2 text-[9px] uppercase tracking-widest"
                  style={{ border: "1px solid rgba(201,169,97,0.2)", color: "#8A8580" }} whileTap={{ scale: 0.97 }}>
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed vessel detail modal */}
      <AnimatePresence>
        {selectedVessel && (
          <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(34,30,29,0.92)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedVessel(null)}>
            <motion.div className="w-full max-w-sm p-6 space-y-4"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.35)" }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] uppercase tracking-widest block" style={{ color: "#C9A961" }}>
                ✦ Vessel {selectedVessel.vesselNumber} — The Restorer&apos;s Reading
              </span>
              <p className="text-base font-light italic leading-relaxed"
                style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                {selectedVessel.wisdom}
              </p>
              <p className="text-[9px] uppercase tracking-widest" style={{ color: "#8A8580" }}>
                {(selectedVessel.veinIds as string[]).length} fractures sealed · {new Date(selectedVessel.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <motion.button onClick={() => setSelectedVessel(null)} className="w-full py-2 text-[9px] uppercase tracking-widest"
                style={{ border: "1px solid rgba(201,169,97,0.2)", color: "#8A8580" }} whileTap={{ scale: 0.97 }}>
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
