"use client";

import { usePolling } from "@/hooks/usePolling";
import FunnelChart from "@/components/FunnelChart";
import StatCard from "@/components/StatCard";
import WarmthTable from "@/components/WarmthTable";
import { PageSkeleton } from "@/components/Skeleton";
import Layout from "@/components/Layout";

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function LinkedInPage() {
  const { data, loading } = usePolling("/linkedin/analytics", 60000);
  const { data: postsData, loading: postsLoading } = usePolling("/linkedin/posts", 120000);

  if (loading) return <Layout><PageSkeleton /></Layout>;

  const analytics = data?.analytics || {};
  const status = data?.cached_status || data?.status || {};
  const warmth = data?.warmth || {};

  const pipeline = analytics.funnel || analytics.pipeline || analytics;

  const topCompanies = (analytics.top_companies || []).map((c: any) =>
    Array.isArray(c) ? { name: c[0], count: c[1] } : c
  );

  const warmthContacts = warmth.top || warmth.warmth_scores || [];

  const acceptancePct = Math.round((analytics.acceptance_rate || 0) * 100);

  const stats = [
    { label: "Jobs Found",        value: analytics.jobs_found ?? pipeline.seen,                           color: "#60a5fa" },
    { label: "Applied",           value: analytics.applied    ?? pipeline.applied,                        color: "#fbbf24" },
    { label: "Acceptance Rate",   value: `${acceptancePct}%`,                                             color: "#4ade80" },
    { label: "Responded",         value: analytics.responded  ?? pipeline.responded,                      color: "#fb923c" },
    { label: "Interviews",        value: analytics.interviews ?? pipeline.interview,                      color: "#34d399" },
    { label: "Connections Sent",  value: status?.connections?.sent_today,                                 color: "#60a5fa" },
    { label: "Recruiters Sent",   value: status?.recruiter?.sent_today ?? analytics.total_recruiter_outreaches, color: "#a78bfa" },
    { label: "Likes Given",       value: status?.engagement?.likes_today,                                 color: "#f472b6" },
  ].filter((s) => s.value !== undefined && s.value !== null);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">LinkedIn Analytics</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            {status.today
              ? `Data for ${status.today}`
              : "Deep dive into your LinkedIn automation"}
          </p>
        </div>

        {/* Pipeline Funnel */}
        <section>
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
            Pipeline
          </h2>
          <FunnelChart data={pipeline} />
        </section>

        {/* Stats Grid */}
        {stats.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />
              ))}
            </div>
          </section>
        )}

        {/* Warmth + Companies row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warmth Table */}
          <section>
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              Connection Warmth
            </h2>
            {warmthContacts.length > 0 ? (
              <WarmthTable contacts={warmthContacts} total={warmth.total} />
            ) : (
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 text-sm text-[#475569]">
                No warmth data yet
              </div>
            )}
          </section>

          {/* Top Companies */}
          <section>
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              Top Companies Applied To
            </h2>
            {topCompanies.length > 0 ? (
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6">
                <div className="space-y-2">
                  {topCompanies.map((c: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#334155]/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#475569] w-5">{i + 1}</span>
                        <span className="text-sm text-[#e0e0e0]">
                          {c.name || c.company || String(c)}
                        </span>
                      </div>
                      {c.count != null && (
                        <span className="text-xs font-semibold text-[#60a5fa] bg-[#60a5fa]/10 px-2 py-0.5 rounded-full">
                          {c.count}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 text-sm text-[#475569]">
                No company data yet
              </div>
            )}
          </section>
        </div>

        {/* Feed Posts Log */}
        <section>
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">
              Feed Posts
            </h2>
            {postsData?.last_scraped && (
              <span className="text-xs text-[#475569]">
                scraped {timeAgo(postsData.last_scraped)}
              </span>
            )}
            {postsData?.total != null && (
              <span className="text-xs text-[#475569] ml-auto">
                {postsData.total} posts
              </span>
            )}
          </div>

          {postsLoading ? (
            <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6 text-sm text-[#475569]">
              Loading posts…
            </div>
          ) : !postsData?.posts?.length ? (
            <div className="rounded-xl border border-[#334155] bg-[#1e293b] p-6 text-sm text-[#475569]">
              No posts scraped yet — trigger "Scrape Feed Posts" from Controls to populate.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {postsData.posts.map((post: any) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">
                        {post.author}
                      </p>
                      {post.headline && (
                        <p className="text-xs text-[#475569] mt-0.5 leading-tight">
                          {post.headline}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {post.reactions > 0 && (
                        <span className="text-xs text-[#475569]">
                          👍 {post.reactions.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs text-[#334155]">
                        {timeAgo(post.scraped_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[#94a3b8] leading-relaxed line-clamp-4">
                    {post.text}
                  </p>
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#60a5fa] hover:text-[#93c5fd] mt-2 inline-block"
                    >
                      View on LinkedIn →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
