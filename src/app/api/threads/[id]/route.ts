import { requireAuth } from "@/lib/auth";
import { reportThread, resonateWithThread } from "@/lib/db/queries/threads";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id: threadId } = await params;

  const body = await request.json().catch(() => ({}));
  const action = body?.action;

  if (action === "report") {
    await reportThread(threadId);
    return NextResponse.json({ ok: true });
  }

  if (action === "resonate") {
    const updated = await resonateWithThread(threadId, userId);
    if (!updated) {
      return NextResponse.json({ alreadyResonated: true });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
