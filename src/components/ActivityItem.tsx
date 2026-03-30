"use client";

interface ActivityEvent {
  id?: string | number;
  type?: string;
  bot?: string;
  source?: string;
  action?: string;
  message?: string;
  count?: number;
  timestamp?: string;
}

interface ActivityItemProps {
  event: ActivityEvent;
}

function timeAgo(ts?: string): string {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const TYPE_META: Record<string, { icon: string; border: string }> = {
  count:      { icon: "📊", border: "border-l-[#4ade80]" },
  activity:   { icon: "✅", border: "border-l-[#4ade80]" },
  success:    { icon: "✅", border: "border-l-[#4ade80]" },
  connection: { icon: "🤝", border: "border-l-[#60a5fa]" },
  alert:      { icon: "🚨", border: "border-l-[#ef4444]" },
  log:        { icon: "📝", border: "border-l-[#fbbf24]" },
};

const DEFAULT_META = { icon: "📝", border: "border-l-[#fbbf24]" };

export default function ActivityItem({ event }: ActivityItemProps) {
  const type = event?.type?.toLowerCase() || "log";
  const { icon, border } = TYPE_META[type] || DEFAULT_META;

  const label = event.bot || event.source || "system";

  return (
    <div
      className={`animate-fadeIn flex items-start gap-3 py-3 px-4 border-l-2 ${border} hover:bg-[#334155]/20 transition-colors`}
    >
      <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden="true">
        {icon}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-[#334155] text-[#94a3b8]">
            {label}
          </span>
          {event.action && (
            <span className="text-xs text-[#475569]">{event.action}</span>
          )}
        </div>
        <p className="text-sm text-[#cbd5e1] mt-1 break-words leading-snug">
          {event.message}
          {event.count != null && (
            <span className="ml-1.5 text-[#4ade80] font-semibold tabular-nums">
              ({event.count})
            </span>
          )}
        </p>
      </div>

      <span className="text-xs text-[#475569] shrink-0 mt-0.5 tabular-nums">
        {timeAgo(event.timestamp)}
      </span>
    </div>
  );
}
