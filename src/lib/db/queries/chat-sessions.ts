import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { chatSessions } from "../schema/chat-sessions";

export async function getOrCreateSession(userId: string) {
  // Return most recent session or create a new one
  const existing = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.createdAt))
    .limit(1);

  if (existing.length > 0) return existing[0];

  const [session] = await db
    .insert(chatSessions)
    .values({ userId, messages: [] })
    .returning();
  return session;
}

export async function appendMessage(
  sessionId: string,
  message: { role: string; content: string }
) {
  const session = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (!session[0]) throw new Error("Session not found");

  const messages = [...(session[0].messages as Array<{ role: string; content: string }>), message];

  const [updated] = await db
    .update(chatSessions)
    .set({ messages, updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId))
    .returning();
  return updated;
}

export async function getAllSessions(userId: string) {
  return db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));
}

export async function getSessionById(sessionId: string) {
  const rows = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);
  return rows[0] ?? null;
}

export async function createNewSession(userId: string, title?: string) {
  const [session] = await db
    .insert(chatSessions)
    .values({ userId, messages: [], title: title ?? "New conversation" })
    .returning();
  return session;
}

// Return the most recent empty session for this user, or null
export async function findRecentEmptySession(userId: string) {
  const rows = await db
    .select()
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        sql`jsonb_array_length(${chatSessions.messages}::jsonb) = 0`
      )
    )
    .orderBy(desc(chatSessions.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteSession(sessionId: string, userId: string) {
  await db
    .delete(chatSessions)
    .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)));
}
