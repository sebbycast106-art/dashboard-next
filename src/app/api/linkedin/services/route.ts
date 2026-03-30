import { requireAuth } from "@/lib/auth";
import { LINKEDIN_SERVICES } from "@/lib/config";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  return Response.json({ services: LINKEDIN_SERVICES });
}
