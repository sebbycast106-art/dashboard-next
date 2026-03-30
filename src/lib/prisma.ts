import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import BetterSqlite3 from "better-sqlite3";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | null;
  sqliteDb: BetterSqlite3.Database | null;
};

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
);
`;

function createPrismaClient(): PrismaClient | null {
  try {
    const dbUrl = process.env.DATABASE_URL ?? "file:./dashboard.db";
    const dbPath = dbUrl.replace(/^file:/, "");

    // Create/open the SQLite file and bootstrap the schema
    const db = new BetterSqlite3(dbPath);
    db.exec(INIT_SQL);

    // Store raw db handle for reuse (singleton)
    globalForPrisma.sqliteDb = db;

    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
  } catch (err) {
    console.error("[prisma] Failed to initialise SQLite client:", err);
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const dbAvailable = !!prisma;
