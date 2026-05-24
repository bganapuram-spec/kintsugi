"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";
import OnboardingRitual from "@/components/OnboardingRitual";

export default function WelcomeFractureScreen() {
  const auth = useEazo((s) => s.auth);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [greeting, setGreeting] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // On mount: check onboarding completion (guide is handled at layout level)
  useEffect(() => {
    setHydrated(true);
    if (!auth.authenticated) return;
    request("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.onboarding) setGreeting(data.onboarding.wholeVision);
        else setShowOnboarding(true);
      })
      .catch(() => {});
  }, [auth.authenticated]);

  if (!hydrated) return null;
  if (showOnboarding) {
    return (
      <OnboardingRitual
        onComplete={(ans) => {
          setGreeting(ans.wholeVision);
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <div className="relative flex flex-col items-center min-h-svh px-6 py-10 overflow-hidden"
      style={{ backgroundColor: "var(--k-bg)" }}>

      {/* Background vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "radial-gradient(circle at center, transparent 55%, var(--k-bg) 100%)" }} />
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(var(--k-gold) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Header */}
      <motion.div className="relative z-10 flex justify-between items-center w-full max-w-lg"
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--k-gold)", boxShadow: "0 0 8px var(--k-gold)" }} />
          <span className="text-xs tracking-[0.2em] uppercase"
            style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-gold)" }}>
            Kintsugi
          </span>
        </div>
        <span className="text-[9px] uppercase tracking-widest"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text-muted)" }}>
          Atelier
        </span>
      </motion.div>

      {/* Vessel illustration */}
      <VesselSvg />

      {/* Tagline + CTA */}
      <motion.div className="relative z-10 w-full max-w-xs text-center space-y-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="text-2xl font-light italic leading-relaxed"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-text)" }}>
          Where does it hurt today?
        </h1>
        <p className="text-sm font-light italic leading-relaxed" style={{ color: "var(--k-text-muted)" }}>
          We treat emotional breakages as valuable histories, not damage to hide.
        </p>
        {greeting && (
          <p className="text-xs italic leading-relaxed" style={{ color: "rgba(201,169,97,0.6)" }}>
            You said whole would feel like: &ldquo;{greeting.slice(0, 70)}{greeting.length > 70 ? "..." : ""}&rdquo;
          </p>
        )}
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link href="/"
            className="group relative inline-flex items-center justify-center w-full px-10 py-4 text-xs uppercase tracking-widest transition-all duration-500"
            style={{ border: "1px solid var(--k-gold)", backgroundColor: "transparent", color: "var(--k-gold)" }}>
            Begin mapping
            <svg className="ml-2 w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
              fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>

        {/* Re-open guide */}
        <button
          onClick={() => { localStorage.removeItem("kintsugi_seen_guide"); window.location.reload(); }}
          className="text-[9px] uppercase tracking-widest w-full text-center py-1"
          style={{ color: "var(--k-text-faint)" }}>
          View feature guide
        </button>
      </motion.div>

      {/* Safety footer */}
      <motion.div className="relative z-10 w-full max-w-lg text-center pt-6 mt-auto"
        style={{ borderTop: "1px solid var(--k-border)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}>
        <p className="text-[9px] leading-relaxed italic" style={{ color: "var(--k-text-faint)" }}>
          Kintsugi is a companion, not a clinician. If you are struggling, please reach out to a licensed mental health professional.
          In crisis? Call or text 988 (US) or your local emergency line.
        </p>
      </motion.div>
    </div>
  );
}

function VesselSvg() {
  return (
    <motion.div className="relative w-56 h-56 flex items-center justify-center my-8"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
      <svg viewBox="0 0 200 220" className="w-full h-full" style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}>
        <defs>
          <radialGradient id="wGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#3a2f2c" />
            <stop offset="100%" stopColor="#18100f" />
          </radialGradient>
          <filter id="goldGlowWelcome">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path d="M 52,44 C 52,44 22,66 22,120 C 22,168 60,184 100,184 C 140,184 178,168 178,120 C 178,66 148,44 148,44 Z"
          fill="url(#wGrad)" stroke="var(--k-gold)" strokeWidth="0.7" />
        <path d="M 52,44 Q 100,34 148,44" fill="none" stroke="var(--k-gold)" strokeWidth="0.8" strokeOpacity="0.6" />
        <motion.path d="M 88,50 C 82,74 90,98 84,122 C 80,140 68,152 70,170"
          fill="none" stroke="var(--k-gold)" strokeWidth="1.4" strokeLinecap="round"
          filter="url(#goldGlowWelcome)"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} />
        <motion.path d="M 112,48 C 118,72 110,96 116,118 C 120,136 132,148 130,168"
          fill="none" stroke="var(--k-gold)" strokeWidth="1.2" strokeLinecap="round"
          filter="url(#goldGlowWelcome)"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.9, ease: [0.16, 1, 0.3, 1] }} />
      </svg>
    </motion.div>
  );
}
