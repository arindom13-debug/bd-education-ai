"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Target,
  MessageSquare,
  BookOpen,
  Wrench,
  CalendarClock,
  TrendingDown,
} from "lucide-react";
import { ModeTimer } from "@/components/mode-timer";
import { EmptyState } from "@/components/empty-state";
import { CircularProgress } from "@/components/circular-progress";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import {
  getNextRecommendedChapter,
  getSubjectProgress,
  getSubjectNextChapterLabel,
  getSubjectChaptersCompleted,
  getSubjectTotalChapters,
  type Subject,
} from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";

const EASE = [0.16, 1, 0.3, 1] as const;
const EXAM_COLOR = "#4F7CFF";

// Placeholder until exams have their own record with a real name — swap this out later.
const EXAM_NAME = { en: "SSC Examination", bn: "এসএসসি পরীক্ষা" };

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

function formatExamDate(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "bn-BD", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
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
  const weakSubjects = [...subjects]
    .filter((s) => plan.weakSubjects.includes(s.id))
    .sort((a, b) => getSubjectProgress(a) - getSubjectProgress(b));

  const overallReadiness =
    subjects.length === 0
      ? 0
      : Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length);
  const chaptersMastered = subjects.reduce((sum, s) => sum + getSubjectChaptersCompleted(s), 0);
  const chaptersTotal = subjects.reduce((sum, s) => sum + getSubjectTotalChapters(s), 0);

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
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

        {/* Tier 1 — exam identity, live countdown, single primary action */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-col items-center gap-1 rounded-2xl border p-8 text-center"
          style={{ borderColor: `${EXAM_COLOR}33` }}
        >
          <p className="text-sm font-medium" style={{ color: EXAM_COLOR }}>
            {EXAM_NAME[lang]}
          </p>
          {remainingDays !== null && (
            <p className="text-xs text-foreground-muted">{formatExamDate(plan.examDate, lang)}</p>
          )}
          <p className="mt-4 text-xs font-medium uppercase tracking-wide" style={{ color: EXAM_COLOR }}>
            {strings.examCountdown[lang]}
          </p>
          {remainingDays !== null ? (
            <>
              <motion.p
                key={remainingDays}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="text-6xl font-bold tabular-nums tracking-tight"
                style={{ color: EXAM_COLOR }}
              >
                {Math.max(remainingDays, 0)}
              </motion.p>
              <p className="text-sm text-foreground-muted">{strings.daysLeft[lang]}</p>
              <button
                onClick={() => onNavigate("chat")}
                style={{ backgroundColor: EXAM_COLOR }}
                className="mt-5 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
              >
                {strings.startRevisionBtn[lang]}
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
                accentColor={EXAM_COLOR}
              />
            </div>
          )}
        </motion.div>

        {/* Tier 2 — glanceable readiness stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4">
            <CircularProgress value={overallReadiness} size={56} strokeWidth={5} />
            <p className="text-center text-xs text-foreground-muted">
              {strings.syllabusReadinessLabel[lang]}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-2xl font-semibold tabular-nums" style={{ color: EXAM_COLOR }}>
              {chaptersMastered}/{chaptersTotal}
            </p>
            <p className="text-xs text-foreground-muted">{strings.topicsMasteredLabel[lang]}</p>
          </div>
        </div>

        {/* Tier 3 — what needs attention, in priority order */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Target size={13} strokeWidth={1.75} />
            {strings.weakTopics[lang]}
          </p>
          {weakSubjects.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              title={strings.noWeakTopicsYet[lang]}
              description={strings.weakTopicsEmptyDesc[lang]}
              ctaLabel={strings.addWeakTopicsBtn[lang]}
              onCtaClick={() => onNavigate("setup")}
              accentColor={EXAM_COLOR}
              compact
            />
          ) : (
            <div className="flex flex-col gap-2">
              {weakSubjects.map((s, i) => {
                const topic = getSubjectNextChapterLabel(s, lang);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2"
                    style={{ backgroundColor: `${EXAM_COLOR}0d` }}
                  >
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: EXAM_COLOR }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.name[lang]}</p>
                      {topic && <p className="truncate text-xs text-foreground-muted">{topic}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tier 3 — the recommended revision session */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Sparkles size={13} strokeWidth={1.75} />
            {strings.aiRevisionPlan[lang]}
          </p>
          {recommended && (
            <p className="mb-3 text-sm">
              <span className="font-medium">{recommended.chapter.name[lang]}</span>{" "}
              <span className="text-foreground-muted">
                — {recommended.subjectName[lang]} · {recommended.chapter.estimatedMinutes ?? 20}{" "}
                {strings.minutesShort[lang]}
              </span>
            </p>
          )}
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

        {/* Tier 4 — supporting tools, deliberately quieter */}
        <div className="rounded-xl border border-border p-4">
          <ModeTimer lang={lang} presets={timerPresets} color={EXAM_COLOR} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigate("chat")}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <MessageSquare size={14} strokeWidth={1.75} />
            {strings.chat[lang]}
          </button>
          <button
            onClick={() => onNavigate("study")}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <BookOpen size={14} strokeWidth={1.75} />
            {strings.studyPlan[lang]}
          </button>
          <button
            onClick={() => onNavigate("tools")}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Wrench size={14} strokeWidth={1.75} />
            {strings.toolsNav[lang]}
          </button>
        </div>
      </div>
    </div>
  );
}
