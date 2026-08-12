"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, HelpCircle, Sparkles, CheckCircle2, CalendarClock, Target, Clock } from "lucide-react";
import { ModeTimer } from "@/components/mode-timer";
import { EmptyState } from "@/components/empty-state";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import { getSubjectProgress, getSubjectNextChapterLabel, type Subject } from "@/lib/curriculum-data";
import { type StudyPlan } from "@/lib/study-plan";
import { mostImportantQuestions, lastMinuteFacts } from "@/lib/tools-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const sessionPresets = [
  { minutes: 30, label: { en: "30 min", bn: "৩০ মিনিট" } },
  { minutes: 60, label: { en: "60 min", bn: "৬০ মিনিট" } },
  { minutes: 90, label: { en: "90 min", bn: "৯০ মিনিট" } },
];

type ExactRemaining = { days: number; hours: number; minutes: number };

function getExactRemaining(examDate: string): ExactRemaining | null {
  if (!examDate) return null;
  const target = new Date(examDate);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(23, 59, 59, 999);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(diffMs / 60000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

function formatStudyTime(totalMinutes: number, lang: Lang): string {
  if (totalMinutes < 60) return `${totalMinutes} ${strings.minutesShort[lang]}`;
  const hours = Math.round(totalMinutes / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

export function PanicRevisionView({
  lang,
  plan,
  subjects,
  onNavigate,
}: {
  lang: Lang;
  plan: StudyPlan;
  subjects: Subject[];
  onNavigate: (view: CanvasView) => void;
}) {
  // A tick counter (not the value itself) drives re-renders so the countdown
  // stays live — the actual remaining time is always derived fresh below.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = getExactRemaining(plan.examDate);
  const availableMinutes = remaining ? remaining.days * plan.dailyMinutes : 0;

  // Priority tiers — a placeholder heuristic (weak-flag + progress) until real
  // performance/exam-weightage data can drive this.
  const mustKnow = subjects.filter((s) => plan.weakSubjects.includes(s.id));
  const rest = subjects.filter((s) => !plan.weakSubjects.includes(s.id));
  const shouldKnow = rest.filter((s) => getSubjectProgress(s) < 70);
  const ifTimeAllows = rest.filter((s) => getSubjectProgress(s) >= 70);

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <button
          onClick={() => onNavigate("chat")}
          className="flex w-fit items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          {strings.exitMode[lang]}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Zap size={24} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.panicBtn[lang]}</h1>
            <p className="text-sm text-foreground-muted">{strings.panicPageTagline[lang]}</p>
          </div>
        </div>

        {/* Tier 1 — exact countdown, available study time, one primary action */}
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-warning">
            {strings.timeRemainingLabel[lang]}
          </p>
          {remaining ? (
            <>
              <motion.div
                key={`${remaining.days}-${remaining.hours}-${remaining.minutes}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 tabular-nums text-warning"
              >
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">{remaining.days}</span>
                <span className="text-sm font-semibold">{strings.daysShort[lang]}</span>
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">{remaining.hours}</span>
                <span className="text-sm font-semibold">{strings.hoursShort[lang]}</span>
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">{remaining.minutes}</span>
                <span className="text-sm font-semibold">{strings.minutesShort[lang]}</span>
              </motion.div>

              <p className="mt-4 text-xs text-foreground-muted">
                {strings.availableStudyTimeLabel[lang]}:{" "}
                <span className="font-medium text-foreground">{formatStudyTime(availableMinutes, lang)}</span>
              </p>

              <button
                onClick={() => onNavigate("chat")}
                className="mt-5 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-transform active:scale-95"
              >
                {strings.startRescueSessionBtn[lang]}
              </button>
            </>
          ) : (
            <div className="mt-2">
              <EmptyState
                icon={CalendarClock}
                title={strings.noExamDateYet[lang]}
                description={strings.examDateEmptyDesc[lang]}
                ctaLabel={strings.setExamDateBtn[lang]}
                onCtaClick={() => onNavigate("setup")}
              />
            </div>
          )}
        </div>

        {/* Tier 2 — the priority hierarchy: Must Know / Should Know / If Time Allows */}
        <div>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            {strings.highestPriorityChapters[lang]}
          </p>
          <div className="flex flex-col gap-3">
            {mustKnow.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <Target size={14} strokeWidth={1.75} className="text-warning" />
                  <p className="text-sm font-semibold tracking-tight text-warning">
                    1. {strings.mustKnowLabel[lang]}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {mustKnow.map((s) => {
                    const topic = getSubjectNextChapterLabel(s, lang);
                    return (
                      <div key={s.id} className="rounded-lg bg-background px-3 py-2">
                        <p className="text-sm font-medium">{s.name[lang]}</p>
                        {topic && <p className="text-xs text-foreground-muted">{topic}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {shouldKnow.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <CheckCircle2 size={14} strokeWidth={1.75} className="text-foreground-muted" />
                  <p className="text-sm font-semibold tracking-tight">2. {strings.shouldKnowLabel[lang]}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {shouldKnow.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted"
                    >
                      {s.name[lang]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {ifTimeAllows.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Clock size={14} strokeWidth={1.75} className="text-foreground-muted" />
                  <p className="text-sm font-semibold tracking-tight">3. {strings.ifTimeAllowsLabel[lang]}</p>
                </div>
                <p className="mb-2.5 text-xs text-foreground-muted">{strings.ifTimeAllowsDesc[lang]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {ifTimeAllows.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-border px-3 py-1 text-xs text-foreground-muted"
                    >
                      {s.name[lang]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Supporting cram content */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <HelpCircle size={13} strokeWidth={1.75} />
              {strings.mostImportantQuestionsTitle[lang]}
            </p>
            <div className="flex flex-col gap-2.5">
              {mostImportantQuestions.map((q, i) => (
                <p key={i} className="text-sm leading-snug">
                  <span className="font-semibold text-foreground">Q{i + 1}.</span>{" "}
                  {q[lang]}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <CheckCircle2 size={13} strokeWidth={1.75} />
              {strings.lastMinuteRevisionTitle[lang]}
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {lastMinuteFacts.map((fact, i) => (
                <div
                  key={i}
                  className="w-56 shrink-0 rounded-xl bg-surface-muted px-4 py-3 text-xs font-medium leading-snug"
                >
                  {fact[lang]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tier 3 — supporting tools, deliberately quieter */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              <Sparkles size={13} strokeWidth={1.75} />
              {strings.aiCrashCourseTitle[lang]}
            </p>
            <p className="mt-1.5 text-xs text-foreground-muted">{strings.aiCrashCourseDesc[lang]}</p>
            <button
              onClick={() => onNavigate("chat")}
              className="mt-3 rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              {strings.startCrashCourseBtn[lang]}
            </button>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              <HelpCircle size={13} strokeWidth={1.75} />
              {strings.quickMcqTitle[lang]}
            </p>
            <p className="mt-1.5 text-xs text-foreground-muted">{strings.quickMcqDesc[lang]}</p>
            <button
              onClick={() => onNavigate("chat")}
              className="mt-3 rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              {strings.startMcqBtn[lang]}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.revisionSessions[lang]}
          </p>
          <ModeTimer lang={lang} presets={sessionPresets} tone="warning" />
        </div>
      </div>
    </div>
  );
}
