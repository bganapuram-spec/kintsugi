import { ai } from "@eazo/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getVeinsByUser } from "@/lib/db/queries/veins";
import { createVessel, getVesselsByUser } from "@/lib/db/queries/vessels";

const WISDOM_PROMPT = `You are The Restorer. A user has completed their vessel — they have sat with six emotional fractures and gilded each one with insight.

Read their six gold veins below. Then write a single short paragraph (3-4 sentences) that:
1. Notices the pattern across all six — what keeps appearing, what this person is learning about themselves.
2. Names one quality or truth that seems to be the thread running through their healing.
3. Speaks in second person ("You"), warm and unhurried, as if you are handing them a completed piece of pottery.

No toxic positivity. No exclamation points. No emojis. Write as if this will be read slowly, once, and kept.`;

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const veins = await getVeinsByUser(userId);
  const completedVessels = await getVesselsByUser(userId);

  // Which vein IDs are already in a completed vessel?
  const usedVeinIds = new Set(completedVessels.flatMap((v) => v.veinIds as string[]));
  const unusedVeins = veins.filter((v) => !usedVeinIds.has(v.id));

  return NextResponse.json({
    totalVeins: veins.length,
    unusedCount: unusedVeins.length,
    completedVessels: completedVessels.length,
    ready: unusedVeins.length >= 6,
  });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const veins = await getVeinsByUser(userId);
  const completedVessels = await getVesselsByUser(userId);

  const usedVeinIds = new Set(completedVessels.flatMap((v) => v.veinIds as string[]));
  const unusedVeins = veins.filter((v) => !usedVeinIds.has(v.id));

  if (unusedVeins.length < 6) {
    return NextResponse.json({ ready: false, count: unusedVeins.length });
  }

  // Use oldest 6 unused veins
  const vesselVeins = unusedVeins.slice(-6).reverse();
  const veinList = vesselVeins.map((v, i) => `${i + 1}. ${v.goldVeinText}`).join("\n");

  try {
    const res = await ai.chat({
      model: "deepseek.v3.1",
      messages: [
        { role: "system", content: WISDOM_PROMPT },
        { role: "user", content: `Gold veins:\n${veinList}` },
      ],
      max_tokens: 200,
    });
    const wisdom = res.choices[0]?.message?.content?.trim() ?? "";

    const vessel = await createVessel({
      userId,
      vesselNumber: completedVessels.length + 1,
      wisdom,
      veinIds: vesselVeins.map((v) => v.id),
    });

    return NextResponse.json({ ready: true, wisdom, vessel, vesselVeins });
  } catch {
    return NextResponse.json({ error: "Could not generate wisdom" }, { status: 500 });
  }
}
