import { ai } from "@eazo/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createVein } from "@/lib/db/queries/veins";

const DISTILL_PROMPT = `You are helping a user save a "gold vein" — an insight, strength, or truth they discovered through reflecting on a painful experience.

Given the conversation below, write a single sentence (15–25 words) that captures the gold vein: what was revealed about this person's character, resilience, or truth.
Write it as a first-person statement starting with "I" — dignified, quiet, true.
No toxic positivity. No exclamation points. Just the truth that was found.`;

const LESSON_PROMPT = `You are helping a user crystallize the *lesson* learned from a difficult experience they just processed.

Given the conversation below, write a single short sentence (10–18 words) — the lesson, stated as a quiet maxim or principle. Not advice. Not a command. A truth the user can return to.

Style:
- No "you should", no "remember to".
- Plain language, present tense.
- No toxic positivity, no exclamation points, no emojis.
- Sound like a sentence carved into wood, not a self-help slogan.

Examples of the right tone:
- "Slowness is a form of self-respect."
- "The grief is proof of how much it mattered."
- "Asking is not weakness; it is precision."`;

async function generate(systemPrompt: string, userContent: string, maxTokens: number): Promise<string | null> {
  try {
    const res = await ai.chat({
      model: "deepseek.v3.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  let body: { narrativeText: string; conversationContext?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.narrativeText?.trim()) {
    return NextResponse.json({ error: "narrativeText is required" }, { status: 400 });
  }

  let goldVeinText = body.narrativeText.slice(0, 120);
  let lessonText: string | null = null;

  if (body.conversationContext) {
    const userBlock = `Conversation:\n${body.conversationContext}\n\nUser's fracture: ${body.narrativeText}`;
    const [distilled, lesson] = await Promise.all([
      generate(DISTILL_PROMPT, userBlock, 60),
      generate(LESSON_PROMPT, userBlock, 50),
    ]);
    if (distilled) goldVeinText = distilled;
    if (lesson) lessonText = lesson;
  }

  const vein = await createVein({
    userId,
    source: "chat",
    narrativeText: body.narrativeText,
    goldVeinText,
    lessonText,
  });

  return NextResponse.json({ vein }, { status: 201 });
}
