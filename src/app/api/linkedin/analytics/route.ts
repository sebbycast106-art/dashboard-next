import { requireAuth } from "@/lib/auth";
import { getLinkedInBotUrl, getLinkedInBotSecret } from "@/lib/config";

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function secretParam(secret: string): string {
  return secret ? `?secret=${secret}` : "";
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const botUrl = getLinkedInBotUrl();
  const secret = getLinkedInBotSecret();
  const result: Record<string, unknown> = {};

  // Fetch live analytics
  try {
    const resp = await fetchWithTimeout(
      `${botUrl}/internal/analytics${secretParam(secret)}`
    );
    if (resp.ok) {
      result.analytics = await resp.json();
    } else {
      result.analytics_error = `upstream ${resp.status}`;
    }
  } catch (err: unknown) {
    result.analytics_error = err instanceof Error ? err.message : String(err);
  }

  // Fetch warmth scores
  try {
    const resp = await fetchWithTimeout(
      `${botUrl}/internal/warmth-scores${secretParam(secret)}`
    );
    if (resp.ok) {
      result.warmth = await resp.json();
    } else {
      result.warmth_error = `upstream ${resp.status}`;
    }
  } catch (err: unknown) {
    result.warmth_error = err instanceof Error ? err.message : String(err);
  }

  return Response.json(result);
}
