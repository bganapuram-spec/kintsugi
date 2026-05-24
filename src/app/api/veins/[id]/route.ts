import { requireAuth } from "@/lib/auth";
import { deleteVein, rateVein, shareVein } from "@/lib/db/queries/veins";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id: veinId } = await params;

  await deleteVein(veinId, userId);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;
  const { id: veinId } = await params;

  let body: { action?: "share" | "rate"; meaningfulness?: number } = {};
  try {
    body = await request.json();
  } catch {
    // empty body = legacy share behaviour
  }

  if (body.action === "rate") {
    const m = Number(body.meaningfulness);
    if (!Number.isInteger(m) || m < 1 || m > 5) {
      return NextResponse.json({ error: "meaningfulness must be 1-5" }, { status: 400 });
    }
    const vein = await rateVein(veinId, userId, m);
    if (!vein) return NextResponse.json({ error: "Vein not found" }, { status: 404 });
    return NextResponse.json({ vein });
  }

  const vein = await shareVein(veinId, userId);
  if (!vein) {
    return NextResponse.json({ error: "Vein not found" }, { status: 404 });
  }
  return NextResponse.json({ vein });
}
