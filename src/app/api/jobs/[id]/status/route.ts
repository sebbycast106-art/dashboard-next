import { requireAuth } from "@/lib/auth";
import { getLinkedInBotUrl, getLinkedInBotSecret } from "@/lib/config";

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
  const body = await request.json();
  const { status } = body;

  const validStatuses = [
    "seen",
    "applied",
    "responded",
    "interview",
    "offer",
    "rejected",
    "archived",
  ];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "invalid_status" }, { status: 400 });
  }

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
