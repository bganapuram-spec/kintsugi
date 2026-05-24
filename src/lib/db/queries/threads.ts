import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { threadResonances, threads } from "../schema/threads";

export async function getThreads(limit = 30) {
  return db
    .select()
    .from(threads)
    .where(eq(threads.reported, false))
    .orderBy(desc(threads.createdAt))
    .limit(limit);
}

export async function createThread(anonymizedNarrative: string) {
  const [thread] = await db
    .insert(threads)
    .values({ anonymizedNarrative })
    .returning();
  return thread;
}

export async function resonateWithThread(threadId: string, userId: string) {
  // Check if already resonated
  const existing = await db
    .select()
    .from(threadResonances)
    .where(
      and(
        eq(threadResonances.threadId, threadId),
        eq(threadResonances.userId, userId)
      )
    )
    .limit(1);

  if (existing.length > 0) return null; // already resonated

  await db.insert(threadResonances).values({ threadId, userId });

  const [updated] = await db
    .update(threads)
    .set({ resonanceCount: sql`${threads.resonanceCount} + 1` })
    .where(eq(threads.id, threadId))
    .returning();

  return updated;
}

export async function reportThread(threadId: string) {
  const [updated] = await db
    .update(threads)
    .set({ reported: true })
    .where(eq(threads.id, threadId))
    .returning();
  return updated;
}

export async function getUserResonances(userId: string): Promise<string[]> {
  const rows = await db
    .select({ threadId: threadResonances.threadId })
    .from(threadResonances)
    .where(eq(threadResonances.userId, userId));
  return rows.map((r) => r.threadId);
}
