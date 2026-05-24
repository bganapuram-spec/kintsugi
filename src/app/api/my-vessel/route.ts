import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getActiveVessel, getAllPersonalVessels, createPersonalVessel,
  getSeamsByVessel, addSeam, sealPersonalVessel, getUserPrefs, updateUserPrefs
} from "@/lib/db/queries/personal";
import { ai } from "@eazo/sdk";

const VESSEL_WISDOM_PROMPT = `You are The Restorer. A user has completed their personal vessel — twelve gold seams painted through twelve moments of emotional work.

Read their twelve gold veins. Write one short paragraph (3-4 sentences) in second person ("You"):
- Name the pattern you see woven through their work
- Speak to one quality this person carries that the work has revealed
- Offer it like handing them back a completed object — warm, slow, certain

No exclamation points. No toxic positivity. No emojis.`;

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const [allVessels, prefs] = await Promise.all([
    getAllPersonalVessels(userId),
    getUserPrefs(userId),
  ]);

  let active = allVessels.find((v) => !v.sealed) ?? null;
  let seams: Awaited<ReturnType<typeof getSeamsByVessel>> = [];

  if (!active) {
    active = await createPersonalVessel(userId, allVessels.length + 1);
  } else {
    seams = await getSeamsByVessel(active.id);
  }

  const sealedVessels = await Promise.all(
    allVessels.filter((v) => v.sealed).map(async (v) => ({
      ...v, seams: await getSeamsByVessel(v.id),
    }))
  );

  // Record visit for dust tracking
  const lastVisit = prefs.lastVisit;
  await updateUserPrefs(userId, { lastVisit: new Date() });

  const daysSince = lastVisit
    ? (Date.now() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const showDust = daysSince >= 7;

  return NextResponse.json({ active, seams, sealedVessels, showDust, dustCleared: prefs.dustCleared });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { action: "add_seam" | "seal" | "clear_dust"; goldVeinText?: string; narrativeText?: string; source?: string; glaze?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  if (body.action === "clear_dust") {
    await updateUserPrefs(userId, { dustCleared: true, lastVisit: new Date() });
    return NextResponse.json({ ok: true });
  }

  const allVessels = await getAllPersonalVessels(userId);
  let active = allVessels.find((v) => !v.sealed) ?? null;
  if (!active) active = await createPersonalVessel(userId, allVessels.length + 1);

  if (body.action === "add_seam") {
    if (!body.goldVeinText?.trim()) return NextResponse.json({ error: "goldVeinText required" }, { status: 400 });
    const seam = await addSeam({
      vesselId: active.id,
      source: body.source ?? "exercise",
      goldVeinText: body.goldVeinText,
      narrativeText: body.narrativeText,
    });
    const allSeams = await getSeamsByVessel(active.id);
    return NextResponse.json({ seam, seamCount: allSeams.length, ready: allSeams.length >= 12 });
  }

  if (body.action === "seal") {
    const seams = await getSeamsByVessel(active.id);
    if (seams.length < 12) return NextResponse.json({ error: "Need 12 seams to seal" }, { status: 400 });

    const veinList = seams.map((s, i) => `${i + 1}. ${s.goldVeinText}`).join("\n");
    let wisdom = "Your vessel holds twelve fractures, each one gilded with care.";
    try {
      const res = await ai.chat({
        model: "deepseek.v3.1",
        messages: [
          { role: "system", content: VESSEL_WISDOM_PROMPT },
          { role: "user", content: veinList },
        ],
        max_tokens: 200,
      });
      wisdom = res.choices[0]?.message?.content?.trim() ?? wisdom;
    } catch { /* fallback to default */ }

    const sealed = await sealPersonalVessel(active.id, wisdom, body.glaze);
    const newVessel = await createPersonalVessel(userId, allVessels.length + 1);
    return NextResponse.json({ sealed, newVessel, wisdom });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
