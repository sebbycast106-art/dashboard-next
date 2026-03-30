import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept both gameId and game_id for compatibility
  const gameId =
    typeof body.gameId === "string"
      ? body.gameId.trim()
      : typeof body.game_id === "string"
      ? body.game_id.trim()
      : "";

  if (!gameId) {
    return Response.json({ error: "gameId required" }, { status: 400 });
  }

  const today = todayUTC();
  const yesterday = yesterdayUTC();
  const todayDate = new Date(today + "T00:00:00.000Z");
  const yesterdayDate = new Date(yesterday + "T00:00:00.000Z");

  // Check if already completed today — idempotent
  const existing = await prisma.gamesCompletion.findUnique({
    where: { gameId_completedDate: { gameId, completedDate: todayDate } },
  });

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
  const prev = await prisma.gamesCompletion.findUnique({
    where: { gameId_completedDate: { gameId, completedDate: yesterdayDate } },
  });

  const newStreak = prev ? prev.streak + 1 : 1;
  const lastPlayed = nowStr();

  const record = await prisma.gamesCompletion.upsert({
    where: { gameId_completedDate: { gameId, completedDate: todayDate } },
    update: { streak: newStreak, lastPlayed },
    create: {
      gameId,
      completedDate: todayDate,
      streak: newStreak,
      lastPlayed,
    },
  });

  return Response.json({
    status: {
      completed: true,
      inProgress: false,
      date: today,
      streak: record.streak,
      lastPlayed: record.lastPlayed,
    },
    date: today,
  });
}
