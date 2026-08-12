"use client";

import { motion } from "framer-motion";
import { Target, CalendarClock, Flame, Clock, Languages, Settings, LogOut } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { streakDays } from "@/lib/curriculum-data";
import { daysUntil, examTargetOptions, curriculumTrackOptions, type StudyPlan } from "@/lib/study-plan";
import type { ChatLanguage } from "@/lib/chat-language";

const CHAT_LANGUAGE_OPTIONS: { value: ChatLanguage; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
  { value: "banglish", label: "Banglish" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

function formatMinutes(total: number, lang: Lang): string {
  if (total < 60) return `${total} ${strings.minutesShort[lang]}`;
  const hours = Math.round(total / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

function StatCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
        <Icon size={11} strokeWidth={1.75} />
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium">{value}</p>
    </div>
  );
}

export function ProfilePanel({
  lang,
  studentName,
  studentClassLabel,
  plan,
  chatLanguage,
  onChangeChatLanguage,
  onOpenSettings,
  onClose,
}: {
  lang: Lang;
  studentName: string;
  studentClassLabel: string;
  plan: StudyPlan;
  chatLanguage: ChatLanguage;
  onChangeChatLanguage: (value: ChatLanguage) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  const boardLabel = curriculumTrackOptions.find((o) => o.value === plan.curriculumTrack)?.label[lang] ?? "";
  const examTargetLabel = examTargetOptions.find((o) => o.value === plan.examTarget)?.label[lang] ?? "";
  const examDaysLeft = daysUntil(plan.examDate);
  const examSummary = [examTargetLabel, examDaysLeft !== null ? `${Math.max(examDaysLeft, 0)} ${strings.daysLeft[lang]}` : ""]
    .filter(Boolean)
    .join(" · ");
  const weeklyMinutes = plan.dailyMinutes * 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="absolute bottom-full left-3 right-3 z-30 mb-3 origin-bottom overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
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
          <StatCell
            icon={CalendarClock}
            label={strings.examLabel[lang]}
            value={examSummary || strings.notSetYet[lang]}
          />
          <StatCell icon={Flame} label={strings.currentStreakLabel[lang]} value={`${streakDays} ${strings.streak[lang]}`} />
          <StatCell
            icon={Clock}
            label={strings.weeklyStudyTimeLabel[lang]}
            value={formatMinutes(weeklyMinutes, lang)}
          />
          <StatCell
            icon={Target}
            label={strings.studyGoalLabel[lang]}
            value={plan.goal.trim() || strings.notSetYet[lang]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 border-t border-border p-2.5">
        <span className="flex items-center gap-2.5 px-1 text-sm text-foreground-muted">
          <Languages size={15} strokeWidth={1.75} />
          {strings.languageLabel[lang]}
        </span>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
          {CHAT_LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeChatLanguage(opt.value)}
              className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors duration-150 ${
                chatLanguage === opt.value
                  ? "bg-accent-soft text-accent"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
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
