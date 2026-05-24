import { request } from "./request";

export async function sendChatMessage(message: string, sessionId?: string) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await request("/api/user/profile").then(() => ({})).catch(() => ({}))),
    },
    body: JSON.stringify({ message, sessionId }),
  });
  return response;
}

export async function fetchVeins() {
  const res = await request("/api/veins");
  const data = await res.json();
  return data.veins;
}

export async function saveVein(vein: { source: "chat" | "exercise"; narrativeText: string; goldVeinText: string }) {
  const res = await request("/api/veins", { method: "POST", body: JSON.stringify(vein) });
  return res.json();
}
