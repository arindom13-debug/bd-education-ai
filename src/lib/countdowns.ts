import { useEffect, useState } from "react";
import { daysUntil } from "@/lib/study-plan";

export type Countdown = {
  id: string;
  name: string;
  /** yyyy-mm-dd */
  targetDate: string;
  description?: string;
  isMain: boolean;
};

// Seed data — will later be replaced by a real per-student record from the
// backend; the shape here is intentionally what that record should look like.
export const defaultCountdowns: Countdown[] = [
  {
    id: "countdown-ssc",
    name: "SSC 2027",
    targetDate: "2027-06-15",
    description: "My SSC final examination",
    isMain: true,
  },
  {
    id: "countdown-physics",
    name: "Physics Exam",
    targetDate: "2026-08-19",
    isMain: false,
  },
];

export type CountdownState = "upcoming" | "today" | "completed";

export type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  state: CountdownState;
};

const COMPLETED: RemainingTime = { days: 0, hours: 0, minutes: 0, seconds: 0, state: "completed" };
const TODAY: RemainingTime = { days: 0, hours: 0, minutes: 0, seconds: 0, state: "today" };

export function getRemainingTime(targetDate: string): RemainingTime {
  const dayDiff = daysUntil(targetDate);
  if (dayDiff === null || dayDiff < 0) return COMPLETED;
  if (dayDiff === 0) return TODAY;

  const target = new Date(targetDate);
  target.setHours(23, 59, 59, 999);
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    state: "upcoming",
  };
}

/** Ticks a live countdown. tickMs controls update cadence — use 1000 where
 * seconds are displayed, and a coarser interval (e.g. 30s) where they aren't.
 * The remaining time is computed fresh on every render (so it's always
 * correct immediately, including when targetDate changes) — the interval
 * only forces a re-render so it keeps advancing on its own. */
export function useCountdown(targetDate: string | undefined, tickMs = 1000): RemainingTime {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => forceTick((t) => t + 1), tickMs);
    return () => clearInterval(id);
  }, [targetDate, tickMs]);

  return targetDate ? getRemainingTime(targetDate) : COMPLETED;
}

export function getMainCountdown(countdowns: Countdown[]): Countdown | null {
  return countdowns.find((c) => c.isMain) ?? countdowns[0] ?? null;
}
