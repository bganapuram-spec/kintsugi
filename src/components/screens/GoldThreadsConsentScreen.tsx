"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GoldThreadsConsentScreen() {
  const router = useRouter();

  return (
    <div
      className="relative flex flex-col items-center min-h-svh px-6 py-10 overflow-hidden"
      style={{ backgroundColor: "#221E1D" }}
    >
      {/* Dot grid texture */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#C9A961 1.2px, transparent 1.2px)", backgroundSize: "40px 40px" }}
      />

      {/* Close */}
      <div className="relative z-10 flex justify-end w-full max-w-sm">
        <Link
          href="/"
          className="p-2 text-[10px] uppercase tracking-widest transition-colors"
          style={{ border: "1px solid rgba(201,169,97,0.15)", color: "#8A8580" }}
        >
          Exit
        </Link>
      </div>

      {/* Body */}
      <motion.div
        className="relative z-10 my-auto max-w-sm text-center px-4 flex-1 flex flex-col items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ border: "1px solid rgba(201,169,97,0.4)" }}
        >
          <span
            className="text-base italic"
            style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#C9A961" }}
          >
            ✿
          </span>
        </div>
        <h2
          className="text-3xl font-light leading-snug mb-4"
          style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "#F5F0E8" }}
        >
          The Wilderness of{" "}
          <br />
          <span className="italic" style={{ color: "#C9A961" }}>
            Shared Filaments
          </span>
        </h2>
        <p className="text-sm leading-relaxed font-light mb-8 italic" style={{ color: "#8A8580" }}>
          Beyond your atelier lies a quiet canopy of anonymous fractures. To read them is to
          witness private grief, hope, and vulnerability. We share here in deep silence. There are
          no counts, scores, or public metrics.
        </p>
        <div className="space-y-3 w-full">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/threads"
              className="w-full py-4 text-xs uppercase tracking-widest font-medium transition-all duration-300 rounded-none text-center block"
              style={{ backgroundColor: "#C9A961", color: "#221E1D" }}
            >
              Enter with respect
            </Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/"
              className="w-full py-4 text-xs uppercase tracking-widest font-medium rounded-none text-center block transition-colors"
              style={{ backgroundColor: "#2A2826", border: "1px solid rgba(201,169,97,0.15)", color: "#8A8580" }}
            >
              Remain in solitude
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <div
        className="relative z-10 max-w-sm w-full pt-6 text-center"
        style={{ borderTop: "1px solid rgba(201,169,97,0.15)" }}
      >
        <p className="text-[9px] leading-relaxed italic" style={{ color: "#8A8580" }}>
          Consent is reversible and opt-in only. All profiles remain entirely unlinked.
        </p>
      </div>
    </div>
  );
}
