import { requireAuth } from "@/lib/auth";
import { getLinkedInBotUrl, getLinkedInBotSecret } from "@/lib/config";
import { StatusUpdateSchema } from "@/lib/schemas";

// PATCH /api/jobs/:id/status
// Body: { status: "seen" | "applied" | "responded" | "interview" | "offer" | "rejected" | "archived" }
// Proxies to linkedin-bot /internal/track-application
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = StatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_status" }, { status: 400 });
  }
  const { status } = parsed.data;

  const url = `${getLinkedInBotUrl()}/internal/track-application?secret=${getLinkedInBotSecret()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: id, status }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await resp.json().catch(() => ({}));
    return Response.json({ ok: resp.ok, ...data });
  } catch {
    clearTimeout(timer);
    return Response.json({ ok: false, error: "bot_unreachable" });
  }
}
