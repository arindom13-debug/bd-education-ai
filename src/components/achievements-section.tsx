"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, type LucideIcon } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { achievements, type AchievementContext } from "@/lib/achievements-data";
import type { Subject } from "@/lib/curriculum-data";
import { ToastStack, type ToastItem } from "@/components/toast";

const SEEN_KEY = "achievements-seen";

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
  } catch {
    // storage unavailable — unlock animation simply won't be remembered
  }
}

const CONFETTI_COLORS = ["var(--color-foreground)", "var(--color-accent)", "var(--color-foreground-muted)"];

function ConfettiBurst() {
  const pieces = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const distance = 34 + (i % 3) * 11;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - 10;
        const rotate = ((i * 47) % 180) - 90;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{ opacity: 0, x, y, rotate, scale: 0.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 size-1.5 rounded-[2px]"
            style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
          />
        );
      })}
    </div>
  );
}

function AchievementCard({
  title,
  description,
  icon: Icon,
  unlocked,
  justUnlocked,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  justUnlocked: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={justUnlocked ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-colors duration-300 ${
        unlocked ? "border-foreground/15 bg-surface" : "border-border bg-surface-muted/40 opacity-50"
      }`}
    >
      {justUnlocked && (
        <>
          <motion.div
            initial={{ opacity: 0.35, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.7 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ background: "radial-gradient(circle, var(--color-foreground) 0%, transparent 70%)" }}
          />
          <ConfettiBurst />
        </>
      )}
      <div
        className={`flex size-11 items-center justify-center rounded-full border ${
          unlocked ? "border-foreground/20 bg-foreground/5 text-foreground" : "border-border text-foreground-muted"
        }`}
      >
        {unlocked ? <Icon size={19} strokeWidth={1.5} /> : <Lock size={16} strokeWidth={1.75} />}
      </div>
      <p className={`text-xs font-semibold tracking-tight ${unlocked ? "text-foreground" : "text-foreground-muted"}`}>
        {title}
      </p>
      <p className="text-[11px] leading-snug text-foreground-muted">{description}</p>
    </motion.div>
  );
}

export function AchievementsSection({
  lang,
  subjects,
  streakDays,
  weeklyMinutesTotal,
}: {
  lang: Lang;
  subjects: Subject[];
  streakDays: number;
  weeklyMinutesTotal: number;
}) {
  const hour = new Date().getHours();
  const studiedToday = subjects.some((s) => s.lastStudiedDaysAgo === 0);
  const ctx: AchievementContext = { subjects, streakDays, weeklyMinutesTotal, studiedToday, hour };
  const unlockedIds = achievements.filter((a) => a.isUnlocked(ctx)).map((a) => a.id);

  // Snapshot which achievements are newly unlocked (vs. previously seen) exactly once, at mount.
  const [freshIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const seen = loadSeen();
    return unlockedIds.filter((id) => !seen.has(id));
  });
  const [justUnlockedIds, setJustUnlockedIds] = useState<Set<string>>(() => new Set(freshIds));
  const [toasts, setToasts] = useState<ToastItem[]>(() =>
    freshIds.map((id) => {
      const a = achievements.find((item) => item.id === id)!;
      return { id, title: strings.achievementUnlockedLabel[lang], description: a.title[lang], icon: a.icon };
    })
  );

  useEffect(() => {
    if (freshIds.length === 0) return;
    const seen = loadSeen();
    freshIds.forEach((id) => seen.add(id));
    saveSeen(seen);
    const glowTimer = setTimeout(() => setJustUnlockedIds(new Set()), 1300);
    const toastTimer = setTimeout(() => setToasts([]), 4000);
    return () => {
      clearTimeout(glowTimer);
      clearTimeout(toastTimer);
    };
    // freshIds is computed once via lazy state init and intentionally never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <ToastStack toasts={toasts} />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.achievementsLabel[lang]}
        </p>
        <span className="text-xs tabular-nums text-foreground-muted">
          {unlockedIds.length}/{achievements.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {achievements.map((a) => (
          <AchievementCard
            key={a.id}
            title={a.title[lang]}
            description={a.description[lang]}
            icon={a.icon}
            unlocked={unlockedIds.includes(a.id)}
            justUnlocked={justUnlockedIds.has(a.id)}
          />
        ))}
      </div>
    </div>
  );
}
