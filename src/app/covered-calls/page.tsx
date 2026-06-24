"use client";

import { Fragment, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import {
  type CoveredCallRecommendation,
  type CoveredCallsPayload,
  useCoveredCalls,
} from "@/hooks/useCoveredCalls";

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmtMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtMoney0(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// Signed money — the leading + makes "premium earned" readable in grayscale.
function fmtMoneySigned(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return sign + fmtMoney(n);
}

function fmtPct1(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtPct0(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(0)}%`;
}

function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Expiry / as_of are plain YYYY-MM-DD; render without timezone drift.
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function fmtUpdatedAt(iso?: string | null): string {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// Risk tier derived from assignment probability — gives a grayscale-readable
// label alongside the colored percentage so risk never relies on hue alone.
function riskTier(p: number | null | undefined): { label: string; cls: string } {
  if (p == null) return { label: "—", cls: "text-[#475569]" };
  if (p < 0.2) return { label: "Low", cls: "text-[#4ade80]" };
  if (p < 0.4) return { label: "Mod", cls: "text-[#fbbf24]" };
  return { label: "High", cls: "text-[#f87171]" };
}

// ── Cells & badges (house recipe: bg/20 + light text + border/30, font-mono) ─

function RiskCell({ p }: { p: number | null | undefined }) {
  const tier = riskTier(p);
  if (p == null) return <span className="text-[#475569] font-mono tabular-nums">—</span>;
  return (
    <span className="inline-flex items-baseline justify-end gap-1.5 font-mono tabular-nums">
      <span className={tier.cls}>{fmtPct0(p)}</span>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${tier.cls}`}>
        {tier.label}
      </span>
    </span>
  );
}

function QccBadge({ q }: { q: boolean | null | undefined }) {
  if (q == null) return <span className="text-[#475569] font-mono">—</span>;
  return q ? (
    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono bg-[#059669]/20 text-[#34d399] border-[#059669]/30">
      QCC
    </span>
  ) : (
    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono bg-[#334155] text-[#94a3b8] border-[#475569]/30">
      no
    </span>
  );
}

// ── Stat tile (mirrors jobs/page.tsx stat row exactly) ──────────────────────

function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="relative rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden flex">
      <div
        className="w-1 flex-shrink-0 self-stretch rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 p-3 flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest leading-tight">
          {label}
        </p>
        <p className="text-2xl font-black text-white font-mono tabular-nums leading-none">
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-[#475569] font-mono tabular-nums leading-none">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ── Detail row (progressive disclosure for secondary greeks) ────────────────

function DetailRow({ r, colSpan }: { r: CoveredCallRecommendation; colSpan: number }) {
  const items: { label: string; value: string }[] = [
    { label: "Gross premium", value: fmtMoneySigned(r.gross_premium_total) },
    { label: "After-tax EV", value: fmtMoney(r.after_tax_ev) },
    { label: "Annualized yld", value: fmtPct1(r.annualized_yield) },
    { label: "Breakeven", value: r.breakeven != null ? fmtMoney(r.breakeven) : "—" },
    { label: "Contracts", value: r.contracts != null ? String(r.contracts) : "—" },
    { label: "Coverage", value: `${r.lt_shares_written} LT · ${r.st_shares_written} ST` },
  ];
  return (
    <tr className="bg-[#0f172a]/60">
      <td colSpan={colSpan} className="px-3 pb-3 pt-0">
        <div className="rounded-lg border border-[#334155] bg-[#0f172a] p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-2">
            {items.map((it) => (
              <div key={it.label} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">
                  {it.label}
                </span>
                <span className="text-sm font-mono tabular-nums text-[#cbd5e1]">{it.value}</span>
              </div>
            ))}
          </div>
          {r.rationale && (
            <p className="mt-3 pt-3 border-t border-[#334155] text-xs text-[#94a3b8] leading-relaxed">
              {r.rationale}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CoveredCallsPage() {
  const { data: rawData, isLoading: loading, error: queryError } = useCoveredCalls();
  const data = rawData as CoveredCallsPayload | undefined;
  const error = queryError ? (queryError as Error).message : null;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const recs: CoveredCallRecommendation[] = useMemo(() => data?.recommendations ?? [], [data]);
  const sellCalls = useMemo(() => recs.filter((r) => r.action === "SELL_CALL"), [recs]);
  const noTrades = useMemo(() => recs.filter((r) => r.action !== "SELL_CALL"), [recs]);

  const totalPremium = useMemo(
    () => sellCalls.reduce((sum, r) => sum + (r.gross_premium_total ?? 0), 0),
    [sellCalls]
  );
  const totalAfterTaxEv = useMemo(
    () => sellCalls.reduce((sum, r) => sum + (r.after_tax_ev ?? 0), 0),
    [sellCalls]
  );

  const flags = data?.flags ?? [];
  const brief = data?.brief ?? "";
  const asOf = data?.as_of;
  const updatedAt = data?.generated_at ?? data?.fetched_at;
  const stale = data?.stale ?? false;
  const premiumToDate = data?.performance?.premium_collected_to_date ?? 0;

  // Column count for the SELL_CALL table (used by detail-row colSpan).
  const COLS = 7;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              📈 COVERED CALLS
              {stale && (
                <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono bg-[#d97706]/20 text-[#fbbf24] border-[#d97706]/30 align-middle">
                  STALE
                </span>
              )}
            </h1>
            <p className="text-sm text-[#94a3b8] mt-0.5 font-mono">
              {asOf ? `as of ${fmtDate(asOf)}` : "no data yet"}
              {updatedAt && (
                <span className="text-[#475569]"> · generated {fmtUpdatedAt(updatedAt)}</span>
              )}
            </p>
            <p className="text-[11px] text-[#475569] mt-1">
              Analyze-only · prices ~15-min delayed — re-check the live bid before placing any
              order.
            </p>
          </div>
          {loading && <span className="text-xs text-[#475569] animate-pulse mt-1">Fetching…</span>}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 p-4 text-sm">
            Couldn&apos;t load covered calls — {error}. Showing last good data if available.
          </div>
        )}

        {/* Stat tiles (summary first) */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["a", "b", "c", "d"].map((k) => (
              <div
                key={`tile-skel-${k}`}
                className="rounded-xl border border-[#334155] bg-[#1e293b] h-[72px] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              label="Premium This Cycle"
              value={fmtMoney0(totalPremium)}
              sub={`${fmtMoney0(totalAfterTaxEv)} after-tax`}
              color="#4ade80"
            />
            <StatTile label="Calls To Write" value={sellCalls.length} color="#60a5fa" />
            <StatTile label="No-Trade" value={noTrades.length} color="#475569" />
            <StatTile label="Premium To Date" value={fmtMoney0(premiumToDate)} color="#34d399" />
          </div>
        )}

        {/* Recommendation table (the hero) */}
        {loading ? (
          <div className="rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
            <div className="h-9 border-b border-[#334155]/60 animate-pulse" />
            {["a", "b", "c", "d"].map((k) => (
              <div
                key={`row-skel-${k}`}
                className="h-11 border-b border-[#334155]/40 animate-pulse"
              />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-10 text-center">
            <p className="text-[#94a3b8] text-sm font-semibold">No run yet</p>
            <p className="text-[#475569] text-sm mt-1">
              The covered-call bot hasn&apos;t pushed a cycle. It polls automatically every 5
              minutes.
            </p>
          </div>
        ) : sellCalls.length === 0 ? (
          // Whole-cycle "no trade" — a deliberate answer, styled calm/neutral (not an error).
          <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6">
            <div className="flex items-start gap-3">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#60a5fa] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Nothing worth writing this cycle.
                </p>
                <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                  All {noTrades.length} underlying{noTrades.length === 1 ? "" : "s"} evaluated below
                  threshold — see each reason.
                </p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-[#334155]">
              {noTrades.map((r, i) => (
                <li
                  key={r.contract_symbol ?? `${r.ticker}-${i}`}
                  className="flex items-baseline gap-3 py-2.5"
                >
                  <span className="font-bold text-white font-mono w-14 shrink-0">{r.ticker}</span>
                  <span className="text-sm text-[#94a3b8] leading-snug">
                    {r.no_trade_reason ?? r.rationale ?? "Below target — no viable strike."}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#334155]">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">
                      Ticker
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
                      Strike / Expiry
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">
                      Delta
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
                      Assign. Risk
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
                      Premium
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest whitespace-nowrap">
                      Monthly Yld
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">
                      QCC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/50">
                  {sellCalls.map((r, i) => {
                    const key = r.contract_symbol ?? `${r.ticker}-${i}`;
                    const open = expanded.has(key);
                    const prob = r.prob_assignment_rw ?? r.prob_assignment_rn;
                    return (
                      <Fragment key={key}>
                        <tr
                          onClick={() => toggle(key)}
                          className="hover:bg-[#334155]/20 transition-colors cursor-pointer"
                        >
                          {/* Ticker — recommended accent + below-target flag */}
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-0.5 h-4 rounded-full bg-[#4ade80] shrink-0"
                                aria-hidden="true"
                              />
                              <span className="font-bold text-white font-mono">{r.ticker}</span>
                              {r.below_target && (
                                <span className="inline-flex items-center text-[9px] font-bold px-1 py-0.5 rounded border font-mono bg-[#d97706]/20 text-[#fbbf24] border-[#d97706]/30">
                                  below tgt
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Strike / Expiry + DTE */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="font-mono tabular-nums text-[#cbd5e1]">
                              {r.strike != null ? fmtMoney(r.strike) : "—"}
                            </span>
                            <span className="text-[#475569] font-mono tabular-nums">
                              {" "}
                              {fmtDate(r.expiry)}
                              {r.dte != null && ` · ${r.dte}d`}
                            </span>
                          </td>
                          {/* Delta */}
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#cbd5e1]">
                            {fmtNum(r.delta, 2)}
                          </td>
                          {/* Assignment risk (% + Low/Mod/High, grayscale-readable) */}
                          <td className="px-3 py-2.5 text-right">
                            <RiskCell p={prob} />
                          </td>
                          {/* Premium — the loud number, signed positive */}
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold text-[#4ade80] whitespace-nowrap">
                            {fmtMoneySigned(r.net_premium_per_share)}
                          </td>
                          {/* Monthly yield */}
                          <td className="px-3 py-2.5 text-right font-mono tabular-nums text-[#cbd5e1]">
                            {fmtPct1(r.monthly_yield)}
                          </td>
                          {/* QCC */}
                          <td className="px-3 py-2.5 text-right">
                            <QccBadge q={r.qcc_qualified} />
                          </td>
                        </tr>
                        {open && <DetailRow r={r} colSpan={COLS} />}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* No-trade underlyings, grouped quietly beneath the actionable rows */}
            {noTrades.length > 0 && (
              <div className="border-t border-[#334155] px-3 py-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">
                  No trade this cycle
                </p>
                <ul className="divide-y divide-[#334155]/40">
                  {noTrades.map((r, i) => (
                    <li
                      key={r.contract_symbol ?? `nt-${r.ticker}-${i}`}
                      className="flex items-baseline gap-3 py-1.5"
                    >
                      <span className="font-bold text-[#94a3b8] font-mono w-14 shrink-0">
                        {r.ticker}
                      </span>
                      <span className="text-xs text-[#475569] leading-snug">
                        {r.no_trade_reason ?? r.rationale ?? "Below target — no viable strike."}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Secondary: brief + flags, below the actionable surface */}
        {!loading && (brief || flags.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {brief && (
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4">
                <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest mb-2">
                  Daily Brief
                </p>
                <p className="text-sm text-[#cbd5e1] leading-relaxed whitespace-pre-line">
                  {brief}
                </p>
              </div>
            )}
            {flags.length > 0 && (
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4">
                <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest mb-2">
                  Anomaly Flags
                </p>
                <ul className="space-y-1.5">
                  {flags.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#fbbf24]">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#fbbf24] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && recs.length > 0 && (
          <p className="text-xs text-[#475569] text-center font-mono pb-2">
            {sellCalls.length} to write · {noTrades.length} no-trade · polling every 5m · re-check
            live bid before trading
          </p>
        )}
      </div>
    </Layout>
  );
}
