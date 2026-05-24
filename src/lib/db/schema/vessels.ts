import type { InferSelectModel } from "drizzle-orm";
import { index, integer, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const vessels = pgTable(
  "vessels",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vesselNumber: integer("vessel_number").notNull().default(1),
    wisdom: text("wisdom").notNull(),
    veinIds: json("vein_ids").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("vessels_user_id_idx").on(table.userId),
    createdAtIdx: index("vessels_created_at_idx").on(table.createdAt),
  })
);

export type Vessel = InferSelectModel<typeof vessels>;
