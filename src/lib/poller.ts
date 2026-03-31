import { db, dbAvailable } from "./db";
import { botStatusCache } from "./schema";
import { count, lt, eq } from "drizzle-orm";
import { BOTS, type BotConfig } from "./config";

const STALE_SECONDS = 60;

const STATUS_TO_HEALTH: Record<string, string> = {
  online: "healthy",
  offline: "down",
  timeout: "down",
  error: "down",
  unhealthy: "degraded",
  no_log: "down",
  pending: "unknown",
  local: "local",
  unknown: "unknown",
};

interface BotPollResult {
  status: string;
  health?: unknown;
  details?: unknown;
  lastLine?: string;
  lastModified?: Date;
  errorMsg?: string;
}

// Shape that matches what the status route expects, whether from DB or direct poll
export interface BotStatusRow {
  botId: string;
  botName: string;
  botType: string;
  status: string;
  health: string;
  details: unknown;
  lastLine: string | null;
  lastModified: Date | null;
  lastPolled: Date;
  errorMsg: string | null;
}

async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function pollRemoteBot(bot: BotConfig): Promise<BotPollResult> {
  const result: BotPollResult = { status: "unknown" };

  // Health check
  try {
    const healthUrl = bot.url! + bot.healthPath!;
    const resp = await fetchWithTimeout(healthUrl, {}, 5000);
    if (resp.ok) {
      result.status = "online";
      const ct = resp.headers.get("content-type") ?? "";
      result.health = ct.includes("application/json") ? await resp.json() : { ok: true };
    } else {
      result.status = "unhealthy";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      result.status = "timeout";
    } else {
      result.status = "offline";
    }
    return result;
  }

  // Status endpoint (if available)
  if (bot.statusPath) {
    try {
      const secret = bot.secret;
      const statusUrl = `${bot.url}${bot.statusPath}${secret ? `?secret=${secret}` : ""}`;
      const resp = await fetchWithTimeout(statusUrl, {}, 10000);
      if (resp.ok) {
        result.details = await resp.json();
      }
    } catch {
      // Ignore status endpoint errors — health is already recorded
    }
  }

  return result;
}

function localBotResult(): BotPollResult {
  // Local bots cannot be polled from Railway (Linux). Return a neutral status.
  return { status: "local" };
}

async function pollAllBots(): Promise<void> {
  const now = new Date().toISOString();

  for (const bot of BOTS) {
    let pollResult: BotPollResult;

    try {
      if (bot.type === "remote") {
        pollResult = await pollRemoteBot(bot);
      } else {
        // Local bots: on Railway (non-Windows) we can't read the filesystem
        if (process.platform !== "win32") {
          pollResult = localBotResult();
        } else {
          // On Windows (local dev), we could attempt to read the log file,
          // but for simplicity we return the same local status.
          pollResult = localBotResult();
        }
      }
    } catch (err: unknown) {
      pollResult = {
        status: "error",
        errorMsg: err instanceof Error ? err.message : String(err),
      };
    }

    const health =
      bot.type === "local"
        ? "local"
        : (STATUS_TO_HEALTH[pollResult.status] ?? "unknown");

    await db!.insert(botStatusCache).values({
      botId: bot.id,
      botName: bot.name,
      botType: bot.type,
      status: pollResult.status,
      health,
      details: pollResult.details != null ? JSON.stringify(pollResult.details) : null,
      lastLine: pollResult.lastLine ?? null,
      lastModified: pollResult.lastModified ? pollResult.lastModified.toISOString() : null,
      lastPolled: now,
      errorMsg: pollResult.errorMsg ?? null,
    }).onConflictDoUpdate({
      target: botStatusCache.botId,
      set: {
        botName: bot.name,
        botType: bot.type,
        status: pollResult.status,
        health,
        details: pollResult.details != null ? JSON.stringify(pollResult.details) : null,
        lastLine: pollResult.lastLine ?? null,
        lastModified: pollResult.lastModified ? pollResult.lastModified.toISOString() : null,
        lastPolled: now,
        errorMsg: pollResult.errorMsg ?? null,
      },
    });
  }
}

async function ensureFreshStatus(): Promise<void> {
  const staleThreshold = new Date(Date.now() - STALE_SECONDS * 1000);

  // Check if we have any rows at all, or if any row is stale
  const staleResult = await db!.select({ count: count() }).from(botStatusCache).where(lt(botStatusCache.lastPolled, staleThreshold.toISOString()));
  const staleCount = staleResult[0]?.count ?? 0;

  const totalResult = await db!.select({ count: count() }).from(botStatusCache);
  const totalCount = totalResult[0]?.count ?? 0;

  if (staleCount > 0 || totalCount === 0) {
    await pollAllBots();
  }
}

// Poll bots directly without DB caching (used when DB is unavailable)
async function pollAllBotsDirectly(): Promise<BotStatusRow[]> {
  const now = new Date();
  const results: BotStatusRow[] = [];

  for (const bot of BOTS) {
    let pollResult: BotPollResult;

    try {
      if (bot.type === "remote") {
        pollResult = await pollRemoteBot(bot);
      } else {
        pollResult = localBotResult();
      }
    } catch (err: unknown) {
      pollResult = {
        status: "error",
        errorMsg: err instanceof Error ? err.message : String(err),
      };
    }

    const health =
      bot.type === "local"
        ? "local"
        : (STATUS_TO_HEALTH[pollResult.status] ?? "unknown");

    results.push({
      botId: bot.id,
      botName: bot.name,
      botType: bot.type,
      status: pollResult.status,
      health,
      details: pollResult.details ?? null,
      lastLine: pollResult.lastLine ?? null,
      lastModified: pollResult.lastModified ?? null,
      lastPolled: now,
      errorMsg: pollResult.errorMsg ?? null,
    });
  }

  return results;
}

export async function getStatus(): Promise<BotStatusRow[]> {
  if (!dbAvailable) {
    // No DB — poll bots directly on each request
    return pollAllBotsDirectly();
  }

  await ensureFreshStatus();
  const rows = await db!.select().from(botStatusCache);
  return rows.map((row) => ({
    ...row,
    details: row.details != null ? JSON.parse(row.details) : null,
    lastModified: row.lastModified ? new Date(row.lastModified) : null,
    lastPolled: new Date(row.lastPolled),
  }));
}
