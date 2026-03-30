import { requireAuth } from "@/lib/auth";
import { getStatus } from "@/lib/poller";

interface ActivityEvent {
  bot: string;
  bot_id: string;
  type: string;
  action?: string;
  count?: number;
  message?: string;
  timestamp: string | null;
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const rows = await getStatus();
  const events: ActivityEvent[] = [];
  const now = new Date().toISOString();

  for (const row of rows) {
    const botName = row.botName;
    const botId = row.botId;
    const lastPolled = row.lastPolled.toISOString();

    // LinkedIn bot: extract todayCounts from cached details
    if (botId === "linkedin-bot" && row.details) {
      const details = row.details as Record<string, unknown>;
      const todayCounts =
        (details.todayCounts as Record<string, number> | undefined) ??
        (details.today_counts as Record<string, number> | undefined) ??
        {};

      if (typeof todayCounts === "object" && todayCounts !== null) {
        for (const [action, count] of Object.entries(todayCounts)) {
          if (typeof count === "number" && count > 0) {
            events.push({
              bot: botName,
              bot_id: botId,
              type: "count",
              action,
              count,
              timestamp: lastPolled,
            });
          }
        }
      }

      // Recent activity items
      const recent =
        (details.recentActivity as Array<Record<string, unknown>> | undefined) ??
        (details.recent_activity as Array<Record<string, unknown>> | undefined) ??
        [];

      if (Array.isArray(recent)) {
        for (const item of recent.slice(0, 20)) {
          events.push({
            bot: botName,
            bot_id: botId,
            type: "activity",
            message:
              typeof item.message === "string"
                ? item.message
                : JSON.stringify(item),
            timestamp:
              typeof item.timestamp === "string" ? item.timestamp : lastPolled,
          });
        }
      }
    }

    // Local bots: add last log line as event
    if (row.lastLine) {
      events.push({
        bot: botName,
        bot_id: botId,
        type: "log",
        message: row.lastLine,
        timestamp: row.lastModified?.toISOString() ?? lastPolled,
      });
    }
  }

  // Sort descending by timestamp, return top 50
  events.sort((a, b) => {
    const ta = a.timestamp ?? "";
    const tb = b.timestamp ?? "";
    return tb.localeCompare(ta);
  });

  return Response.json({ events: events.slice(0, 50), fetched_at: now });
}
