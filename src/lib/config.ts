export function getLinkedInBotUrl(): string {
  return process.env.LINKEDIN_BOT_URL ?? "https://linkedin-bot-production-c351.up.railway.app";
}

export function getLinkedInBotSecret(): string {
  return process.env.LINKEDIN_BOT_SECRET ?? "";
}

export function getAssistantBotUrl(): string {
  return process.env.ASSISTANT_BOT_URL ?? "https://web-production-06f54.up.railway.app";
}

export function getAssistantBotSecret(): string {
  return process.env.ASSISTANT_BOT_SECRET ?? "";
}

export interface BotConfig {
  id: string;
  name: string;
  type: "remote" | "local";
  url?: string;
  healthPath?: string;
  statusPath?: string | null;
  analyticsPath?: string;
  warmthPath?: string;
  secret?: string | null;
  logPath?: string;
}

export const BOTS: BotConfig[] = [
  {
    id: "linkedin-bot",
    name: "LinkedIn Bot",
    type: "remote",
    url: process.env.LINKEDIN_BOT_URL ?? "https://linkedin-bot-production-c351.up.railway.app",
    healthPath: "/health",
    statusPath: "/internal/status",
    analyticsPath: "/internal/analytics",
    warmthPath: "/internal/warmth-scores",
    secret: process.env.LINKEDIN_BOT_SECRET ?? "",
  },
  {
    id: "personal-assistant",
    name: "Personal Assistant",
    type: "remote",
    url: process.env.ASSISTANT_BOT_URL ?? "https://web-production-06f54.up.railway.app",
    healthPath: "/health",
    statusPath: null,
    secret: null,
  },
  {
    id: "homework-bot",
    name: "Homework Bot",
    type: "local",
    logPath: "C:/Users/sebas/homework-bot/summary_log.txt",
  },
  {
    id: "finance-bot",
    name: "Finance Bot",
    type: "local",
    logPath: "C:/Users/sebas/finance-bot/summary_log.txt",
  },
];

export interface LinkedInService {
  id: string;
  name: string;
  needs_input?: boolean;
  input_key?: string;
}

export const LINKEDIN_SERVICES: LinkedInService[] = [
  { id: "run-job-scraper", name: "Job Scraper" },
  { id: "run-engagement", name: "Engagement" },
  { id: "run-connector", name: "Connector" },
  { id: "run-recruiter", name: "Recruiter Outreach" },
  { id: "run-recruiter-followup", name: "Recruiter Follow-up" },
  { id: "run-easy-apply", name: "Easy Apply" },
  { id: "run-profile-views", name: "Profile Views" },
  { id: "run-inbox-check", name: "Inbox Monitor" },
  { id: "run-watchlist", name: "Company Watchlist" },
  { id: "run-weekly-digest", name: "Weekly Digest" },
  { id: "run-acceptance-check", name: "Acceptance Check" },
  { id: "run-interview-prep", name: "Interview Prep" },
  { id: "run-alumni-connector", name: "Alumni Connector" },
  { id: "check-follow-ups", name: "Follow-up Check" },
  { id: "run-stale-check", name: "Stale App Check" },
  { id: "run-keyword-alerts", name: "Keyword Alerts" },
  { id: "flush-notifications", name: "Flush Notifications" },
  { id: "run-status-detector", name: "Status Detector" },
  { id: "run-message-queue", name: "Message Queue" },
  { id: "run-skill-match", name: "Skill Match Check" },
  { id: "run-games", name: "Play Daily Games" },
  { id: "run-feed-scrape", name: "Scrape Feed Posts" },
  { id: "run-ghost-detector", name: "Ghost Detector" },
  { id: "run-daily-brief", name: "Daily Brief" },
  { id: "login-test", name: "Login Test" },
  { id: "linkedin-verify", name: "LinkedIn Verify", needs_input: true, input_key: "code" },
  { id: "linkedin-reset", name: "LinkedIn Reset" },
];
