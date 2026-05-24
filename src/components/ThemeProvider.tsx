"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useEazo } from "@eazo/sdk/react";
import { request } from "@/lib/api/request";

type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const auth = useEazo((s) => s.auth);
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Apply cached theme instantly, no blocking
    const cached = typeof window !== "undefined"
      ? (localStorage.getItem("kintsugi_theme") as Theme | null)
      : null;
    if (cached) {
      setThemeState(cached);
      document.documentElement.classList.toggle("light", cached === "light");
    }
    if (!auth.authenticated) return;
    request("/api/theme")
      .then((r) => r.json())
      .then((data) => {
        const t: Theme = data.theme ?? "dark";
        setThemeState(t);
        document.documentElement.classList.toggle("light", t === "light");
        localStorage.setItem("kintsugi_theme", t);
      })
      .catch(() => {});
  }, [auth.authenticated]);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("light", t === "light");
    if (typeof window !== "undefined") localStorage.setItem("kintsugi_theme", t);
    try {
      await request("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      });
    } catch {}
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
