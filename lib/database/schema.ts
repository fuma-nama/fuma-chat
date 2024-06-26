import { InferInsertModel } from "drizzle-orm";
import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const messageTable = pgTable("messages", {
  id: varchar("id", { length: 256 }).notNull().primaryKey(),
  channelId: varchar("channel_id", { length: 256 }).notNull(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const channelTable = pgTable("channels", {
  id: varchar("id", { length: 256 }).primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  ownerId: varchar("owner_id", { length: 256 }).notNull(),
});

export const memberTable = pgTable(
  "members",
  {
    userId: varchar("user_id", { length: 256 }).notNull(),
    channelId: varchar("channel_id", { length: 256 }).notNull(),
    permissions: integer("permissions").default(0).notNull(),
  },
  (table) => ({
    pk: primaryKey({
      name: "members_pk",
      columns: [table.userId, table.channelId],
    }),
  })
);

export const inviteTable = pgTable("invites", {
  channelId: varchar("channel_id", { length: 256 }).notNull(),
  code: varchar("code", { length: 256 }).primaryKey(),
});

export type MessageTable = InferInsertModel<typeof messageTable>;
