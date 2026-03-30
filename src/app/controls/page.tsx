"use client";

import { useState, useEffect } from "react";
import { api, post } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import TriggerButton from "@/components/TriggerButton";
import SafetyMeter from "@/components/SafetyMeter";
import Skeleton from "@/components/Skeleton";
import WarmupBanner from "@/components/WarmupBanner";
import Layout from "@/components/Layout";

const CATEGORIES = [
  {
    label: "Job Hunt",
    icon: "🔍",
    ids: [
      "run-job-scraper",
      "run-easy-apply",
      "run-watchlist",
      "run-skill-match",
      "run-keyword-alerts",
      "run-stale-check",
    ],
  },
  {
    label: "Networking",
    icon: "🤝",
    ids: [
      "run-connector",
      "run-alumni-connector",
      "run-profile-views",
      "run-recruiter",
      "run-recruiter-followup",
      "run-acceptance-check",
    ],
  },
  {
    label: "Inbox & Follow-up",
    icon: "📬",
    ids: [
      "run-inbox-check",
      "check-follow-ups",
      "run-status-detector",
      "run-message-queue",
    ],
  },
  {
    label: "Analytics & Reports",
    icon: "📊",
    ids: ["run-weekly-digest", "run-interview-prep", "flush-notifications"],
  },
  {
    label: "System",
    icon: "⚙️",
    ids: [
      "login-test",
      "linkedin-verify",
      "linkedin-reset",
      "run-engagement",
      "run-games",
    ],
  },
];

function buildCategoryMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    for (const id of cat.ids) {
      map[id] = cat.label;
    }
  }
  return map;
}

function CategoryHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <span className="text-sm" aria-hidden="true">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#334155]" />
    </div>
  );
}

interface Service {
  id: string;
  name: string;
  needs_input?: boolean;
  [key: string]: any;
}

interface WarmupData {
  active: boolean;
  week_num?: number;
  pct?: number;
  days_until_next?: number;
  multiplier?: number;
  phase?: string;
}

export default function ControlsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warmup, setWarmup] = useState<WarmupData | null>(null);
  const { data: status } = usePolling("/status", 30000);
  const bots = status?.bots || [];
  const linkedinBot = bots.find((b: any) => b.details?.safety);
  const safetyData = linkedinBot?.details?.safety ?? null;

  useEffect(() => {
    const warmupInfo = linkedinBot?.details?.warmup;
    if (warmupInfo) setWarmup(warmupInfo);
  }, [linkedinBot]);

  useEffect(() => {
    api("/linkedin/services")
      .then((data: any) => {
        setServices(data.services || []);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleTrigger = async (serviceId: string, input?: string) => {
    const body = input ? { input } : undefined;
    return post(`/linkedin/trigger/${serviceId}`, body);
  };

  const handleSkipWarmup = async () => {
    try {
      await post("/linkedin/warmup/skip");
      setWarmup((prev) => prev ? { ...prev, active: false, multiplier: 1.0, pct: 100, phase: "full_speed", days_until_next: 0 } : prev);
    } catch (e) {
      console.error("warmup skip failed:", e);
    }
  };

  const categoryMap = buildCategoryMap();

  const serviceById: Record<string, Service> = {};
  for (const s of services) {
    serviceById[s.id] = s;
  }

  const categorisedIds = new Set(Object.keys(categoryMap));
  const otherServices = services.filter((s) => !categorisedIds.has(s.id));

  const groups = CATEGORIES.map((cat) => ({
    ...cat,
    services: cat.ids
      .map((id) => serviceById[id])
      .filter(Boolean) as Service[],
  })).filter((g) => g.services.length > 0);

  if (otherServices.length > 0) {
    groups.push({
      label: "Other",
      icon: "🗂️",
      services: otherServices,
      ids: otherServices.map((s) => s.id),
    });
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Controls</h1>
            <p className="text-sm text-[#94a3b8] mt-1">
              Manually trigger bot actions
            </p>
          </div>
          <div className="lg:w-80 flex-shrink-0">
            <SafetyMeter safety={safetyData} compact={true} />
          </div>
        </div>

        <WarmupBanner warmup={warmup} onSkip={handleSkipWarmup} />

        {error && (
          <div className="text-sm text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" count={6} />
          </div>
        ) : services.length > 0 ? (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label} className="space-y-3">
                <CategoryHeader icon={group.icon} label={group.label} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.services.map((service) => (
                    <TriggerButton
                      key={service.id}
                      service={service}
                      onTrigger={handleTrigger}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#334155] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-12 text-center text-[#475569]">
            No services available
          </div>
        )}
      </div>
    </Layout>
  );
}
