"use client";

import { motion } from "framer-motion";
import { Target, CalendarClock, Languages, SunMoon, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { strings, type Lang } from "@/lib/i18n";

const EASE = [0.16, 1, 0.3, 1] as const;

export function ProfilePanel({
  lang,
  studentName,
  studentClassLabel,
  boardLabel,
  studyGoal,
  examDaysLeft,
  onToggleLang,
  onOpenSettings,
  onClose,
}: {
  lang: Lang;
  studentName: string;
  studentClassLabel: string;
  boardLabel: string;
  studyGoal: string;
  examDaysLeft: number | null;
  onToggleLang: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="absolute bottom-full left-3 right-3 z-30 mb-3 origin-bottom overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
    >
      <div className="relative overflow-hidden p-4">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/15 via-transparent to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground ring-2 ring-accent/25">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{studentName}</p>
            <p className="truncate text-xs text-foreground-muted">
              {studentClassLabel} · {boardLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-surface-muted px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
              <Target size={11} strokeWidth={1.75} />
              {strings.studyGoalLabel[lang]}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium">
              {studyGoal.trim() || strings.notSetYet[lang]}
            </p>
          </div>
          <div className="rounded-lg bg-surface-muted px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
              <CalendarClock size={11} strokeWidth={1.75} />
              {strings.examCountdown[lang]}
            </p>
            <p className="mt-0.5 text-xs font-medium">
              {examDaysLeft !== null
                ? `${Math.max(examDaysLeft, 0)} ${strings.daysLeft[lang]}`
                : strings.notSetYet[lang]}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border p-1.5">
        <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm">
          <span className="flex items-center gap-2.5 text-foreground-muted">
            <Languages size={15} strokeWidth={1.75} />
            {strings.languageLabel[lang]}
          </span>
          <button
            onClick={onToggleLang}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-muted"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
        <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm">
          <span className="flex items-center gap-2.5 text-foreground-muted">
            <SunMoon size={15} strokeWidth={1.75} />
            {strings.appearanceLabel[lang]}
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 border-t border-border p-1.5">
        <button
          onClick={() => {
            onOpenSettings();
            onClose();
          }}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface-muted"
        >
          <Settings size={15} strokeWidth={1.75} />
          {strings.accountSettingsItem[lang]}
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-warning hover:bg-warning/10"
        >
          <LogOut size={15} strokeWidth={1.75} />
          {strings.signOut[lang]}
        </button>
      </div>
    </motion.div>
  );
}
