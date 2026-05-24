import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createNewSession,
  findRecentEmptySession,
  getAllSessions,
  getSessionById,
} from "@/lib/db/queries/chat-sessions";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const sessions = await getAllSessions(userId);
  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { action: "new" | "get"; sessionId?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.action === "new") {
    // Reuse the most recent empty session instead of creating duplicates
    const existing = await findRecentEmptySession(userId);
    const session = existing ?? (await createNewSession(userId, body.title));
    return NextResponse.json({ session }, { status: existing ? 200 : 201 });
  }

  if (body.action === "get") {
    if (!body.sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    const session = await getSessionById(body.sessionId);
    if (!session || session.userId !== userId) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
