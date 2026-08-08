"use client";

import { ArrowLeft, Zap, ListOrdered, HelpCircle, Sparkles, CheckCircle2, CalendarClock } from "lucide-react";
import { ModeTimer } from "@/components/mode-timer";
import { EmptyState } from "@/components/empty-state";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import { getNextRecommendedChapter, type Subject } from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";
import { mostImportantQuestions, lastMinuteFacts } from "@/lib/tools-data";

const PANIC_COLOR = "#F59E0B";
const PANIC_ON_COLOR = "#1f1300";

const sessionPresets = [
  { minutes: 30, label: { en: "30 min", bn: "৩০ মিনিট" } },
  { minutes: 60, label: { en: "60 min", bn: "৬০ মিনিট" } },
  { minutes: 90, label: { en: "90 min", bn: "৯০ মিনিট" } },
];

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
  const remainingDays = daysUntil(plan.examDate);
  const hoursLeft = remainingDays !== null ? Math.max(remainingDays, 0) * 24 : null;
  const weakSubjects = subjects.filter((s) => plan.weakSubjects.includes(s.id));
  const priorityChapters = (weakSubjects.length > 0 ? weakSubjects : subjects.slice(0, 3))
    .slice(0, 3)
    .map((s) => {
      const rec = getNextRecommendedChapter([s]);
      return { subject: s, label: rec ? rec.chapter.name[lang] : s.name[lang] };
    });

  return (
    <div
      className="p-5 sm:p-8"
      style={{ background: `linear-gradient(180deg, ${PANIC_COLOR}17, transparent 40%)` }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <button
          onClick={() => onNavigate("chat")}
          className="flex w-fit items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          {strings.exitMode[lang]}
        </button>

        <div className="flex items-center gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${PANIC_COLOR}22`, color: PANIC_COLOR }}
          >
            <Zap size={24} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{strings.panicBtn[lang]}</h1>
            <p className="text-sm text-foreground-muted">{strings.panicPageTagline[lang]}</p>
          </div>
        </div>

        {/* Hours left hero */}
        <div
          className="rounded-2xl border p-6 text-center"
          style={{ borderColor: `${PANIC_COLOR}44`, backgroundColor: `${PANIC_COLOR}0d` }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: PANIC_COLOR }}>
            {strings.hoursLeftLabel[lang]}
          </p>
          {hoursLeft !== null ? (
            <p className="text-6xl font-black tabular-nums tracking-tight" style={{ color: PANIC_COLOR }}>
              {hoursLeft}
            </p>
          ) : (
            <div className="mt-2">
              <EmptyState
                icon={CalendarClock}
                title={strings.noExamDateYet[lang]}
                description={strings.examDateEmptyDesc[lang]}
                ctaLabel={strings.setExamDateBtn[lang]}
                onCtaClick={() => onNavigate("setup")}
                accentColor={PANIC_COLOR}
                onAccentColor={PANIC_ON_COLOR}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Highest priority chapters */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <ListOrdered size={13} strokeWidth={1.75} />
              {strings.highestPriorityChapters[lang]}
            </p>
            <div className="flex flex-col gap-2">
              {priorityChapters.map((item, i) => (
                <div
                  key={item.subject.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                  style={{ backgroundColor: `${PANIC_COLOR}14` }}
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: PANIC_COLOR, color: PANIC_ON_COLOR }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.label}</p>
                    <p className="truncate text-xs text-foreground-muted">{item.subject.name[lang]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most important questions */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <HelpCircle size={13} strokeWidth={1.75} />
              {strings.mostImportantQuestionsTitle[lang]}
            </p>
            <div className="flex flex-col gap-2.5">
              {mostImportantQuestions.map((q, i) => (
                <p key={i} className="text-sm leading-snug">
                  <span className="font-bold" style={{ color: PANIC_COLOR }}>
                    Q{i + 1}.
                  </span>{" "}
                  {q[lang]}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Last-minute revision */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            <CheckCircle2 size={13} strokeWidth={1.75} />
            {strings.lastMinuteRevisionTitle[lang]}
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {lastMinuteFacts.map((fact, i) => (
              <div
                key={i}
                className="w-56 shrink-0 rounded-xl px-4 py-3 text-xs font-medium leading-snug"
                style={{ backgroundColor: `${PANIC_COLOR}14` }}
              >
                {fact[lang]}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* AI Crash Course */}
          <div className="rounded-2xl border p-5" style={{ borderColor: `${PANIC_COLOR}33` }}>
            <p
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: PANIC_COLOR }}
            >
              <Sparkles size={13} strokeWidth={1.75} />
              {strings.aiCrashCourseTitle[lang]}
            </p>
            <p className="mt-1.5 text-sm text-foreground-muted">{strings.aiCrashCourseDesc[lang]}</p>
            <button
              onClick={() => onNavigate("chat")}
              style={{ backgroundColor: PANIC_COLOR, color: PANIC_ON_COLOR }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
            >
              {strings.startCrashCourseBtn[lang]}
            </button>
          </div>

          {/* Quick MCQ practice */}
          <div className="rounded-2xl border p-5" style={{ borderColor: `${PANIC_COLOR}33` }}>
            <p
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
              style={{ color: PANIC_COLOR }}
            >
              <HelpCircle size={13} strokeWidth={1.75} />
              {strings.quickMcqTitle[lang]}
            </p>
            <p className="mt-1.5 text-sm text-foreground-muted">{strings.quickMcqDesc[lang]}</p>
            <button
              onClick={() => onNavigate("chat")}
              style={{ backgroundColor: PANIC_COLOR, color: PANIC_ON_COLOR }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold transition-transform active:scale-95"
            >
              {strings.startMcqBtn[lang]}
            </button>
          </div>
        </div>

        {/* Revision sessions */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            {strings.revisionSessions[lang]}
          </p>
          <ModeTimer lang={lang} presets={sessionPresets} color={PANIC_COLOR} onColor={PANIC_ON_COLOR} />
        </div>
      </div>
    </div>
  );
}
