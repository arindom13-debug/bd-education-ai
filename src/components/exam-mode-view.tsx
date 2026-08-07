"use client";

import { ArrowLeft, GraduationCap, Clock, Sparkles, Target, MessageSquare, BookOpen, Wrench } from "lucide-react";
import { ModeTimer } from "@/components/mode-timer";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import { getNextRecommendedChapter, getSubjectRemainingMinutes, type Subject } from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";

const EXAM_COLOR = "#4F7CFF";

const timerPresets = [
  { minutes: 25, label: { en: "Focus", bn: "ফোকাস" } },
  { minutes: 5, label: { en: "Short break", bn: "ছোট বিরতি" } },
  { minutes: 15, label: { en: "Long break", bn: "লম্বা বিরতি" } },
];

const revisionSteps = [
  { en: "Review Chemical Reactions notes", bn: "রাসায়নিক বিক্রিয়ার নোট পর্যালোচনা করো" },
  { en: "Practice 10 MCQs on the Periodic Table", bn: "পর্যায় সারণির উপর ১০টি এমসিকিউ অনুশীলন করো" },
  { en: "Skim through the Behaviour of Gases summary", bn: "গ্যাসের আচরণের সারাংশ দ্রুত দেখে নাও" },
];

function formatMinutes(total: number, lang: Lang): string {
  if (total < 60) return `${total} ${strings.minutesShort[lang]}`;
  const hours = Math.round(total / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

export function ExamModeView({
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
  const recommended = getNextRecommendedChapter(subjects);
  const weakSubjects = subjects.filter((s) => plan.weakSubjects.includes(s.id));
  const totalMinutesLeft = subjects.reduce((sum, s) => sum + getSubjectRemainingMinutes(s), 0);

  return (
    <div
      className="p-5 sm:p-8"
      style={{ background: `radial-gradient(circle at top, ${EXAM_COLOR}14, transparent 55%)` }}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-7">
        <button
          onClick={() => onNavigate("chat")}
          className="flex w-fit items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          {strings.exitMode[lang]}
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="flex size-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${EXAM_COLOR}1f`, color: EXAM_COLOR }}
          >
            <GraduationCap size={28} strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{strings.examModeBtn[lang]}</h1>
          <p className="text-sm text-foreground-muted">{strings.examModeTagline[lang]}</p>
        </div>

        {/* Exam Countdown */}
        <div
          className="flex flex-col items-center gap-1 rounded-2xl border p-8 text-center"
          style={{ borderColor: `${EXAM_COLOR}33` }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: EXAM_COLOR }}>
            {strings.examCountdown[lang]}
          </p>
          {remainingDays !== null ? (
            <>
              <p className="text-6xl font-bold tabular-nums tracking-tight" style={{ color: EXAM_COLOR }}>
                {Math.max(remainingDays, 0)}
              </p>
              <p className="text-sm text-foreground-muted">{strings.daysLeft[lang]}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-foreground-muted">{strings.noExamDateYet[lang]}</p>
          )}
        </div>

        {/* Today's Priority */}
        {recommended && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {strings.todaysPriority[lang]}
            </p>
            <p className="mt-1.5 text-base font-medium">{recommended.chapter.name[lang]}</p>
            <p className="text-sm text-foreground-muted">
              {recommended.subjectName[lang]} • {recommended.chapter.estimatedMinutes ?? 20}{" "}
              {strings.minutesShort[lang]}
            </p>
            <button
              onClick={() => onNavigate("chat")}
              style={{ backgroundColor: EXAM_COLOR }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white transition-transform active:scale-95"
            >
              {strings.startStudyingBtn[lang]}
            </button>
          </div>
        )}

        {/* Time Remaining */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${EXAM_COLOR}1f`, color: EXAM_COLOR }}
          >
            <Clock size={18} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {strings.timeRemaining[lang]}
            </p>
            <p className="text-base font-medium">{formatMinutes(totalMinutesLeft, lang)}</p>
          </div>
        </div>

        {/* AI Revision Plan */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Sparkles size={13} strokeWidth={1.75} />
            {strings.aiRevisionPlan[lang]}
          </p>
          <div className="flex flex-col gap-2.5">
            {revisionSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: `${EXAM_COLOR}1f`, color: EXAM_COLOR }}
                >
                  {i + 1}
                </span>
                {step[lang]}
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Target size={13} strokeWidth={1.75} />
            {strings.weakTopics[lang]}
          </p>
          {weakSubjects.length === 0 ? (
            <p className="text-sm text-foreground-muted">{strings.noWeakTopicsYet[lang]}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {weakSubjects.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${EXAM_COLOR}1f`, color: EXAM_COLOR }}
                >
                  {s.name[lang]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <ModeTimer lang={lang} presets={timerPresets} color={EXAM_COLOR} />
        </div>

        {/* Quick Start */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.quickStart[lang]}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate("chat")}
              style={{ borderColor: `${EXAM_COLOR}55`, color: EXAM_COLOR }}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-transform active:scale-95"
            >
              <MessageSquare size={14} strokeWidth={1.75} />
              {strings.chat[lang]}
            </button>
            <button
              onClick={() => onNavigate("study")}
              style={{ borderColor: `${EXAM_COLOR}55`, color: EXAM_COLOR }}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-transform active:scale-95"
            >
              <BookOpen size={14} strokeWidth={1.75} />
              {strings.studyPlan[lang]}
            </button>
            <button
              onClick={() => onNavigate("tools")}
              style={{ borderColor: `${EXAM_COLOR}55`, color: EXAM_COLOR }}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-transform active:scale-95"
            >
              <Wrench size={14} strokeWidth={1.75} />
              {strings.toolsNav[lang]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
