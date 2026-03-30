"use client";

interface SafetyData {
  risk_level?: "safe" | "caution" | "danger";
  connections?: { today?: number; today_limit?: number; week?: number; week_limit?: number };
  messages?: { today?: number; today_limit?: number };
  profile_views?: { today?: number; today_limit?: number };
  likes?: { today?: number; today_limit?: number };
}

interface SafetyMeterProps {
  safety: SafetyData | null;
  compact?: boolean;
}

function getBarColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 70) return "#fbbf24";
  return "#4ade80";
}

interface QuotaBarProps {
  label: string;
  current: number;
  limit: number;
  period: string;
}

function QuotaBar({ label, current, limit, period }: QuotaBarProps) {
  const pct = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const color = getBarColor(pct);

  return (
    <div className="flex items-center gap-3">
      <div className="w-32 flex-shrink-0">
        <p className="text-xs text-[#94a3b8] leading-tight">{label}</p>
        <p className="text-[10px] text-[#475569] leading-tight uppercase tracking-wide">{period}</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-[#1e293b] border border-[#334155] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>

      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-xs font-mono font-semibold" style={{ color }}>
          {current}
        </span>
        <span className="text-xs text-[#475569]">/{limit}</span>
      </div>
    </div>
  );
}

const RISK_CONFIG = {
  safe:    { emoji: "🟢", label: "Safe",    color: "#4ade80", bg: "bg-[#4ade80]/10", border: "border-[#4ade80]/20", text: "text-[#4ade80]" },
  caution: { emoji: "🟡", label: "Caution", color: "#fbbf24", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", text: "text-[#fbbf24]" },
  danger:  { emoji: "🔴", label: "Danger",  color: "#ef4444", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/20", text: "text-[#ef4444]" },
};

export default function SafetyMeter({ safety, compact = false }: SafetyMeterProps) {
  if (!safety) {
    return (
      <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4">
        <p className="text-sm text-[#475569]">Safety data unavailable</p>
      </div>
    );
  }

  const risk = RISK_CONFIG[safety.risk_level || "safe"] || RISK_CONFIG.safe;
  const conn = safety.connections || {};
  const msg  = safety.messages || {};
  const pv   = safety.profile_views || {};
  const lk   = safety.likes || {};

  const bars = [
    { label: "Connections",   current: conn.today ?? 0, limit: conn.today_limit ?? 20,  period: "today"      },
    { label: "Connections",   current: conn.week  ?? 0, limit: conn.week_limit  ?? 100, period: "this week"  },
    { label: "Messages",      current: msg.today  ?? 0, limit: msg.today_limit  ?? 20,  period: "today"      },
    { label: "Profile Views", current: pv.today   ?? 0, limit: pv.today_limit   ?? 80,  period: "today"      },
    { label: "Likes",         current: lk.today   ?? 0, limit: lk.today_limit   ?? 50,  period: "today"      },
  ];

  return (
    <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#334155]">
        <div>
          <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider leading-tight">
            Account Safety
          </p>
          <p className="text-[10px] text-[#475569] mt-0.5 leading-tight">
            LinkedIn quota usage
          </p>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${risk.bg} ${risk.border} ${risk.text}`}
        >
          <span>{risk.emoji}</span>
          <span>{risk.label}</span>
        </span>
      </div>

      <div className={`px-4 py-3 ${compact ? "space-y-2" : "space-y-3"}`}>
        {bars.map((bar, i) => (
          <QuotaBar key={i} {...bar} />
        ))}
      </div>

      {!compact && (
        <div className="px-4 pb-3">
          <p className="text-[10px] text-[#334155] leading-snug">
            70–90% = caution &nbsp;·&nbsp; 90%+ = danger &nbsp;·&nbsp; exceeding limits causes bans
          </p>
        </div>
      )}
    </div>
  );
}
