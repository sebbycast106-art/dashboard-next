"use client";

interface Contact {
  name?: string;
  contact?: string;
  score?: number;
  warmth?: number;
}

interface WarmthTableProps {
  contacts: Contact[];
  total?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-[#4ade80]/15 text-[#4ade80]";
  if (score >= 50) return "bg-[#fbbf24]/15 text-[#fbbf24]";
  if (score >= 25) return "bg-[#fb923c]/15 text-[#fb923c]";
  return "bg-[#475569]/15 text-[#475569]";
}

export default function WarmthTable({ contacts, total }: WarmthTableProps) {
  if (!contacts || contacts.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Top Connections</h3>
        {total != null && (
          <span className="text-xs text-[#475569]">{total} total</span>
        )}
      </div>
      <div className="space-y-2">
        {contacts.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#334155]/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs text-[#475569] w-5 shrink-0">{i + 1}</span>
              <span className="text-sm text-[#e0e0e0] truncate">
                {c.name || c.contact || "Unknown"}
              </span>
            </div>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${scoreColor(
                c.score ?? c.warmth ?? 0
              )}`}
            >
              {c.score ?? c.warmth ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
