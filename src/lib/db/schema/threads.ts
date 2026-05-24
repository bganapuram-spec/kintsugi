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

export const threads = pgTable(
  "threads",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    anonymizedNarrative: text("anonymized_narrative").notNull(),
    resonanceCount: integer("resonance_count").notNull().default(0),
    reported: boolean("reported").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("threads_created_at_idx").on(table.createdAt),
    reportedIdx: index("threads_reported_idx").on(table.reported),
  })
);

export type Thread = InferSelectModel<typeof threads>;

// Junction: track which user resonated with which thread (one per user per thread)
export const threadResonances = pgTable(
  "thread_resonances",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    threadId: varchar("thread_id", { length: 128 })
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueIdx: index("thread_resonances_unique_idx").on(
      table.threadId,
      table.userId
    ),
  })
);

export type ThreadResonance = InferSelectModel<typeof threadResonances>;
