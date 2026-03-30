import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const now = new Date().toISOString();

  // Try pushed cache from DB (coop bot)
  const cached = await prisma.automationCache.findUnique({
    where: { botKey: "coop" },
  });

  if (cached) {
    const data = cached.data as Record<string, unknown>;
    return Response.json({
      ...data,
      fetched_at: now,
    });
  }

  // No data available (Railway without a push yet)
  return Response.json({
    scraper: { last_run: null, ok: null, exit_code: null },
    jobs: { total: 0, high_score: 0, alerted: 0 },
    fetched_at: now,
    _source: "no_data",
  });
}
