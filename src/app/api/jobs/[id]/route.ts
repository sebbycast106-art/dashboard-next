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

// GET /api/jobs/[id] — fetch a single application by job_id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // Special sub-path: /api/jobs/track is handled by POST below.
  // For GET we always treat the segment as a job ID.
  const botUrl = getLinkedInBotUrl();
  const secret = getLinkedInBotSecret();
  const listUrl = `${botUrl}/internal/applications${secret ? `?secret=${secret}` : ""}`;

  let resp: Response;
  try {
    resp = await fetchWithTimeout(listUrl);
  } catch {
    return Response.json({ error: "bot_unreachable" });
  }

  if (resp.status === 403) {
    return Response.json({ error: "bad_secret" });
  }

  if (!resp.ok) {
    return Response.json({ error: `upstream_${resp.status}` });
  }

  const raw = await resp.json();
  const rawApps: RawApplication[] = Array.isArray(raw)
    ? raw
    : (raw.applications ?? []);

  const match = rawApps.find((a) => a.job_id === id);
  if (!match) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json(mapApplication(match));
}

// POST /api/jobs/track — manually track a new application
// Next.js routes /api/jobs/track to this file with id="track"
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  if (id !== "track") {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

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
