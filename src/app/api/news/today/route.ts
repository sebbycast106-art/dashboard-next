import { requireAuth } from "@/lib/auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  // News requires local Windows automations path — not available on Railway
  return Response.json({
    items: [],
    fetched_at: null,
    count: 0,
    unavailable: true,
  });
}
