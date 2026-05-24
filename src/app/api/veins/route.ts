import { requireAuth } from "@/lib/auth";
import { createVein, deleteVein, getVeinsByUser, shareVein } from "@/lib/db/queries/veins";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const veins = await getVeinsByUser(userId);
  return NextResponse.json({ veins });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { source: "chat" | "exercise"; narrativeText: string; goldVeinText: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.narrativeText?.trim() || !body.goldVeinText?.trim()) {
    return NextResponse.json({ error: "narrativeText and goldVeinText are required" }, { status: 400 });
  }

  const vein = await createVein({
    userId,
    source: body.source ?? "chat",
    narrativeText: body.narrativeText,
    goldVeinText: body.goldVeinText,
  });

  return NextResponse.json({ vein }, { status: 201 });
}
