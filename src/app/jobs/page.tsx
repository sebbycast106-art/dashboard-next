"use client";

import { useState, useMemo } from "react";
import { usePolling } from "@/hooks/usePolling";
import Layout from "@/components/Layout";

// ── Types ──────────────────────────────────────────────────────────────────

interface Job {
  job_id: string;
  company: string;
  title: string;
  url?: string;
  source?: string;
  status: "seen" | "applied" | "responded" | "interview" | "offer" | "rejected";
  applied_at?: string;
  score?: number;
  follow_up_sent?: boolean;
}

type StatusFilter =
  | "all"
  | "seen"
  | "applied"
  | "responded"
  | "interview"
  | "offer"
  | "rejected";

// ── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatUpdatedAt(isoString?: string): string {
  if (!isoString) return "never";
  try {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const lower = source.toLowerCase();

  if (lower.includes("linkedin")) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1d4ed8]/20 text-[#60a5fa] border border-[#1d4ed8]/30">
        🔵 LinkedIn
      </span>
    );
  }
  if (lower.includes("simplify")) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#7c3aed]/20 text-[#c4b5fd] border border-[#7c3aed]/30">
        🟣 Simplify
      </span>
    );
  }
  if (lower.includes("handshake")) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#d97706]/20 text-[#fbbf24] border border-[#d97706]/30">
        🟡 Handshake
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#334155] text-[#94a3b8] border border-[#475569]/30">
      {source}
    </span>
  );
}

function StatusBadge({ status }: { status: Job["status"] }) {
  const map: Record<Job["status"], { label: string; className: string }> = {
    seen:       { label: "Seen",       className: "bg-[#334155] text-[#94a3b8] border-[#475569]/30" },
    applied:    { label: "Applied",    className: "bg-[#1d4ed8]/20 text-[#60a5fa] border-[#1d4ed8]/30" },
    responded:  { label: "Responded",  className: "bg-[#d97706]/20 text-[#fbbf24] border-[#d97706]/30" },
    interview:  { label: "Interview",  className: "bg-[#16a34a]/20 text-[#4ade80] border-[#16a34a]/30" },
    offer:      { label: "Offer",      className: "bg-[#059669]/20 text-[#34d399] border-[#059669]/30" },
    rejected:   { label: "Rejected",   className: "bg-[#dc2626]/20 text-[#f87171] border-[#dc2626]/30" },
  };
  const { label, className } = map[status] ?? map.seen;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${className}`}>
      {label}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8 ? "bg-[#16a34a]/20 text-[#4ade80] border-[#16a34a]/30" :
    score >= 6 ? "bg-[#d97706]/20 text-[#fbbf24] border-[#d97706]/30" :
                 "bg-[#dc2626]/20 text-[#f87171] border-[#dc2626]/30";
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono ${color}`}>
      {score}/10
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function JobsPage() {
  const { data, loading, error } = usePolling("/jobs", 120000);

  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const jobs: Job[] = useMemo(() => data?.applications ?? data?.jobs ?? [], [data]);
  const updatedAt: string | undefined = data?.updated_at ?? data?.fetched_at;

  // ── Stats ────────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const c = {
      all: jobs.length,
      seen: 0,
      applied: 0,
      responded: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const j of jobs) {
      if (j.status in c) c[j.status as keyof typeof c]++;
    }
    return c;
  }, [jobs]);

  const responseRate = useMemo(() => {
    if (!counts.applied) return null;
    const responded = counts.responded + counts.interview + counts.offer;
    return Math.round((responded / counts.applied) * 100);
  }, [counts]);

  // ── Filtered list ────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = jobs;
    if (activeFilter !== "all") {
      list = list.filter((j) => j.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, activeFilter, search]);

  // ── Filter pills ─────────────────────────────────────────────────────────

  const filterPills: { key: StatusFilter; label: string }[] = [
    { key: "all",       label: `All (${counts.all})` },
    { key: "applied",   label: `Applied (${counts.applied})` },
    { key: "interview", label: `Interview (${counts.interview})` },
    { key: "responded", label: `Responded (${counts.responded})` },
    { key: "offer",     label: `Offer (${counts.offer})` },
    { key: "rejected",  label: `Rejected (${counts.rejected})` },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              📋 JOBS
            </h1>
            <p className="text-sm text-[#94a3b8] mt-0.5 font-mono">
              {counts.all} total
              {updatedAt && (
                <span className="text-[#475569]"> · updated {formatUpdatedAt(updatedAt)}</span>
              )}
            </p>
          </div>
          {loading && (
            <span className="text-xs text-[#475569] animate-pulse mt-1">Fetching…</span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 p-4 text-sm">
            Failed to load jobs: {error}
          </div>
        )}

        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "TOTAL SEEN",     value: counts.seen,     color: "#94a3b8" },
              { label: "APPLIED",        value: counts.applied,  color: "#60a5fa" },
              { label: "RESPONSE RATE",  value: responseRate != null ? `${responseRate}%` : "—", color: "#fbbf24" },
              { label: "INTERVIEWS",     value: counts.interview, color: "#4ade80" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="relative rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden flex"
              >
                <div className="w-1 flex-shrink-0 self-stretch rounded-l-xl" style={{ backgroundColor: color }} />
                <div className="flex-1 p-3 flex flex-col gap-1">
                  <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest leading-tight">
                    {label}
                  </p>
                  <p className="text-2xl font-black text-white font-mono leading-none">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {filterPills.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                activeFilter === key
                  ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/40"
                  : "bg-[#1e293b] text-[#94a3b8] border-[#334155] hover:text-white hover:border-[#475569]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or job title…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#334155] bg-[#1e293b] text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#4ade80]/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#334155] bg-[#1e293b] h-20 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 text-center">
            <p className="text-[#475569] text-sm">
              {jobs.length === 0
                ? "No jobs yet — run the Job Scraper from Controls to fetch listings"
                : "No jobs match your filters"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((job) => (
              <div
                key={job.job_id}
                className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4 flex items-start gap-4 hover:border-[#475569] transition-colors"
              >
                {/* Left accent line by status */}
                <div
                  className="w-1 flex-shrink-0 self-stretch rounded-full"
                  style={{
                    backgroundColor:
                      job.status === "offer"     ? "#34d399" :
                      job.status === "interview" ? "#4ade80" :
                      job.status === "responded" ? "#fbbf24" :
                      job.status === "applied"   ? "#60a5fa" :
                      job.status === "rejected"  ? "#f87171" :
                      "#475569",
                  }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-bold text-white leading-tight">
                        {job.company}
                      </p>
                      <p className="text-sm text-[#94a3b8] mt-0.5 leading-snug">
                        {job.title}
                      </p>
                    </div>

                    {/* Apply button — only for "seen" status */}
                    {job.status === "seen" && job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30 hover:bg-[#4ade80]/20 transition-colors"
                      >
                        Apply →
                      </a>
                    )}
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <StatusBadge status={job.status} />
                    <SourceBadge source={job.source} />
                    {job.score != null && <ScoreBadge score={job.score} />}
                    {job.applied_at && (
                      <span className="text-[10px] text-[#475569] font-mono">
                        {timeAgo(job.applied_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <p className="text-xs text-[#475569] text-center font-mono pb-2">
            Showing {filtered.length} of {jobs.length} jobs · polling every 2m
          </p>
        )}
      </div>
    </Layout>
  );
}
