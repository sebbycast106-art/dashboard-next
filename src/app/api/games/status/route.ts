import { requireAuth } from "@/lib/auth";
import { prisma, dbAvailable } from "@/lib/prisma";

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
  const todayDate = new Date(today + "T00:00:00.000Z");

  const rows = await prisma!.gamesCompletion.findMany({
    where: { completedDate: todayDate },
  });

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
