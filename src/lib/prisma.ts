import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  try {
    const dbUrl = process.env.DATABASE_URL ?? "file:./dashboard.db";
    // Strip the "file:" prefix that SQLite URL format uses
    const dbPath = dbUrl.replace(/^file:/, "");
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
