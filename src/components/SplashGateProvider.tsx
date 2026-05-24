"use client";
import { useEffect, useState } from "react";
import SplashGuide from "@/components/SplashGuide";

export default function SplashGateProvider({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("kintsugi_seen_guide");
    if (!seen) setShowSplash(true);
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      {children}
      {showSplash && (
        <SplashGuide
          onComplete={() => {
            localStorage.setItem("kintsugi_seen_guide", "1");
            setShowSplash(false);
          }}
        />
      )}
    </>
  );
}
