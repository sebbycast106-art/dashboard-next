import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, dbAvailable } from "@/lib/db";
import { automationCache } from "@/lib/schema";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const now = new Date().toISOString();

  if (!dbAvailable) {
    return Response.json({
      scraper: null,
      jobs: null,
      unavailable: true,
      fetched_at: now,
    });
  }

  // Try pushed cache from DB (coop bot)
  const rows = db
    ? await db.select().from(automationCache).where(eq(automationCache.botKey, "coop"))
    : [];
  const cached = rows[0];

  if (cached) {
    try {
      const data = JSON.parse(cached.data) as Record<string, unknown>;
      return Response.json({ ...data, fetched_at: now });
    } catch {
      // Corrupt cached blob — degrade gracefully instead of 500.
      return Response.json({
        scraper: { last_run: null, ok: null, exit_code: null },
        jobs: { total: 0, high_score: 0, alerted: 0 },
        fetched_at: now,
        _source: "parse_error",
      });
    }
  }

  // No data available (Railway without a push yet)
  return Response.json({
    scraper: { last_run: null, ok: null, exit_code: null },
    jobs: { total: 0, high_score: 0, alerted: 0 },
    fetched_at: now,
    _source: "no_data",
  });
}
