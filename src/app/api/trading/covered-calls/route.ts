import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db, dbAvailable } from "@/lib/db";
import { automationCache } from "@/lib/schema";

// Empty shape returned before the Python bot has pushed anything (or when the
// DB is unavailable). Matches the dashboard push payload contract so the page
// can render a friendly empty state without special-casing nulls everywhere.
function emptyPayload() {
  return {
    generated_at: null,
    as_of: null,
    risk_free: null,
    stale: false,
    brief: "",
    flags: [] as string[],
    recommendations: [] as unknown[],
    performance: {
      premium_collected_to_date: 0,
      spy_return: null,
      buyhold_return: null,
    },
  };
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const now = new Date().toISOString();

  if (!dbAvailable) {
    return Response.json({
      ...emptyPayload(),
      unavailable: true,
      fetched_at: now,
    });
  }

  // Pushed cache from the covered-call bot (botKey "covered_calls").
  const rows = db
    ? await db.select().from(automationCache).where(eq(automationCache.botKey, "covered_calls"))
    : [];
  const cached = rows[0];

  if (cached) {
    try {
      const data = JSON.parse(cached.data) as Record<string, unknown>;
      return Response.json({ ...data, fetched_at: now });
    } catch {
      // Corrupt cached blob — degrade to the empty state, never 500 the tab.
      return Response.json({
        ...emptyPayload(),
        stale: true,
        fetched_at: now,
        _source: "parse_error",
      });
    }
  }

  // No push yet (e.g. fresh Railway deploy).
  return Response.json({
    ...emptyPayload(),
    fetched_at: now,
    _source: "no_data",
  });
}
