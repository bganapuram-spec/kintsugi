import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserPrefs, updateUserPrefs } from "@/lib/db/queries/personal";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const prefs = await getUserPrefs(userId);
  return NextResponse.json({ theme: prefs.theme ?? "dark" });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { theme: "dark" | "light" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!["dark", "light"].includes(body.theme)) {
    return NextResponse.json({ error: "theme must be dark or light" }, { status: 400 });
  }

  await updateUserPrefs(userId, { theme: body.theme });
  return NextResponse.json({ theme: body.theme });
}
