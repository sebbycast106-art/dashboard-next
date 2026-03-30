import { prisma, dbAvailable } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!dbAvailable) {
    return Response.json({ ok: false, error: "no_database" }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Accept secret from query param or body
  const url = new URL(request.url);
  const secret =
    url.searchParams.get("secret") ??
    (typeof body.secret === "string" ? body.secret : "");

  const expectedSecret = process.env.SCHEDULER_SECRET ?? "";
  if (!expectedSecret || secret !== expectedSecret) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const bot = typeof body.bot === "string" ? body.bot : "coop";
  const rawData = (typeof body.data === "object" && body.data !== null ? body.data : {}) as Record<string, unknown>;
  rawData.pushed_at = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = rawData as any;

  await prisma!.automationCache.upsert({
    where: { botKey: bot },
    update: { data, pushedAt: new Date() },
    create: { botKey: bot, data, pushedAt: new Date() },
  });

  return Response.json({ ok: true });
}
