"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/utils";
import { useEazo } from "@eazo/sdk/react";
import { auth as eazoAuth } from "@eazo/sdk";
import { motion } from "framer-motion";
import { useState } from "react";

const navItems = [
  {
    href: "/",
    label: "Atelier",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8 2 5 5.5 5 10c0 3.5 2.5 5.5 5.5 6.5" />
        <path d="M12 2c4 0 7 3.5 7 8 0 3.5-2.5 5.5-5.5 6.5" />
        <path d="M10 16.5c0 3 2 5.5 2 5.5s2-2.5 2-5.5" />
        <path d="M9 4h6" />
      </svg>
    ),
  },
  {
    href: "/my-vessel",
    label: "My Vessel",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4 C6 4 3 7 3 13 C3 18 7 21 12 21 C17 21 21 18 21 13 C21 7 18 4 18 4 Z" />
        <path d="M6 4 Q12 2 18 4" />
        <path d="M9 10 C9 10 10 14 12 16" strokeOpacity="0.7" />
        <path d="M15 9 C15 9 13 13 12 16" strokeOpacity="0.7" />
      </svg>
    ),
  },
  {
    href: "/lessons",
    label: "Lessons",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="6.5" width="13" height="11" rx="1" transform="rotate(-6 3.5 6.5)" />
        <rect x="6" y="5" width="13" height="11" rx="1" />
        <path d="M9 9h7" strokeOpacity="0.55" />
        <path d="M9 12h5" strokeOpacity="0.55" />
      </svg>
    ),
  },
  {
    href: "/gilding-station",
    label: "Gilding",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A7.5 7.5 0 0 0 2 9.5c0 4 3 7 6.5 8.2" />
        <path d="M14.5 2A7.5 7.5 0 0 1 22 9.5c0 4-3 7-6.5 8.2" />
        <path d="M12 17.7V22" />
        <path d="M9 22h6" />
        <path d="M12 7v5l3 1.5" />
      </svg>
    ),
  },
  {
    href: "/gallery",
    label: "Gallery",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="7" ry="10" />
        <path d="M12 2v20" strokeOpacity="0.4" />
        <path d="M8 5.5c2 1.5 4 1.5 8 0" strokeOpacity="0.4" />
        <path d="M5.5 10c3 1 6 1 9 0" strokeOpacity="0.4" />
        <path d="M5.5 14c3 1 6 1 9 0" strokeOpacity="0.4" />
        <path d="M8 18.5c2-1.5 4-1.5 8 0" strokeOpacity="0.4" />
      </svg>
    ),
  },
  {
    href: "/threads",
    label: "Threads",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
      </svg>
    ),
  },
];

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15" />
    <path d="M18 15l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

export default function KintsugiNav({ variant }: { variant: "bottom" | "sidebar" }) {
  const pathname = usePathname();
  const auth = useEazo((s) => s.auth);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await eazoAuth.logout();
    } catch {
      setLoggingOut(false);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  /* ── Bottom nav (mobile) ── */
  if (variant === "bottom") {
    return (
      <div className="flex items-center justify-around px-0.5 h-16">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-colors flex-1 min-w-0 min-h-[44px] justify-center",
              isActive(item.href) ? "text-[#C9A961]" : "text-[#8A8580]"
            )}>
            {item.icon}
            <span className="text-[8.5px] tracking-wider uppercase truncate" style={{ fontFamily: "var(--font-inter,Inter,sans-serif)" }}>
              {item.label}
            </span>
          </Link>
        ))}

        {auth.authenticated && (
          <motion.button onClick={handleLogout} disabled={loggingOut}
            className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg flex-1 min-w-0 min-h-[44px] justify-center"
            style={{ color: "#8A8580" }}
            whileTap={{ scale: 0.88 }}>
            <LogoutIcon />
            <span className="text-[8.5px] tracking-wider uppercase truncate" style={{ fontFamily: "var(--font-inter,Inter,sans-serif)" }}>
              {loggingOut ? "..." : "Leave"}
            </span>
          </motion.button>
        )}
      </div>
    );
  }

  /* ── Sidebar (desktop) ── */
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 shrink-0" style={{ borderBottom: "1px solid var(--k-border)" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl" style={{ color: "var(--k-gold)" }}>✦</span>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ fontFamily: "var(--font-cormorant,'Cormorant Garamond',serif)", color: "var(--k-gold)" }}>
              Kintsugi
            </p>
            <p className="text-[8px] uppercase tracking-wider" style={{ color: "var(--k-text-faint)" }}>
              Heal in Gold
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
              isActive(item.href)
                ? "bg-[rgba(201,169,97,0.1)] text-[#C9A961]"
                : "text-[#8A8580] hover:text-[#F5F0E8] hover:bg-[rgba(201,169,97,0.05)]"
            )}>
            {item.icon}
            <span style={{ fontFamily: "var(--font-inter,Inter,sans-serif)" }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout at the bottom */}
      {auth.authenticated && (
        <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--k-border)" }}>
          <motion.button onClick={handleLogout} disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm group"
            style={{ color: "var(--k-text-muted)" }}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}>
            <LogoutIcon />
            <span style={{ fontFamily: "var(--font-inter,Inter,sans-serif)" }}>
              {loggingOut ? "Leaving..." : "Leave the atelier"}
            </span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
