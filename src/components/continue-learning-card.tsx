"use client";

import { motion } from "framer-motion";
import { PlayCircle, Clock, History, ArrowRight, BookOpen } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { CircularProgress } from "@/components/circular-progress";
import { EmptyState } from "@/components/empty-state";
import { getActiveChapter, type Subject } from "@/lib/curriculum-data";

const EASE = [0.16, 1, 0.3, 1] as const;

function formatMinutes(total: number, lang: Lang): string {
  if (total < 60) return `${total} ${strings.minutesShort[lang]}`;
  const hours = Math.round(total / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

function formatLastStudied(daysAgo: number, lang: Lang): string {
  if (daysAgo === 0) return strings.today[lang];
  if (daysAgo === 1) return strings.yesterday[lang];
  return `${daysAgo} ${strings.daysAgo[lang]}`;
}

export function ContinueLearningCard({
  lang,
  subjects,
  onContinue,
}: {
  lang: Lang;
  subjects: Subject[];
  onContinue: () => void;
}) {
  const active = getActiveChapter(subjects);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: "0 14px 32px -16px var(--color-accent)" }}
      transition={{ duration: 0.3, ease: EASE }}
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-accent/30 bg-surface p-5 text-left transition-colors duration-200 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/14 via-accent/5 to-transparent" />
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--color-accent)", opacity: 0.14 }}
      />

      {active ? (
        (() => {
          const { subject, chapter } = active;
          const estimatedMinutes = chapter.estimatedMinutes ?? 20;
          const remainingMinutes = Math.max(0, Math.round(estimatedMinutes * (1 - chapter.progress / 100)));
          return (
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <CircularProgress value={chapter.progress} size={60} strokeWidth={5} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                    <PlayCircle size={13} strokeWidth={1.75} />
                    {strings.continueLearning[lang]}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {subject.name[lang]}
                  </p>
                  <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
                    {chapter.name[lang]}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} strokeWidth={1.75} />
                      {formatMinutes(remainingMinutes, lang)} {strings.timeLeftSuffix[lang]}
                    </span>
                    <span className="flex items-center gap-1">
                      <History size={11} strokeWidth={1.75} />
                      {formatLastStudied(subject.lastStudiedDaysAgo, lang)}
                    </span>
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onClick={onContinue}
                className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground sm:self-auto"
              >
                {strings.continueBtn[lang]}
                <ArrowRight size={15} strokeWidth={2} />
              </motion.button>
            </div>
          );
        })()
      ) : (
        <div className="relative">
          <EmptyState
            icon={BookOpen}
            title={strings.noActiveSessionTitle[lang]}
            description={strings.noActiveSessionDesc[lang]}
            ctaLabel={strings.startLearning[lang]}
            onCtaClick={onContinue}
          />
        </div>
      )}
    </motion.div>
  );
}
