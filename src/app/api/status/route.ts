import { requireAuth } from "@/lib/auth";
import { getStatus, type BotStatusRow } from "@/lib/poller";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const rows = await getStatus();

  const bots = rows.map((row: BotStatusRow) => ({
    id: row.botId,
    name: row.botName,
    type: row.botType,
    status: row.status,
    health: row.health,
    details: row.details ?? null,
    last_line: row.lastLine ?? null,
    last_modified: row.lastModified?.toISOString() ?? null,
    last_polled: row.lastPolled.toISOString(),
    last_checked: row.lastPolled.toISOString(),
    error: row.errorMsg ?? null,
  }));

  return Response.json({
    bots,
    polled_at: new Date().toISOString(),
  });
}
