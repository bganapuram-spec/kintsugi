import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createNewSession, findRecentEmptySession, getSessionById } from "@/lib/db/queries/chat-sessions";

// GET — reuse the most recent empty session if one exists, else create a fresh one.
// Prevents a new empty session every page mount / refresh.
export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const existing = await findRecentEmptySession(userId);
  const session = existing ?? (await createNewSession(userId, "New conversation"));
  return NextResponse.json({
    sessionId: session.id,
    messages: [],
  });
}

// POST — load an existing session by ID (used when switching from history)
export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { sessionId: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const session = await getSessionById(body.sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = (session.messages as Array<{ role: string; content: string }>);
  return NextResponse.json({
    sessionId: session.id,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}
