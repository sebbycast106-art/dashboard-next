import { requireAuth } from "@/lib/auth";
import { getLinkedInBotUrl, getLinkedInBotSecret } from "@/lib/config";

export async function POST() {
  const authError = await requireAuth();
  if (authError) return authError;

  const botUrl = getLinkedInBotUrl();
  const secret = getLinkedInBotSecret();
  const secretSuffix = secret ? `?secret=${secret}` : "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(`${botUrl}/internal/warmup-reset${secretSuffix}`, {
      method: "POST",
      signal: controller.signal,
    });
    clearTimeout(timer);

    let data: unknown;
    try {
      data = await resp.json();
    } catch {
      data = { raw: await resp.text().catch(() => "") };
    }

    return Response.json(data, { status: resp.status });
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
