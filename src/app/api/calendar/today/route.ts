import { requireAuth } from "@/lib/auth";
import { getAssistantBotUrl, getAssistantBotSecret } from "@/lib/config";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const botUrl = getAssistantBotUrl();
  const secret = getAssistantBotSecret();
  const secretSuffix = secret ? `?secret=${secret}` : "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(
      `${botUrl}/internal/calendar-today${secretSuffix}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json();
      return Response.json(data);
    }
    return Response.json({ events: [], error: `upstream ${resp.status}` });
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ events: [], error: msg });
  }
}
