"use client";

interface WarmupData {
  active: boolean;
  week_num?: number;
  pct?: number;
  days_until_next?: number;
  multiplier?: number;
  phase?: string;
}

interface WarmupBannerProps {
  warmup: WarmupData | null;
  onSkip: () => void;
}

export default function WarmupBanner({ warmup, onSkip }: WarmupBannerProps) {
  if (!warmup) return null;

  if (!warmup.active) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14532d]/30 border border-[#16a34a]/30 text-[#4ade80] text-sm font-medium">
        <span>✅</span>
        <span>Full Speed — running at 100% capacity</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[#713f12]/30 border border-[#ca8a04]/40 text-[#fbbf24] text-sm">
      <div className="flex items-center gap-2">
        <span>🔥</span>
        <span className="font-medium">
          Warm-Up Mode: Week {warmup.week_num}/3 — running at {warmup.pct}% capacity.
          {(warmup.days_until_next ?? 0) > 0 && (
            <span className="font-normal text-[#fcd34d]">
              {" "}{warmup.days_until_next} day{warmup.days_until_next !== 1 ? "s" : ""} until next phase.
            </span>
          )}
        </span>
      </div>
      <button
        onClick={onSkip}
        className="shrink-0 px-3 py-1 rounded-lg bg-[#ca8a04]/20 hover:bg-[#ca8a04]/40 border border-[#ca8a04]/50 text-[#fbbf24] text-xs font-semibold transition-colors"
      >
        Skip to Full Speed
      </button>
    </div>
  );
}
