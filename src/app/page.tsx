"use client";

import { Component } from "react";
import { usePolling } from "@/hooks/usePolling";
import BotCard from "@/components/BotCard";
import StatCard from "@/components/StatCard";
import FunnelChart from "@/components/FunnelChart";
import SafetyMeter from "@/components/SafetyMeter";
import { PageSkeleton, CardSkeleton } from "@/components/Skeleton";
import Layout from "@/components/Layout";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
          <p className="font-bold mb-2">Dashboard crashed — error details:</p>
          <pre className="text-xs whitespace-pre-wrap break-all">{String(this.state.error)}</pre>
          <pre className="text-xs whitespace-pre-wrap break-all mt-2 text-red-300/70">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDateTime() {
  return new Date().toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRunTime(isoString?: string) {
  if (!isoString) return "Never";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function formatFetchTime(isoString?: string) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function DashboardPage() {
  const { data: status, loading: statusLoading } = usePolling("/status", 30000);
  const { data: linkedin, loading: linkedinLoading } = usePolling("/linkedin/analytics", 60000);
  const { data: calendar, loading: calendarLoading } = usePolling("/calendar/today", 600000);
  const { data: automations, loading: automationsLoading } = usePolling("/automations/status", 60000);
  const { data: finance, loading: financeLoading } = usePolling("/automations/finance", 120000);
  const { data: news, loading: newsLoading } = usePolling("/news/today", 300000);

  if (statusLoading || linkedinLoading) return <Layout><ErrorBoundary><PageSkeleton /></ErrorBoundary></Layout>;

  const bots = status?.bots || [];
  const analytics = linkedin?.analytics || {};
  const pipeline = analytics.funnel || analytics.pipeline || analytics;

  const linkedinBot = bots.find((b: any) => b.details?.safety);
  const safetyData = linkedinBot?.details?.safety ?? null;

  const allHealthy =
    bots.length > 0 && bots.every((b: any) => b.health === "healthy" || b.health === "local");

  return (
    <Layout>
      <ErrorBoundary>
        <div className="space-y-8">
          {/* Greeting Header */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0 mt-0.5">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 ${
                  allHealthy ? "bg-[#4ade80]" : "bg-[#475569]"
                }`}
              />
              {allHealthy && (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    backgroundColor: "#4ade80",
                    opacity: 0.4,
                  }}
                />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {getGreeting()}, Sebas
              </h1>
              <p className="text-sm text-[#94a3b8] mt-0.5">{formatDateTime()}</p>
              {status?.polled_at && (
                <p className="text-xs text-[#475569] mt-0.5">
                  Last polled {new Date(status.polled_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Safety Monitor */}
          {!statusLoading && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Safety Monitor
                </h2>
                <span className="text-xs text-[#475569]">LinkedIn account limits</span>
              </div>
              <SafetyMeter safety={safetyData} />
            </section>
          )}

          {/* Bot Status Grid */}
          <section>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                Bot Status
              </h2>
              <span className="text-xs text-[#475569]">Polling every 30s</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusLoading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : bots.length > 0 ? (
                bots.map((bot: any) => <BotCard key={bot.id} bot={bot} />)
              ) : (
                <div className="col-span-full text-center py-8 text-[#475569]">
                  No bots configured
                </div>
              )}
            </div>
          </section>

          {/* Today's Calendar */}
          {!calendarLoading && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  📅 Today
                </h2>
                <span className="text-xs text-[#475569]">Polling every 10m</span>
              </div>
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4">
                {calendar?.events?.length > 0 ? (
                  <ul className="space-y-2">
                    {calendar.events.map((event: any, i: number) => (
                      <li key={i} className="flex items-baseline gap-2 text-sm">
                        {event.all_day ? (
                          <span className="text-[#475569] w-20 flex-shrink-0 text-xs font-medium uppercase">All day</span>
                        ) : (
                          <span className="text-[#60a5fa] w-20 flex-shrink-0 font-mono text-xs">{event.time}</span>
                        )}
                        <span className="text-white">{event.summary}</span>
                      </li>
                    ))}
                  </ul>
                ) : calendar?.error ? (
                  <p className="text-sm text-[#475569]">Calendar unavailable</p>
                ) : (
                  <p className="text-sm text-[#475569]">No events today</p>
                )}
              </div>
            </section>
          )}

          {/* LinkedIn Quick Summary */}
          {!linkedinLoading && (
            <section>
              <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
                LinkedIn Summary
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    label="Jobs Found"
                    value={analytics.jobs_found ?? pipeline.seen ?? "--"}
                    color="#60a5fa"
                  />
                  <StatCard
                    label="Applied"
                    value={analytics.applied ?? pipeline.applied ?? "--"}
                    color="#fbbf24"
                  />
                  <StatCard
                    label="Responses"
                    value={analytics.responded ?? pipeline.responded ?? "--"}
                    color="#fb923c"
                  />
                  <StatCard
                    label="Interviews"
                    value={analytics.interviews ?? pipeline.interview ?? "--"}
                    color="#4ade80"
                  />
                </div>

                <FunnelChart data={pipeline} />
              </div>
            </section>
          )}

          {/* Co-op Bot Automations */}
          {!automationsLoading && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Co-op Bot
                </h2>
                <span className="text-xs text-[#475569]">Polling every 60s</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="relative rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden min-h-[100px] flex">
                  <div
                    className="w-1 flex-shrink-0 self-stretch rounded-l-xl"
                    style={{
                      backgroundColor:
                        automations?.scraper?.ok === true
                          ? "#4ade80"
                          : automations?.scraper?.ok === false
                          ? "#ef4444"
                          : "#475569",
                    }}
                  />
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest leading-tight">
                      Last Scrape
                    </p>
                    <div className="mt-1">
                      <p className="text-lg font-black leading-none tracking-tight text-white">
                        {automations?.scraper?.ok === true
                          ? "✅"
                          : automations?.scraper?.ok === false
                          ? "❌"
                          : "—"}
                      </p>
                    </div>
                    <p className="text-xs text-[#475569] mt-2 leading-snug">
                      {formatRunTime(automations?.scraper?.last_run)}
                    </p>
                  </div>
                </div>

                <StatCard
                  label="Total Jobs"
                  value={automations?.jobs?.total ?? "--"}
                  color="#60a5fa"
                />
                <StatCard
                  label="Score 4-5"
                  value={automations?.jobs?.high_score ?? "--"}
                  subtitle="Top picks"
                  color="#a78bfa"
                />
                <StatCard
                  label="Alerted"
                  value={automations?.jobs?.alerted ?? "--"}
                  subtitle="Sent to Discord"
                  color="#fbbf24"
                />
              </div>
            </section>
          )}

          {/* Finance Bot */}
          {!financeLoading && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  📚 Finance Bot
                </h2>
                <span className="text-xs text-[#475569]">Polling every 2m</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="relative rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] overflow-hidden min-h-[100px] flex">
                  <div
                    className="w-1 flex-shrink-0 self-stretch rounded-l-xl"
                    style={{
                      backgroundColor: (() => {
                        if (!finance?.last_run_iso) return "#475569";
                        const diffH = (Date.now() - new Date(finance.last_run_iso).getTime()) / 3600000;
                        return diffH < 24 ? "#4ade80" : "#fbbf24";
                      })(),
                    }}
                  />
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest leading-tight">
                      Last Run
                    </p>
                    <div className="mt-1">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: (() => {
                            if (!finance?.last_run_iso) return "#475569";
                            const diffH = (Date.now() - new Date(finance.last_run_iso).getTime()) / 3600000;
                            return diffH < 24 ? "#4ade80" : "#fbbf24";
                          })(),
                        }}
                      />
                    </div>
                    <p className="text-xs text-[#475569] mt-2 leading-snug">
                      {formatRunTime(finance?.last_run_iso)}
                    </p>
                  </div>
                </div>

                <StatCard
                  label="Correct"
                  value={finance?.correct ?? "--"}
                  subtitle="answers"
                  color="#4ade80"
                />

                <StatCard
                  label="Total"
                  value={finance?.total ?? "--"}
                  subtitle="attempted"
                  color="#60a5fa"
                />

                <StatCard
                  label="Score"
                  value={
                    finance?.total > 0 && finance?.correct != null
                      ? `${Math.round((finance.correct / finance.total) * 100)}%`
                      : "--"
                  }
                  subtitle={finance?.ok ? "complete" : "incomplete"}
                  color="#a78bfa"
                />
              </div>
            </section>
          )}

          {/* Finance News */}
          {!newsLoading && (
            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
                  📰 Finance News
                </h2>
                <span className="text-xs text-[#475569]">Polling every 5m</span>
              </div>
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4">
                {news?.items?.length > 0 ? (
                  <>
                    <ul className="space-y-2">
                      {news.items.slice(0, 8).map((item: any, i: number) => (
                        <li key={i} className="text-sm leading-snug">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#60a5fa] hover:text-[#93c5fd] transition-colors"
                          >
                            <span className="font-semibold text-white">[{item.firm}]</span>{" "}
                            {item.title}{" "}
                            <span className="text-[#475569]">({item.source})</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    {news.fetched_at && (
                      <p className="text-xs text-[#475569] mt-3">
                        Fetched {formatFetchTime(news.fetched_at)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-[#475569]">No coverage in last 24h</p>
                )}
              </div>
            </section>
          )}
        </div>
      </ErrorBoundary>
    </Layout>
  );
}
