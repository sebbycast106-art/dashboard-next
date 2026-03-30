"use client";

interface FunnelData {
  seen?: number;
  applied?: number;
  responded?: number;
  interview?: number;
  offer?: number;
  [key: string]: number | undefined;
}

interface FunnelChartProps {
  data: FunnelData | null | undefined;
}

const stageColors: Record<string, string> = {
  seen: "#60a5fa",
  applied: "#fbbf24",
  responded: "#fb923c",
  interview: "#4ade80",
  offer: "#34d399",
};

const stageOrder = ["seen", "applied", "responded", "interview", "offer"];

export default function FunnelChart({ data }: FunnelChartProps) {
  if (!data) return null;

  const stages = stageOrder
    .filter((key) => data[key] !== undefined)
    .map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: data[key] || 0,
      color: stageColors[key] || "#60a5fa",
    }));

  if (stages.length === 0) return null;

  const max = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6">
      <h3 className="text-sm font-semibold text-white mb-5">Pipeline Funnel</h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = (stage.count / max) * 100;
          const prevCount = i > 0 ? stages[i - 1].count : null;
          const convRate =
            prevCount && prevCount > 0
              ? ((stage.count / prevCount) * 100).toFixed(0)
              : null;

          return (
            <div key={stage.key} className="flex items-center gap-3">
              <span className="text-xs text-[#94a3b8] w-20 text-right shrink-0">
                {stage.label}
              </span>
              <div className="flex-1 h-8 bg-[#0f172a] rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center"
                  style={{
                    width: `${Math.max(pct, 4)}%`,
                    backgroundColor: stage.color,
                    opacity: 0.85,
                  }}
                >
                  <span className="text-xs font-bold text-[#0f172a] px-2.5 whitespace-nowrap">
                    {stage.count}
                  </span>
                </div>
              </div>
              {convRate !== null && (
                <span className="text-xs text-[#475569] w-12 shrink-0">
                  {convRate}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
