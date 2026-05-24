import { desc, eq } from "drizzle-orm";
import { db } from "../client";
import { vessels } from "../schema/vessels";

export async function getVesselsByUser(userId: string) {
  return db
    .select()
    .from(vessels)
    .where(eq(vessels.userId, userId))
    .orderBy(desc(vessels.createdAt));
}

export async function createVessel(data: {
  userId: string;
  vesselNumber: number;
  wisdom: string;
  veinIds: string[];
}) {
  const [vessel] = await db.insert(vessels).values(data).returning();
  return vessel;
}
