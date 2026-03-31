"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function apiFetch(path: string) {
  const res = await fetch(`/api${path}`);
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function apiPost(path: string, body: unknown) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
  return res.json();
}

export const queryKeys = {
  status:      ["status"] as const,
  analytics:   ["linkedin", "analytics"] as const,
  jobs:        ["jobs"] as const,
  calendar:    ["calendar"] as const,
  automations: ["automations"] as const,
  activity:    ["activity"] as const,
};

export function useStatus()      { return useQuery({ queryKey: queryKeys.status,      queryFn: () => apiFetch("/status"),              refetchInterval: 30_000 }); }
export function useAnalytics()   { return useQuery({ queryKey: queryKeys.analytics,   queryFn: () => apiFetch("/linkedin/analytics"),  refetchInterval: 60_000 }); }
export function useJobs()        { return useQuery({ queryKey: queryKeys.jobs,        queryFn: () => apiFetch("/jobs"),                refetchInterval: 120_000 }); }
export function useCalendar()    { return useQuery({ queryKey: queryKeys.calendar,    queryFn: () => apiFetch("/calendar/today"),      refetchInterval: 10 * 60_000 }); }
export function useAutomations() { return useQuery({ queryKey: queryKeys.automations, queryFn: () => apiFetch("/automations/status"),  refetchInterval: 60_000 }); }
export function useActivity()    { return useQuery({ queryKey: queryKeys.activity,    queryFn: () => apiFetch("/activity"),            refetchInterval: 30_000 }); }

export function useTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: string }) =>
      apiPost(`/linkedin/trigger/${id}`, input ? { input } : {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.status });
    },
  });
}
