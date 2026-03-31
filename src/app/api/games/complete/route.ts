import { requireAuth } from "@/lib/auth";
import { db, dbAvailable } from "@/lib/db";
import { gamesCompletions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { GameCompleteSchema } from "@/lib/schemas";

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nowStr(): string {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const day = now.getUTCDate();
  let hour = now.getUTCHours() % 12;
  if (hour === 0) hour = 12;
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const ampm = now.getUTCHours() < 12 ? "AM" : "PM";
  return `${month} ${day}, ${hour}:${min} ${ampm}`;
}

export async function POST(request: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  if (!dbAvailable) {
    return Response.json({ error: "Database not configured" }, { status: 503 });
  }

  const rawBody = await request.json().catch(() => ({}));
  const parsed = GameCompleteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json({ error: "invalid_input" }, { status: 400 });
  }

  const gameId = (parsed.data.gameId ?? parsed.data.game_id ?? "").trim();

  if (!gameId) {
    return Response.json({ error: "gameId required" }, { status: 400 });
  }

  const today = todayUTC();
  const yesterday = yesterdayUTC();

  // Check if already completed today — idempotent
  const existingRows = await db!.select().from(gamesCompletions).where(
    and(eq(gamesCompletions.gameId, gameId), eq(gamesCompletions.completedDate, today))
  );
  const existing = existingRows[0];

  if (existing) {
    return Response.json({
      status: {
        completed: true,
        inProgress: false,
        date: today,
        streak: existing.streak,
        lastPlayed: existing.lastPlayed,
      },
      date: today,
    });
  }

  // Look up yesterday's streak
  const prevRows = await db!.select().from(gamesCompletions).where(
    and(eq(gamesCompletions.gameId, gameId), eq(gamesCompletions.completedDate, yesterday))
  );
  const prev = prevRows[0];

  const newStreak = prev ? prev.streak + 1 : 1;
  const lastPlayed = nowStr();

  await db!.insert(gamesCompletions)
    .values({ gameId, completedDate: today, streak: newStreak, lastPlayed })
    .onConflictDoUpdate({
      target: [gamesCompletions.gameId, gamesCompletions.completedDate],
      set: { streak: newStreak, lastPlayed }
    });

  return Response.json({
    status: {
      completed: true,
      inProgress: false,
      date: today,
      streak: newStreak,
      lastPlayed,
    },
    date: today,
  });
}
