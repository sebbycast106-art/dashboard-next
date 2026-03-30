import { requireAuth } from "@/lib/auth";
import { LINKEDIN_SERVICES, getLinkedInBotUrl, getLinkedInBotSecret } from "@/lib/config";

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id: serviceId } = await params;

  const service = LINKEDIN_SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    return Response.json({ error: `Unknown service: ${serviceId}` }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    // Empty or non-JSON body is fine
  }

  // Remap generic "input" key to service-specific key (e.g. "code" for verify)
  if (service.input_key && "input" in body) {
    body = { [service.input_key]: body.input };
  }

  const botUrl = getLinkedInBotUrl();
  const secret = getLinkedInBotSecret();
  const secretSuffix = secret ? `?secret=${secret}` : "";
  const url = `${botUrl}/internal/${serviceId}${secretSuffix}`;

  try {
    const resp = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      },
      30000
    );

    let data: unknown;
    try {
      data = await resp.json();
    } catch {
      data = { raw: await resp.text().catch(() => "") };
    }

    const statusCode = resp.status < 500 ? resp.status : 502;
    return Response.json({ status_code: resp.status, result: data }, { status: statusCode });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      return Response.json({ error: "Request timed out (30s)" }, { status: 504 });
    }
    if (msg.includes("fetch") || msg.includes("connect") || msg.includes("ECONNREFUSED")) {
      return Response.json({ error: "Could not connect to LinkedIn Bot" }, { status: 502 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
}
