import { eq, desc } from "drizzle-orm";
import { db } from "../client";
import {
  onboardingAnswers, personalVessels, vesselSeams, userPreferences,
  type OnboardingAnswers, type PersonalVessel, type VesselSeam, type UserPreferences
} from "../schema/personal";

/* ── Onboarding ── */
export async function getOnboarding(userId: string): Promise<OnboardingAnswers | null> {
  const rows = await db.select().from(onboardingAnswers).where(eq(onboardingAnswers.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function saveOnboarding(userId: string, data: { reason: string; feelingWord: string; wholeVision: string }) {
  const existing = await getOnboarding(userId);
  if (existing) return existing;
  const [row] = await db.insert(onboardingAnswers).values({ userId, ...data }).returning();
  return row;
}

/* ── Personal Vessels ── */
export async function getActiveVessel(userId: string): Promise<PersonalVessel | null> {
  const rows = await db
    .select().from(personalVessels)
    .where(eq(personalVessels.userId, userId))
    .orderBy(desc(personalVessels.createdAt))
    .limit(10);
  return rows.find((v) => !v.sealed) ?? null;
}

export async function getAllPersonalVessels(userId: string): Promise<PersonalVessel[]> {
  return db.select().from(personalVessels).where(eq(personalVessels.userId, userId)).orderBy(desc(personalVessels.createdAt));
}

export async function createPersonalVessel(userId: string, vesselNumber: number): Promise<PersonalVessel> {
  const [v] = await db.insert(personalVessels).values({ userId, vesselNumber }).returning();
  return v;
}

export async function sealPersonalVessel(vesselId: string, wisdom: string, glaze?: string): Promise<PersonalVessel> {
  const [v] = await db.update(personalVessels)
    .set({ sealed: true, wisdom, glaze: glaze ?? "Unnamed Glaze", sealedAt: new Date() })
    .where(eq(personalVessels.id, vesselId))
    .returning();
  return v;
}

/* ── Seams ── */
export async function getSeamsByVessel(vesselId: string): Promise<VesselSeam[]> {
  return db.select().from(vesselSeams).where(eq(vesselSeams.vesselId, vesselId)).orderBy(desc(vesselSeams.createdAt));
}

export async function addSeam(data: { vesselId: string; source: string; goldVeinText: string; narrativeText?: string }): Promise<VesselSeam> {
  const [s] = await db.insert(vesselSeams).values(data).returning();
  return s;
}

/* ── User Preferences ── */
export async function getUserPrefs(userId: string): Promise<UserPreferences> {
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (rows[0]) return rows[0];
  const [created] = await db.insert(userPreferences).values({ userId }).returning();
  return created;
}

export async function updateUserPrefs(userId: string, data: Partial<Omit<UserPreferences, "userId">>) {
  const existing = await getUserPrefs(userId);
  if (!existing) {
    return db.insert(userPreferences).values({ userId, ...data }).returning();
  }
  const [updated] = await db.update(userPreferences).set({ ...data, updatedAt: new Date() }).where(eq(userPreferences.userId, userId)).returning();
  return updated;
}
