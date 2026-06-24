import { timingSafeEqual } from "node:crypto";
import { db, dbAvailable } from "@/lib/db";
import { automationCache } from "@/lib/schema";

// Bot keys are short slugs (e.g. "coop", "covered_calls"). Bound them so an
// authenticated push can't store an arbitrary/oversized key.
const BOT_KEY_RE = /^[a-z0-9_-]{1,40}$/;
// Cap the stored blob. It's a single upserted row per bot (not unbounded growth),
// but a size limit stops a leaked-secret push from storing a huge payload.
const MAX_DATA_BYTES = 512_000;

// Constant-time secret comparison — avoids the byte-by-byte timing side channel
// of `!==`. Fails closed when the expected secret is unset or lengths differ.
function secretsMatch(provided: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!dbAvailable) {
    return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept the secret from a query param or the body (machine-to-machine; no cookie).
  const url = new URL(request.url);
  const secret =
    url.searchParams.get("secret") ?? (typeof body.secret === "string" ? body.secret : "");
  if (!secretsMatch(secret, process.env.SCHEDULER_SECRET ?? "")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Bot key — defaults to "coop" when omitted (preserves the existing coop-bot
  // contract), validated as a bounded slug otherwise.
  const botKey = typeof body.bot === "string" ? body.bot : "coop";
  if (!BOT_KEY_RE.test(botKey)) {
    return Response.json({ error: "Invalid bot key" }, { status: 400 });
  }

  // Data must be a plain object and within the size cap before we persist it.
  if (typeof body.data !== "object" || body.data === null || Array.isArray(body.data)) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }
  const rawData = body.data as Record<string, unknown>;
  if (JSON.stringify(rawData).length > MAX_DATA_BYTES) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }

  rawData.pushed_at = new Date().toISOString();
  const stored = JSON.stringify(rawData);

  await db!
    .insert(automationCache)
    .values({ botKey, data: stored, pushedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: automationCache.botKey,
      set: { data: stored, pushedAt: new Date().toISOString() },
    });

  return Response.json({ ok: true });
}
