import { InferInsertModel } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";

export const messageTable = pgTable("messages", {
  id: varchar("id", { length: 256 }).notNull().primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  content: text("content").notNull(),
});

export type MessageTable = InferInsertModel<typeof messageTable>;
