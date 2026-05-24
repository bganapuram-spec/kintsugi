import { ai } from "@eazo/sdk";
import { requireAuth } from "@/lib/auth";
import { createThread, getThreads, getUserResonances } from "@/lib/db/queries/threads";
import { NextRequest, NextResponse } from "next/server";

const ANONYMIZATION_PROMPT = `You are a PII scrubber. The user will provide a personal narrative. Your task:
1. Remove all names (replace with generic terms like "they", "my friend", "someone").
2. Remove all locations, addresses, city names.
3. Remove all dates and specific timestamps.
4. Remove any identifiable details (workplace names, school names, etc.).
5. Keep the emotional core intact — the feelings, the insight, the truth.

Respond with ONLY the anonymized narrative. No preamble, no commentary.`;

async function anonymizeNarrative(text: string): Promise<string> {
  try {
    const response = await ai.chat({
      model: "deepseek.v3.1",
      messages: [
        { role: "system", content: ANONYMIZATION_PROMPT },
        { role: "user", content: text },
      ],
      max_tokens: 300,
    });
    return response.choices[0]?.message?.content?.trim() ?? text;
  } catch {
    return text; // fallback: keep original if scrubbing fails
  }
}

export async function GET(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;
  const { id: userId } = result.user;

  const threads = await getThreads(30);
  const userResonances = await getUserResonances(userId);

  return NextResponse.json({ threads, userResonances });
}

export async function POST(request: NextRequest) {
  const result = requireAuth(request);
  if (!result.ok) return result.response;

  let body: { narrative: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.narrative?.trim()) {
    return NextResponse.json({ error: "narrative is required" }, { status: 400 });
  }

  const anonymized = await anonymizeNarrative(body.narrative);
  const thread = await createThread(anonymized);
  return NextResponse.json({ thread }, { status: 201 });
}
