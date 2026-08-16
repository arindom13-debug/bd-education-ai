"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pause, Pencil, Play, RotateCcw, Square, Timer as TimerIcon } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  cyclePosition,
  formatClock,
  getRemainingMs,
  type TimerActions,
  type TimerState,
} from "@/lib/study-timer";
import { findChapter, findSubject } from "@/lib/study-schedule";
import type { Subject } from "@/lib/curriculum-data";
import {
  CycleDots,
  TimerProgressRing,
  TimerSettingsForm,
  useTimerNow,
} from "@/components/study-timer-controls";
import { StartStudyForm } from "@/components/start-study-form";

const EASE = [0.16, 1, 0.3, 1] as const;

const popoverVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export function StudyTimerPill({
  lang,
  timer,
  actions,
  subjects,
}: {
  lang: Lang;
  timer: TimerState;
  actions: TimerActions;
  subjects: Subject[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const now = useTimerNow(timer.status);

  const active = timer.status === "running" || timer.status === "paused";
  const completed = timer.status === "completed";

  // The completion transition should be noticed without a click — the popover
  // opens itself the instant status flips to completed, same card, no separate
  // dialog. Adjusted during render (React's documented "reset state when a
  // prop changes" pattern) rather than in an effect.
  const [wasCompleted, setWasCompleted] = useState(completed);
  if (completed !== wasCompleted) {
    setWasCompleted(completed);
    if (completed) {
      setEditing(false);
      setOpen(true);
    }
  }

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Anchoring the popover with plain `right-0` assumes this pill sits at the
  // true screen edge — true on desktop, false in the mobile header where it's
  // one of several icons. Measuring the trigger and clamping to the viewport
  // keeps the popover on-screen regardless of where the pill actually sits.
  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const updatePosition = () => {
      const trigger = ref.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 12;
      const width = Math.min(320, window.innerWidth - margin * 2);
      const left = Math.min(rect.right - width, window.innerWidth - width - margin);
      setPopoverPos({ top: rect.bottom + 8, left: Math.max(margin, left), width });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("orientationchange", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("orientationchange", updatePosition);
    };
  }, [open]);

  const closePopover = () => {
    setOpen(false);
    setEditing(false);
  };

  const remainingMs = getRemainingMs(timer, now);
  const progress = timer.phaseDurationMs > 0 ? 1 - remainingMs / timer.phaseDurationMs : 0;
  const isFocus = timer.phase === "focus";
  const phaseLabel = isFocus ? strings.timerPhaseFocus[lang] : strings.timerPhaseBreak[lang];
  const cycle = cyclePosition(timer);

  const ctx = timer.context;
  const ctxSubject = ctx ? findSubject(subjects, ctx.subjectId) : null;
  const ctxChapter = ctx ? findChapter(subjects, ctx.subjectId, ctx.chapterId) : null;

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: EASE }}
        className="flex max-w-[15rem] items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:border-foreground-faint hover:text-foreground"
      >
        {active ? (
          <TimerProgressRing progress={progress} status={timer.status} size={15} strokeWidth={2} />
        ) : (
          <TimerIcon size={13} strokeWidth={1.75} />
        )}
        {active ? (
          <span className="min-w-0 truncate tabular-nums text-foreground">
            {ctxSubject ? ctxSubject.name[lang] : phaseLabel} · {formatClock(remainingMs)}
            {timer.status === "paused" && (
              <span className="ml-1 text-foreground-faint">· {strings.timerPausedLabel[lang]}</span>
            )}
          </span>
        ) : (
          strings.timerSetTimer[lang]
        )}
      </motion.button>

      <AnimatePresence>
        {open && popoverPos && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={popoverVariants}
            transition={{ duration: 0.18, ease: EASE }}
            style={{ position: "fixed", top: popoverPos.top, left: popoverPos.left, width: popoverPos.width }}
            className="z-30 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-lg"
          >
            {completed ? (
              <div className="flex flex-col gap-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex flex-col items-center gap-2 text-center"
                >
                  <span className="flex size-9 items-center justify-center rounded-full border border-border bg-surface-muted text-success">
                    <Check size={16} strokeWidth={2.5} />
                  </span>
                  <p className="text-sm font-semibold text-foreground-strong">
                    {isFocus ? strings.timerFocusCompleteTitle[lang] : strings.timerBreakCompleteTitle[lang]}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {isFocus ? strings.timerFocusCompleteNiceWork[lang] : strings.timerBreakCompleteDesc[lang]}
                  </p>
                </motion.div>
                <div className="flex gap-2">
                  <button
                    onClick={() => actions.dismissCompletion()}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {isFocus ? strings.timerSkipBtn[lang] : strings.timerDismissBtn[lang]}
                  </button>
                  <button
                    onClick={() => actions.start(isFocus ? "break" : "focus")}
                    className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
                  >
                    {isFocus ? strings.timerStartBreakBtn[lang] : strings.timerStartFocusBtn[lang]}
                  </button>
                </div>
              </div>
            ) : !active ? (
              <StartStudyForm
                lang={lang}
                subjects={subjects}
                defaultMinutes={timer.settings.focusMinutes}
                onStart={(context, minutes) => {
                  actions.startSession(context, minutes);
                  closePopover();
                }}
              />
            ) : editing ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground-strong">{strings.timerEditTimerTitle[lang]}</p>
                  <button
                    onClick={() => setEditing(false)}
                    className="text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.doneBtn[lang]}
                  </button>
                </div>
                <TimerSettingsForm lang={lang} settings={timer.settings} actions={actions} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{phaseLabel}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-foreground-faint">
                      {strings.timerSessionCounter[lang]} {Math.min(cycle.completed + 1, cycle.total)}{" "}
                      {strings.timerOfWord[lang]} {cycle.total}
                    </span>
                    <CycleDots completed={cycle.completed} total={cycle.total} />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground-strong">
                    {formatClock(remainingMs)}
                  </p>
                  {timer.status === "paused" && (
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground-faint">
                      {strings.timerPausedLabel[lang]}
                    </p>
                  )}
                  {ctxSubject && (
                    <div className="mt-1">
                      <p className="text-sm font-medium text-foreground">{ctxSubject.name[lang]}</p>
                      {ctxChapter && <p className="text-xs text-foreground-muted">{ctxChapter.name[lang]}</p>}
                    </div>
                  )}
                  <p className="text-[11px] text-foreground-faint">
                    {Math.round(timer.phaseDurationMs / 60_000)} {strings.minutesWord[lang]}{" "}
                    {strings.timerSessionSummary[lang]}
                  </p>
                </div>

                {ctx?.goal && (
                  <div className="rounded-lg border border-border bg-surface-muted px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                      {strings.timerGoalLabel[lang]}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground">{ctx.goal}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => (timer.status === "running" ? actions.pause() : actions.resume())}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-transform duration-150 active:scale-[0.98]"
                  >
                    {timer.status === "running" ? <Pause size={14} strokeWidth={2} /> : <Play size={14} strokeWidth={2} />}
                    {timer.status === "running" ? strings.timerPause[lang] : strings.timerResume[lang]}
                  </button>
                  {ctx ? (
                    <button
                      onClick={() => actions.endSession()}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      <Square size={13} strokeWidth={1.75} />
                      {strings.timerEndSessionBtn[lang]}
                    </button>
                  ) : (
                    <button
                      onClick={() => actions.reset()}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      <RotateCcw size={14} strokeWidth={1.75} />
                      {strings.timerReset[lang]}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="text-xs text-foreground-muted">
                    <span>
                      {strings.timerPhaseFocus[lang]} · {timer.settings.focusMinutes} {strings.minutesWord[lang]}
                    </span>
                    <span className="mx-1.5 text-foreground-faint">|</span>
                    <span>
                      {strings.timerPhaseBreak[lang]} · {timer.settings.breakMinutes} {strings.minutesWord[lang]}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    aria-label={strings.timerEditTimerTitle[lang]}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    <Pencil size={12} strokeWidth={1.75} />
                    {strings.timerEditBtn[lang]}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
