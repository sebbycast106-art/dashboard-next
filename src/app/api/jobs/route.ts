import { requireAuth } from "@/lib/auth";
import { getLinkedInBotUrl, getLinkedInBotSecret } from "@/lib/config";
import { NextRequest } from "next/server";

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const STATUS_VALUES = [
  "seen",
  "applied",
  "responded",
  "interview",
  "offer",
  "rejected",
] as const;

type AppStatus = (typeof STATUS_VALUES)[number];

interface RawApplication {
  job_id: string;
  company: string;
  title: string;
  url?: string;
  applied_at?: string;
  status: string;
  source?: string;
  score?: number | null;
  notes?: string | null;
}

interface MappedApplication {
  id: string;
  company: string;
  title: string;
  status: AppStatus;
  url: string;
  applied_at: string | null;
  source: string;
  score: number | null;
  notes: string | null;
}

interface JobsResponse {
  applications: MappedApplication[];
  total: number;
  by_status: Record<AppStatus, number>;
}

function mapApplication(raw: RawApplication): MappedApplication {
  const validStatuses = new Set<string>(STATUS_VALUES);
  const status: AppStatus = validStatuses.has(raw.status)
    ? (raw.status as AppStatus)
    : "seen";

  return {
    id: raw.job_id,
    company: raw.company,
    title: raw.title,
    status,
    url: raw.url ?? "",
    applied_at: raw.applied_at ?? null,
    source: raw.source ?? "linkedin",
    score: raw.score ?? null,
    notes: raw.notes ?? null,
  };
}

function buildByStatus(apps: MappedApplication[]): Record<AppStatus, number> {
  const counts: Record<AppStatus, number> = {
    seen: 0,
    applied: 0,
    responded: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };
  for (const app of apps) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }
  return counts;
}

// GET /api/jobs — list all tracked applications
export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const botUrl = getLinkedInBotUrl();
  const secret = getLinkedInBotSecret();
  const url = `${botUrl}/internal/applications${secret ? `?secret=${secret}` : ""}`;

  let resp: Response;
  try {
    resp = await fetchWithTimeout(url);
  } catch {
    const body: JobsResponse = {
      applications: [],
      total: 0,
      by_status: {
        seen: 0,
        applied: 0,
        responded: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      },
    };
    return Response.json({ ...body, error: "bot_unreachable" });
  }

  if (resp.status === 403) {
    const body: JobsResponse = {
      applications: [],
      total: 0,
      by_status: {
        seen: 0,
        applied: 0,
        responded: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      },
    };
    return Response.json({ ...body, error: "bad_secret" });
  }

  if (!resp.ok) {
    const body: JobsResponse = {
      applications: [],
      total: 0,
      by_status: {
        seen: 0,
        applied: 0,
        responded: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
      },
    };
    return Response.json({ ...body, error: `upstream_${resp.status}` });
  }

  const raw = await resp.json();
  // Bot returns either an array or { applications: [] }
  const rawApps: RawApplication[] = Array.isArray(raw)
    ? raw
    : (raw.applications ?? []);

  const applications = rawApps.map(mapApplication);

  const result: JobsResponse = {
    applications,
    total: applications.length,
    by_status: buildByStatus(applications),
  };

  return Response.json(result);
}

// POST /api/jobs/track — manually add a job
// Defined here to avoid a collision; also exposed at /api/jobs/track via [id]/route.ts
// Actually we keep it here since Next.js will route POST /api/jobs to this handler
// The /track sub-path is handled in [id]/route.ts
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const botUrl = getLinkedInBotUrl();
  const secret = getLinkedInBotSecret();
  const url = `${botUrl}/internal/track-application${secret ? `?secret=${secret}` : ""}`;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  let resp: Response;
  try {
    resp = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return Response.json({ error: "bot_unreachable" });
  }

  if (resp.status === 403) {
    return Response.json({ error: "bad_secret" });
  }

  const data = await resp.json().catch(() => ({}));
  return Response.json(data);
}
