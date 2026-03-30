"use client";

import { usePolling } from "@/hooks/usePolling";
import ActivityItem from "@/components/ActivityItem";
import Skeleton from "@/components/Skeleton";
import Layout from "@/components/Layout";

export default function ActivityPage() {
  const { data, loading, refetch } = usePolling("/activity", 30000);

  const events = data?.events || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
              <span className="flex items-center gap-1.5 ml-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]" />
                </span>
                <span className="text-xs font-medium text-[#4ade80] tracking-wide">
                  Live Feed
                </span>
              </span>
            </div>
            <p className="text-sm text-[#94a3b8] mt-1">
              Real-time events from all bots
            </p>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94a3b8] border border-[#334155] bg-[#1e293b] hover:bg-[#334155] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Refresh activity feed"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Feed */}
        <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] divide-y divide-[#334155]/50 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" count={6} />
            </div>
          ) : events.length > 0 ? (
            events.map((event: any, i: number) => (
              <ActivityItem key={event.id ?? i} event={event} />
            ))
          ) : (
            <div className="p-12 flex flex-col items-center gap-3 text-center">
              <span className="text-4xl" aria-hidden="true">📭</span>
              <p className="text-[#475569] text-sm font-medium">No recent activity</p>
              <p className="text-[#334155] text-xs">
                Events will appear here as bots run
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
