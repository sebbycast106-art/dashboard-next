import { requireAuth } from "@/lib/auth";
import { db, dbAvailable } from "@/lib/db";
import { gamesCompletions } from "@/lib/schema";
import { eq } from "drizzle-orm";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!dbAvailable) {
    return Response.json({ status: {}, unavailable: true });
  }

  const today = todayUTC();

  const rows = db ? await db.select().from(gamesCompletions).where(eq(gamesCompletions.completedDate, today)) : [];

  const status: Record<string, unknown> = {};
  for (const row of rows) {
    status[row.gameId] = {
      completed: true,
      inProgress: false,
      date: today,
      streak: row.streak,
      lastPlayed: row.lastPlayed,
    };
  }

  return Response.json({ status, date: today });
}
