import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOnboarding, saveOnboarding } from "@/lib/db/queries/personal";

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const onboarding = await getOnboarding(userId);
  return NextResponse.json({ onboarding });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { reason: string; feelingWord: string; wholeVision: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.reason?.trim() || !body.feelingWord?.trim() || !body.wholeVision?.trim()) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const onboarding = await saveOnboarding(userId, body);
  return NextResponse.json({ onboarding }, { status: 201 });
}
