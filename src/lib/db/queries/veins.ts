import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import { veins } from "../schema/veins";

export async function getVeinsByUser(userId: string) {
  return db
    .select()
    .from(veins)
    .where(eq(veins.userId, userId))
    .orderBy(desc(veins.createdAt));
}

export async function createVein(data: {
  userId: string;
  source: "chat" | "exercise";
  narrativeText: string;
  goldVeinText: string;
  lessonText?: string | null;
}) {
  const [vein] = await db.insert(veins).values(data).returning();
  return vein;
}

export async function rateVein(veinId: string, userId: string, meaningfulness: number) {
  const [updated] = await db
    .update(veins)
    .set({ meaningfulness })
    .where(and(eq(veins.id, veinId), eq(veins.userId, userId)))
    .returning();
  return updated;
}

export async function shareVein(veinId: string, userId: string) {
  const [updated] = await db
    .update(veins)
    .set({ sharedPublicly: true })
    .where(and(eq(veins.id, veinId), eq(veins.userId, userId)))
    .returning();
  return updated;
}

export async function deleteVein(veinId: string, userId: string) {
  await db
    .delete(veins)
    .where(and(eq(veins.id, veinId), eq(veins.userId, userId)));
}
