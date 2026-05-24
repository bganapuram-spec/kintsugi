"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { request } from "@/lib/api/request";

interface Thread {
  id: string;
  anonymizedNarrative: string;
  resonanceCount: number;
  createdAt: string;
  reported: boolean;
}
interface Vein {
  id: string;
  goldVeinText: string;
  narrativeText: string;
  sharedPublicly: boolean;
}

export default function GoldThreadsScreen() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [userResonances, setUserResonances] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reportedLocal, setReportedLocal] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);
  const [userVeins, setUserVeins] = useState<Vein[]>([]);
  const [selectedVeinId, setSelectedVeinId] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await request("/api/threads");
        const data = await res.json();
        setThreads(data.threads ?? []);
        setUserResonances(new Set(data.userResonances ?? []));
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const loadVeins = async () => {
    try {
      const res = await request("/api/veins");
      const data = await res.json();
      setUserVeins((data.veins ?? []).filter((v: Vein) => !v.sharedPublicly));
    } catch { }
  };

  const handleOpenShare = async () => {
    await loadVeins();
    setShowShareModal(true);
  };

  const handleShare = async () => {
    if (!selectedVeinId) return;
    const vein = userVeins.find((v) => v.id === selectedVeinId);
    if (!vein) return;
    setSharing(true);
    try {
      // Anonymize and publish as thread
      await request("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ narrative: vein.goldVeinText + ". " + vein.narrativeText }),
      });
      // Mark vein as shared
      await request(`/api/veins/${selectedVeinId}`, { method: "PATCH" });
      setSharedSuccess(true);
      // Reload threads
      const res = await request("/api/threads");
      const data = await res.json();
      setThreads(data.threads ?? []);
      setTimeout(() => { setShowShareModal(false); setSharedSuccess(false); setSelectedVeinId(""); }, 2000);
    } catch { }
    finally { setSharing(false); }
  };

  const handleResonate = async (threadId: string) => {
    if (userResonances.has(threadId) || threadId.startsWith("seed")) return;
    setUserResonances((prev) => new Set([...prev, threadId]));
    try {
      await request(`/api/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resonate" }),
      });
    } catch { }
  };

  const handleReport = async (threadId: string) => {
    setReportedLocal((prev) => new Set([...prev, threadId]));
    try {
      await request(`/api/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report" }),
      });
    } catch { }
  };

  const visibleThreads = threads.filter((t) => !reportedLocal.has(t.id) && !t.reported);

  return (
    <div className="relative flex flex-col min-h-svh pb-24" style={{ backgroundColor: "#221E1D" }}>
      {/* Constellation grid */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#C9A961 1.5px, transparent 1.5px)", backgroundSize: "48px 48px" }} />

      <header className="relative z-10 h-[60px] px-4 flex items-center justify-between sticky top-0"
        style={{ borderBottom: "1px solid rgba(201,169,97,0.15)", backgroundColor: "#221E1D" }}>
        <Link href="/" className="flex items-center text-xs uppercase tracking-wide gap-1" style={{ color: "#C9A961" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Atelier
        </Link>
        <div className="text-center">
          <span className="text-[8px] uppercase tracking-widest block" style={{ color: "#C9A961" }}>Whispering Constellation</span>
          <h2 className="text-xs uppercase tracking-wider" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>Gold Threads</h2>
        </div>
        {/* Share your own thread */}
        <motion.button onClick={handleOpenShare} className="text-[9px] uppercase tracking-widest px-2 py-1"
          style={{ border: "1px solid rgba(201,169,97,0.3)", color: "#C9A961" }} whileTap={{ scale: 0.93 }}>
          Share
        </motion.button>
      </header>

      <div className="relative z-10 flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
        <div className="text-center max-w-xs mx-auto mb-4">
          <p className="text-xs italic font-light leading-relaxed" style={{ color: "#8A8580" }}>
            A collective sanctuary of filaments. Tap the gold dot to softly acknowledge that another&apos;s message resonated.
          </p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          {loading ? (
            [1, 2, 3].map((n) => <div key={n} className="h-36 skeleton rounded" />)
          ) : visibleThreads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm italic leading-relaxed" style={{ color: "#8A8580" }}>
                No threads yet. Be the first to share a gold vein from your Gallery.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {visibleThreads.map((thread, i) => (
                <ThreadCard key={thread.id} thread={thread} resonated={userResonances.has(thread.id)}
                  onResonate={() => handleResonate(thread.id)} onReport={() => handleReport(thread.id)} delay={i * 0.07} />
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="max-w-sm mx-auto text-center pt-6" style={{ borderTop: "1px solid rgba(201,169,97,0.12)" }}>
          <p className="text-[9px] leading-relaxed italic max-w-xs mx-auto" style={{ color: "#8A8580" }}>
            These threads are raw whispers — anonymized, without names or timelines. We sit with them in unified, respectful quiet.
          </p>
        </div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ backgroundColor: "rgba(34,30,29,0.93)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowShareModal(false)}>
            <motion.div className="w-full max-w-sm p-6 space-y-5"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.3)" }}
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}>

              {sharedSuccess ? (
                <motion.div className="text-center py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <span className="text-2xl block mb-3" style={{ color: "#C9A961" }}>✦</span>
                  <p className="text-sm italic" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                    Your thread has been woven into the constellation.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest block mb-1" style={{ color: "#C9A961" }}>Share a gold vein</span>
                    <p className="text-xs italic leading-relaxed" style={{ color: "#8A8580" }}>
                      Choose one of your gold veins to share anonymously. Your name and details will be removed.
                    </p>
                  </div>

                  {userVeins.length === 0 ? (
                    <p className="text-xs italic text-center" style={{ color: "#8A8580" }}>
                      No gold veins to share yet. Complete a conversation with The Restorer first.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                      {userVeins.map((vein) => (
                        <motion.button key={vein.id} onClick={() => setSelectedVeinId(vein.id)}
                          className="w-full p-3 text-left transition-all"
                          style={{
                            backgroundColor: selectedVeinId === vein.id ? "rgba(201,169,97,0.1)" : "rgba(34,30,29,0.6)",
                            border: selectedVeinId === vein.id ? "1px solid #C9A961" : "1px solid rgba(201,169,97,0.15)",
                          }}
                          whileTap={{ scale: 0.99 }}>
                          <p className="text-xs italic leading-relaxed line-clamp-2"
                            style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
                            {vein.goldVeinText}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <motion.button onClick={() => setShowShareModal(false)} className="flex-1 py-2.5 text-[9px] uppercase tracking-widest"
                      style={{ border: "1px solid rgba(201,169,97,0.15)", color: "#8A8580" }} whileTap={{ scale: 0.97 }}>
                      Cancel
                    </motion.button>
                    <motion.button onClick={handleShare} disabled={!selectedVeinId || sharing}
                      className="flex-1 py-2.5 text-[9px] uppercase tracking-widest"
                      style={{ backgroundColor: selectedVeinId ? "#C9A961" : "rgba(201,169,97,0.3)", color: "#221E1D" }}
                      whileTap={{ scale: 0.97 }}>
                      {sharing ? "Weaving..." : "Share thread"}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThreadCard({ thread, resonated, onResonate, onReport, delay }: {
  thread: Thread; resonated: boolean; onResonate: () => void; onReport: () => void; delay: number;
}) {
  return (
    <motion.div className="p-5 relative" style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.15)" }}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}>
      <p className="font-light text-base leading-relaxed italic mb-4"
        style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}>
        &ldquo;{thread.anonymizedNarrative}&rdquo;
      </p>
      <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid rgba(201,169,97,0.12)" }}>
        <motion.button onClick={onResonate} aria-label="Resonate"
          className="inline-flex items-center space-x-2 text-[9px] uppercase tracking-wider"
          style={{ color: resonated ? "#C9A961" : "#8A8580" }} whileTap={{ scale: 0.9 }}>
          <motion.span className="w-2 h-2 rounded-full"
            style={{ backgroundColor: resonated ? "#C9A961" : "transparent", border: resonated ? "none" : "1px solid #C9A961" }}
            animate={resonated ? { boxShadow: ["0 0 0px #C9A961", "0 0 8px #C9A961", "0 0 0px #C9A961"] } : {}}
            transition={{ duration: 1.2, repeat: resonated ? 1 : 0 }} />
          <span>{resonated ? "Resonated" : "This resonated"}</span>
        </motion.button>
        <button onClick={onReport} className="text-[9px] uppercase tracking-wider" style={{ color: "#8A8580" }}>
          Flag
        </button>
      </div>
    </motion.div>
  );
}
