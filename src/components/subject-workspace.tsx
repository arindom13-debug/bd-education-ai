"use client";

import { motion } from "framer-motion";
import { History, MessageSquare, Dumbbell, RotateCcw } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { getSubjectProgress, type Subject } from "@/lib/curriculum-data";
import { getCurrentTopic, getNextTopic, formatLastStudied } from "@/lib/subject-workspace";

const EASE = [0.16, 1, 0.3, 1] as const;

const actionButtonClass =
  "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:border-accent/50 hover:text-accent";

export function SubjectWorkspace({
  lang,
  subject,
  onAskAi,
  onPractice,
  onRevise,
}: {
  lang: Lang;
  subject: Subject;
  onAskAi: () => void;
  onPractice: () => void;
  onRevise: () => void;
}) {
  const progress = getSubjectProgress(subject);
  const currentTopic = getCurrentTopic(subject, lang);
  const nextTopic = getNextTopic(subject, lang);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="w-full max-w-2xl overflow-hidden"
    >
      <div className="mt-3 rounded-2xl border border-border bg-surface p-4 text-left sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight">{subject.name[lang]}</p>
          <span className="text-xs font-medium tabular-nums text-success">{progress}%</span>
        </div>
        <AnimatedProgressBar value={progress} className="mt-2" />

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-muted px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
              {strings.currentChapterLabel[lang]}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium">{currentTopic ?? strings.notStartedLabel[lang]}</p>
          </div>
          <div className="rounded-lg bg-surface-muted px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
              {strings.nextLesson[lang]}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium">{nextTopic ?? strings.allCaughtUp[lang]}</p>
          </div>
        </div>

        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-foreground-muted">
          <History size={11} strokeWidth={1.75} />
          {formatLastStudied(subject.lastStudiedDaysAgo, lang)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onAskAi} className={actionButtonClass}>
            <MessageSquare size={13} strokeWidth={1.75} />
            {strings.askAiBtn[lang]}
          </button>
          <button onClick={onPractice} className={actionButtonClass}>
            <Dumbbell size={13} strokeWidth={1.75} />
            {strings.practiceBtn[lang]}
          </button>
          <button onClick={onRevise} className={actionButtonClass}>
            <RotateCcw size={13} strokeWidth={1.75} />
            {strings.reviseBtn[lang]}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
