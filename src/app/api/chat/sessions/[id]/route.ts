import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteSession, getSessionById } from "@/lib/db/queries/chat-sessions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id: sessionId } = await params;

  const session = await getSessionById(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteSession(sessionId, userId);
  return NextResponse.json({ ok: true });
}
