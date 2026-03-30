"use client";

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  subtitle?: string;
  color?: string;
  trend?: number;
}

export default function StatCard({ label, value, subtitle, color = "#60a5fa", trend }: StatCardProps) {
  const trendPositive = trend != null && trend > 0;
  const trendNegative = trend != null && trend < 0;
  const trendDisplay =
    trend != null
      ? trendPositive
        ? `▲ +${trend}`
        : trendNegative
        ? `▼ ${trend}`
        : null
      : null;

  return (
    <div className="relative rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden min-h-[100px] flex">
      <div
        className="w-1 flex-shrink-0 self-stretch rounded-l-xl"
        style={{ backgroundColor: color }}
      />

      <div className="flex-1 p-4 flex flex-col justify-between">
        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest leading-tight">
          {label}
        </p>

        <div className="mt-1">
          <p className="text-3xl font-black leading-none tracking-tight" style={{ color }}>
            {value ?? "--"}
          </p>
        </div>

        <div className="flex items-end justify-between mt-2">
          {subtitle && (
            <p className="text-xs text-[#475569]">{subtitle}</p>
          )}
          {!subtitle && <span />}

          {trendDisplay && (
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{
                color: trendPositive ? "#4ade80" : trendNegative ? "#ef4444" : "#94a3b8",
              }}
            >
              {trendDisplay}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
