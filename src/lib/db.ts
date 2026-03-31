import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DB_PATH = (process.env.DATABASE_URL ?? "file:./dashboard.db").replace(/^file:/, "");

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS games_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id TEXT NOT NULL,
  completed_date TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 1,
  last_played TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(game_id, completed_date)
);
CREATE TABLE IF NOT EXISTS bot_status_cache (
  bot_id TEXT PRIMARY KEY,
  bot_name TEXT NOT NULL,
  bot_type TEXT NOT NULL,
  status TEXT NOT NULL,
  health TEXT NOT NULL,
  details TEXT,
  last_line TEXT,
  last_modified TEXT,
  last_polled TEXT NOT NULL DEFAULT (datetime('now')),
  error_msg TEXT
);
CREATE TABLE IF NOT EXISTS automation_cache (
  bot_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  pushed_at TEXT NOT NULL DEFAULT (datetime('now'))
);`;

function createDb() {
  try {
    const sqlite = new Database(DB_PATH);
    sqlite.exec(INIT_SQL);
    return drizzle(sqlite, { schema });
  } catch (err) {
    console.error("[db] Failed to init SQLite:", err);
    return null;
  }
}

const globalDb = global as unknown as { db: ReturnType<typeof createDb> };
export const db = globalDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalDb.db = db;
export const dbAvailable = !!db;
export type Db = NonNullable<ReturnType<typeof createDb>>;
