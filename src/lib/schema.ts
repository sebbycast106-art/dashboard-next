import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const gamesCompletions = sqliteTable("games_completions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: text("game_id").notNull(),
  completedDate: text("completed_date").notNull(),
  streak: integer("streak").notNull().default(1),
  lastPlayed: text("last_played").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const botStatusCache = sqliteTable("bot_status_cache", {
  botId: text("bot_id").primaryKey(),
  botName: text("bot_name").notNull(),
  botType: text("bot_type").notNull(),
  status: text("status").notNull(),
  health: text("health").notNull(),
  details: text("details"),
  lastLine: text("last_line"),
  lastModified: text("last_modified"),
  lastPolled: text("last_polled").notNull().default(sql`(datetime('now'))`),
  errorMsg: text("error_msg"),
});

export const automationCache = sqliteTable("automation_cache", {
  botKey: text("bot_key").primaryKey(),
  data: text("data").notNull(),
  pushedAt: text("pushed_at").notNull().default(sql`(datetime('now'))`),
});
