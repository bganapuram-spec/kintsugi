import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const veins = pgTable(
  "veins",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    source: varchar("source", { length: 16 }).notNull().default("chat"),
    narrativeText: text("narrative_text").notNull(),
    goldVeinText: text("gold_vein_text").notNull(),
    lessonText: text("lesson_text"),
    meaningfulness: integer("meaningfulness"),
    sharedPublicly: boolean("shared_publicly").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("veins_user_id_idx").on(table.userId),
    createdAtIdx: index("veins_created_at_idx").on(table.createdAt),
  })
);

export type Vein = InferSelectModel<typeof veins>;
