"use client";

import { useState, useEffect } from "react";
import { api, post } from "@/lib/api";
import Layout from "@/components/Layout";

const GAMES = [
  { id: "patches", name: "Patches", icon: "🧩", slug: "patches", color: "bg-blue-500/10 border-blue-500/30" },
  { id: "zip", name: "Zip", icon: "🔗", slug: "zip", color: "bg-orange-500/10 border-orange-500/30" },
  { id: "mini-sudoku", name: "Mini Sudoku", icon: "🔢", slug: "mini-sudoku", color: "bg-teal-500/10 border-teal-500/30" },
  { id: "tango", name: "Tango", icon: "☀️", slug: "tango", color: "bg-yellow-500/10 border-yellow-500/30" },
];

const STORAGE_KEY = "games_status";

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadCache(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed._date !== getTodayDate()) return {};
    return parsed.status || {};
  } catch {
    return {};
  }
}

function saveCache(status: Record<string, any>): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ _date: getTodayDate(), status })
  );
}

function StatusBadge({ completed, inProgress }: { completed: boolean; inProgress: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        Completed ✓
      </span>
    );
  }
  if (inProgress) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#334155] text-[#94a3b8] border border-[#475569]">
      Not played
    </span>
  );
}

interface Game {
  id: string;
  name: string;
  icon: string;
  slug: string;
  color: string;
}

interface GameCardProps {
  game: Game;
  gameStatus: Record<string, any>;
  onMarkComplete: (gameId: string) => void;
  onMarkInProgress: (gameId: string) => void;
}

function GameCard({ game, gameStatus, onMarkComplete, onMarkInProgress }: GameCardProps) {
  const status = gameStatus[game.id] || {};
  const completed = !!status.completed;
  const inProgress = !completed && !!status.inProgress;
  const streak = status.streak || 0;
  const lastPlayed = status.lastPlayed || null;

  const borderAccent = completed
    ? "border-l-4 border-l-emerald-500"
    : "border-l-4 border-l-transparent";

  function handlePlayNow() {
    window.open(`https://www.linkedin.com/games/${game.slug}/`, "_blank", "noopener,noreferrer");
    if (!completed) {
      onMarkInProgress(game.id);
    }
  }

  return (
    <div
      className={`rounded-xl border border-[#334155] bg-[#1e293b] p-5 flex flex-col gap-4 transition-all ${borderAccent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg border ${game.color} flex items-center justify-center text-xl shrink-0`}>
            {game.icon}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {game.name}
            </p>
          </div>
        </div>
        <StatusBadge completed={completed} inProgress={inProgress} />
      </div>

      <div className="flex items-center justify-between text-xs text-[#94a3b8]">
        <span className={streak > 0 ? "text-amber-400 font-medium" : ""}>
          {streak > 0 ? `🔥 ${streak} day streak` : "No streak yet"}
        </span>
        {lastPlayed && (
          <span className="text-[#475569]">
            Last: {lastPlayed}
          </span>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={handlePlayNow}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Play Now →
        </button>
        {!completed && (
          <button
            onClick={() => onMarkComplete(game.id)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [gameStatus, setGameStatus] = useState<Record<string, any>>(loadCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/games/status")
      .then((data: any) => {
        setGameStatus(data.status || {});
        saveCache(data.status || {});
      })
      .catch(() => {
        // Fall back to cache already in state; just stop loading
      })
      .finally(() => setLoading(false));
  }, []);

  async function markComplete(gameId: string) {
    try {
      const data = await post("/games/complete", { gameId });
      setGameStatus((prev) => {
        const next = { ...prev, [gameId]: data.status };
        saveCache(next);
        return next;
      });
    } catch {
      // Silently fail — user can retry
    }
  }

  function markInProgress(gameId: string) {
    setGameStatus((prev) => {
      const current = prev[gameId] || {};
      if (current.completed || current.inProgress) return prev;
      const next = { ...prev, [gameId]: { ...current, inProgress: true } };
      saveCache(next);
      return next;
    });
  }

  const completedCount = GAMES.filter((g) => gameStatus[g.id]?.completed).length;

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Games Hub</h1>
            <p className="text-sm text-[#94a3b8] mt-1">Daily LinkedIn puzzles</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#475569] uppercase tracking-wider font-semibold">Today</p>
            <p className="text-sm text-[#94a3b8] mt-0.5">
              {loading ? (
                <span className="text-[#475569]">loading…</span>
              ) : (
                <>
                  <span className="text-emerald-400 font-bold">{completedCount}</span>
                  <span className="text-[#475569]">/{GAMES.length} completed</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#1e293b] overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(completedCount / GAMES.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              gameStatus={gameStatus}
              onMarkComplete={markComplete}
              onMarkInProgress={markInProgress}
            />
          ))}
        </div>

        {!loading && completedCount === GAMES.length && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
            <p className="text-emerald-400 font-semibold text-sm">
              🎉 All games completed for today! Come back tomorrow for new puzzles.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
