import type { InferSelectModel } from "drizzle-orm";
import { index, json, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull().default("New conversation"),
    messages: json("messages").$type<Array<{ role: string; content: string }>>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("chat_sessions_user_id_idx").on(table.userId),
    createdAtIdx: index("chat_sessions_created_at_idx").on(table.createdAt),
  })
);

export type ChatSession = InferSelectModel<typeof chatSessions>;
