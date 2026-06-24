"use client";
import { useQuery } from "@tanstack/react-query";

// ── Push payload contract (what the Python covered-call bot POSTs) ──────────

export interface CoveredCallRecommendation {
  ticker: string;
  action: "SELL_CALL" | "NO_TRADE";
  contracts: number;
  contract_symbol: string | null;
  strike: number | null;
  expiry: string | null;
  dte: number | null;
  delta: number | null;
  prob_assignment_rw: number | null;
  prob_assignment_rn: number | null;
  net_premium_per_share: number | null;
  gross_premium_total: number | null;
  monthly_yield: number | null;
  annualized_yield: number | null;
  after_tax_ev: number | null;
  breakeven: number | null;
  lt_shares_written: number;
  st_shares_written: number;
  qcc_qualified: boolean | null;
  below_target: boolean;
  rationale: string;
  no_trade_reason: string | null;
}

export interface CoveredCallPerformance {
  premium_collected_to_date: number;
  spy_return: number | null;
  buyhold_return: number | null;
}

export interface CoveredCallsPayload {
  generated_at: string | null;
  as_of: string | null;
  risk_free: number | null;
  stale: boolean;
  brief: string;
  flags: string[];
  recommendations: CoveredCallRecommendation[];
  performance: CoveredCallPerformance;
  fetched_at?: string;
  unavailable?: boolean;
  _source?: string;
}

async function fetchCoveredCalls(): Promise<CoveredCallsPayload> {
  const res = await fetch("/api/trading/covered-calls");
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const coveredCallsKey = ["trading", "covered-calls"] as const;

export function useCoveredCalls() {
  return useQuery({
    queryKey: coveredCallsKey,
    queryFn: fetchCoveredCalls,
    refetchInterval: 300_000,
  });
}
