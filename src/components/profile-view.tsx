"use client";

import { Target, CalendarClock, Flame, Clock, Settings, Compass, type LucideIcon } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { streakDays } from "@/lib/curriculum-data";
import { daysUntil, examTargetOptions, curriculumTrackOptions, type StudyPlan } from "@/lib/study-plan";
import type { CanvasView } from "@/components/sidebar";

function formatMinutes(total: number, lang: Lang): string {
  if (total < 60) return `${total} ${strings.minutesShort[lang]}`;
  const hours = Math.round(total / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

function StatCell({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
        <Icon size={11} strokeWidth={1.75} />
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

export function ProfileView({
  lang,
  studentName,
  studentClassLabel,
  plan,
  onNavigate,
}: {
  lang: Lang;
  studentName: string;
  studentClassLabel: string;
  plan: StudyPlan;
  onNavigate: (view: CanvasView) => void;
}) {
  const boardLabel = curriculumTrackOptions.find((o) => o.value === plan.curriculumTrack)?.label[lang] ?? "";
  const examTargetLabel = examTargetOptions.find((o) => o.value === plan.examTarget)?.label[lang] ?? "";
  const examDaysLeft = daysUntil(plan.examDate);
  const examSummary = [examTargetLabel, examDaysLeft !== null ? `${Math.max(examDaysLeft, 0)} ${strings.daysLeft[lang]}` : ""]
    .filter(Boolean)
    .join(" · ");
  const weeklyMinutes = plan.dailyMinutes * 7;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.profilePageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.profilePageSubtitle[lang]}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground ring-2 ring-accent/25">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-tight">{studentName}</p>
              <p className="truncate text-sm text-foreground-muted">
                {studentClassLabel} · {boardLabel}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
            <StatCell icon={CalendarClock} label={strings.examLabel[lang]} value={examSummary || strings.notSetYet[lang]} />
            <StatCell icon={Flame} label={strings.currentStreakLabel[lang]} value={`${streakDays} ${strings.streak[lang]}`} />
            <StatCell icon={Clock} label={strings.weeklyStudyTimeLabel[lang]} value={formatMinutes(weeklyMinutes, lang)} />
            <StatCell icon={Target} label={strings.studyGoalLabel[lang]} value={plan.goal.trim() || strings.notSetYet[lang]} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.profileAccountDetailsLabel[lang]}
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-border py-2.5 text-sm">
              <span className="text-foreground-muted">{strings.profilePlanLabel[lang]}</span>
              <span className="font-medium">{strings.profileFreePlanLabel[lang]}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-foreground-muted">{strings.profileMemberSinceLabel[lang]}</span>
              <span className="font-medium">{lang === "en" ? "August 2026" : "আগস্ট ২০২৬"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate("settings")}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Settings size={14} strokeWidth={1.75} />
            {strings.profileGoToSettingsBtn[lang]}
          </button>
          <button
            onClick={() => onNavigate("setup")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Compass size={14} strokeWidth={1.75} />
            {strings.profileGoToLearningProfileBtn[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}
