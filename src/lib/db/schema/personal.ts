import type { InferSelectModel } from "drizzle-orm";
import { boolean, index, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const onboardingAnswers = pgTable(
  "onboarding_answers",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    feelingWord: varchar("feeling_word", { length: 50 }).notNull(),
    wholeVision: text("whole_vision").notNull(),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("onboarding_user_id_idx").on(table.userId),
  })
);

export const personalVessels = pgTable(
  "personal_vessels",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vesselNumber: json("vessel_number").$type<number>().notNull().default(1),
    sealed: boolean("sealed").notNull().default(false),
    wisdom: text("wisdom"),
    glaze: varchar("glaze", { length: 100 }),
    sealedAt: timestamp("sealed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("personal_vessels_user_id_idx").on(table.userId),
    sealedIdx: index("personal_vessels_sealed_idx").on(table.sealed),
  })
);

export const vesselSeams = pgTable(
  "vessel_seams",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    vesselId: varchar("vessel_id", { length: 128 })
      .notNull()
      .references(() => personalVessels.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 20 }).notNull().default("exercise"),
    goldVeinText: text("gold_vein_text").notNull(),
    narrativeText: text("narrative_text"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    vesselIdx: index("vessel_seams_vessel_id_idx").on(table.vesselId),
  })
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: varchar("user_id", { length: 128 })
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    lastVisit: timestamp("last_visit"),
    dustCleared: boolean("dust_cleared").notNull().default(true),
    soundscapeOn: boolean("soundscape_on").notNull().default(false),
    quietHourActive: boolean("quiet_hour_active").notNull().default(false),
    quietHourStartedAt: timestamp("quiet_hour_started_at"),
    theme: varchar("theme", { length: 10 }).notNull().default("dark"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);

export type OnboardingAnswers = InferSelectModel<typeof onboardingAnswers>;
export type PersonalVessel = InferSelectModel<typeof personalVessels>;
export type VesselSeam = InferSelectModel<typeof vesselSeams>;
export type UserPreferences = InferSelectModel<typeof userPreferences>;
