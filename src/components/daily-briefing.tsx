"use client";

import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Flame, CalendarClock, ArrowRight } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { getNextRecommendedChapter, suggestedTopic, type Subject } from "@/lib/curriculum-data";
import { daysUntil } from "@/lib/study-plan";
import { getGreeting, getRecommendationSentence, getProgressObservation } from "@/lib/daily-briefing";

const EASE = [0.16, 1, 0.3, 1] as const;

export function DailyBriefing({
  lang,
  studentName,
  examDate,
  streakDays,
  yesterdayMinutes,
  subjects,
  weakSubjectIds,
  onStartStudying,
}: {
  lang: Lang;
  studentName: string;
  examDate: string;
  streakDays: number;
  yesterdayMinutes: number;
  subjects: Subject[];
  weakSubjectIds: string[];
  onStartStudying: () => void;
}) {
  const greeting = getGreeting(lang, studentName);
  const examDaysLeft = daysUntil(examDate);
  const observation = getProgressObservation(lang, subjects, weakSubjectIds);

  const recommended = getNextRecommendedChapter(subjects);
  const chapterName = recommended?.chapter.name[lang] ?? suggestedTopic.chapterName[lang];
  const chapterStatus = recommended?.chapter.status ?? "in-progress";
  const recommendationSentence = getRecommendationSentence(lang, chapterName, chapterStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-accent/25 bg-surface p-5 text-left sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-transparent" />
      <div className="relative flex flex-col gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="flex"
            >
              <Sparkles size={13} strokeWidth={1.75} />
            </motion.span>
            {strings.dailyBriefingLabel[lang]}
          </p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight sm:text-xl">{greeting}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} strokeWidth={1.75} className="text-success" />
            {strings.studiedLabel[lang]} {yesterdayMinutes} {strings.minutesShort[lang]}
          </span>
          <span className="flex items-center gap-1.5">
            <Flame size={13} strokeWidth={1.75} className="text-warning" />
            {streakDays} {strings.streak[lang]}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarClock size={13} strokeWidth={1.75} className="text-accent" />
            {examDaysLeft !== null
              ? `${Math.max(examDaysLeft, 0)} ${strings.daysLeft[lang]}`
              : strings.notSetYet[lang]}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-foreground">{observation}</p>

        <div className="flex flex-col gap-3 rounded-xl border border-accent/20 bg-accent-soft p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-accent">
              {strings.todaysRecommendationLabel[lang]}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium">{recommendationSentence}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15 }}
            onClick={onStartStudying}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground"
          >
            {strings.startStudyingBtn[lang]}
            <ArrowRight size={14} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
