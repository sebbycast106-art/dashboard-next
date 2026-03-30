"use client";

interface Bot {
  id: string;
  name?: string;
  health: string;
  type?: string;
  last_checked?: string;
  details?: Record<string, any>;
}

interface BotCardProps {
  bot: Bot;
}

const statusColors: Record<string, { dot: string; glow: string }> = {
  healthy: { dot: "bg-[#4ade80]", glow: "shadow-[#4ade80]/20" },
  degraded: { dot: "bg-[#fbbf24]", glow: "shadow-[#fbbf24]/20" },
  manual: { dot: "bg-[#fbbf24]", glow: "shadow-[#fbbf24]/20" },
  down: { dot: "bg-[#ef4444]", glow: "shadow-[#ef4444]/20" },
  local: { dot: "bg-[#60a5fa]", glow: "shadow-[#60a5fa]/20" },
  unknown: { dot: "bg-[#475569]", glow: "" },
};

const statusLabels: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  manual: "Manual",
  down: "Down",
  local: "Local",
  unknown: "Unknown",
};

function timeAgo(ts?: string): string {
  if (!ts) return "never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatKey(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BotCard({ bot }: BotCardProps) {
  const status = statusColors[bot.health] || statusColors.unknown;
  const label = statusLabels[bot.health] || "Unknown";

  const isLive = bot.type === "remote" && bot.health === "healthy";

  const flatDetails: [string, any][] = bot.details
    ? Object.entries(bot.details).flatMap(([k, v]) =>
        v !== null && typeof v === "object" && !Array.isArray(v)
          ? Object.entries(v).map(([k2, v2]) => [k2, v2] as [string, any])
          : [[k, v] as [string, any]]
      )
    : [];

  const detailEntries = flatDetails
    .filter(
      ([k, v]) =>
        (typeof v === "number" || typeof v === "string") &&
        (k.includes("count") ||
          k.includes("total") ||
          k.includes("apps") ||
          k.includes("jobs") ||
          k.includes("sent") ||
          k.includes("queue"))
    )
    .slice(0, 2);

  return (
    <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 hover:border-[#475569] hover:scale-[1.01] transition-all duration-200 cursor-default">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white capitalize truncate pr-2">
          {bot.name || bot.id}
        </h3>
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/20 px-2 py-0.5 rounded-full flex-shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ade80]" />
            </span>
            LIVE
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot} shadow-md ${status.glow}`}
          />
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              bot.health === "healthy"
                ? "bg-[#4ade80]/10 text-[#4ade80]"
                : bot.health === "down"
                ? "bg-[#ef4444]/10 text-[#ef4444]"
                : bot.health === "degraded" || bot.health === "manual"
                ? "bg-[#fbbf24]/10 text-[#fbbf24]"
                : bot.health === "local"
                ? "bg-[#60a5fa]/10 text-[#60a5fa]"
                : "bg-[#475569]/10 text-[#475569]"
            }`}
          >
            {label}
          </span>
        </div>
        <span className="text-[11px] text-[#475569] tabular-nums">
          {timeAgo(bot.last_checked)}
        </span>
      </div>

      {detailEntries.length > 0 && (
        <div
          className={`grid gap-2 pt-3 border-t border-[#334155] ${
            detailEntries.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {detailEntries.map(([k, v]) => (
            <div key={k}>
              <p className="text-[10px] text-[#475569] uppercase tracking-wide leading-tight">
                {formatKey(k)}
              </p>
              <p className="text-base font-bold text-white leading-snug">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
