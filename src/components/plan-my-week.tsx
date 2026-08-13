"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { Modal } from "@/components/modal";
import { strings, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";
import type { StudyPlan } from "@/lib/study-plan";
import {
  addDays,
  dayOfWeek,
  formatDuration,
  formatTime,
  generateWeekPlan,
  todayKey,
  weekdayShortLabels,
  type ScheduleState,
  type StudySession,
} from "@/lib/study-schedule";

const EASE = [0.16, 1, 0.3, 1] as const;
const weeklyHourOptions = [4, 7, 10, 14, 20];

const stepVariants = {
  enter: { opacity: 0, x: 16 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15, ease: EASE }}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
        active
          ? "border-accent bg-surface-muted text-foreground-strong"
          : "border-border text-foreground-muted hover:border-foreground-faint hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Four short questions, then a generated week the student can still edit.
 * The generator itself lives in lib/study-schedule so the Student Hub's daily
 * recommendation and this flow rank chapters exactly the same way.
 */
export function PlanMyWeek({
  lang,
  subjects,
  plan,
  schedule,
  sessionMinutes,
  breakMinutes,
  onApply,
  onClose,
}: {
  lang: Lang;
  subjects: Subject[];
  plan: StudyPlan;
  schedule: ScheduleState;
  sessionMinutes: number;
  breakMinutes: number;
  onApply: (sessions: StudySession[]) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [activeDays, setActiveDays] = useState<number[]>(
    schedule.availability.map((slots, i) => (slots.length > 0 ? i : -1)).filter((i) => i >= 0)
  );
  const [prioritySubjectIds, setPrioritySubjectIds] = useState<string[]>(plan.weakSubjects);
  const [generated, setGenerated] = useState<StudySession[]>([]);

  const toggle = (list: number[], value: number) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const generate = () => {
    setGenerated(
      generateWeekPlan(
        subjects,
        plan,
        schedule,
        {
          activeDays,
          prioritySubjectIds,
          weeklyMinutes: weeklyHours * 60,
          sessionMinutes,
          breakMinutes,
        },
        todayKey()
      )
    );
    setStep(3);
  };

  const byDay = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i))
    .map((dateKey) => ({ dateKey, sessions: generated.filter((s) => s.date === dateKey) }))
    .filter((d) => d.sessions.length > 0);

  return (
    <Modal title={strings.schedulePlanMyWeekTitle[lang]} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-colors duration-200 ${
                i <= step ? "bg-foreground-faint" : "bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: EASE }}
            className="flex flex-col gap-4"
          >
            {step === 0 && (
              <>
                <p className="text-sm font-medium text-foreground-strong">{strings.schedulePlanStep1[lang]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {weeklyHourOptions.map((h) => (
                    <Chip key={h} active={weeklyHours === h} onClick={() => setWeeklyHours(h)}>
                      {h} {strings.hoursWord[lang]}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-sm font-medium text-foreground-strong">{strings.schedulePlanStep2[lang]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {weekdayShortLabels.map((d, i) => (
                    <Chip
                      key={d.en}
                      active={activeDays.includes(i)}
                      onClick={() => setActiveDays((prev) => toggle(prev, i))}
                    >
                      {d[lang]}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm font-medium text-foreground-strong">{strings.schedulePlanStep3[lang]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => (
                    <Chip
                      key={s.id}
                      active={prioritySubjectIds.includes(s.id)}
                      onClick={() =>
                        setPrioritySubjectIds((prev) =>
                          prev.includes(s.id) ? prev.filter((v) => v !== s.id) : [...prev, s.id]
                        )
                      }
                    >
                      {s.name[lang]}
                    </Chip>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground-strong">{strings.schedulePlanStep4[lang]}</p>
                  <button
                    onClick={generate}
                    className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    <RotateCcw size={12} strokeWidth={1.75} />
                    {strings.schedulePlanRegenerate[lang]}
                  </button>
                </div>
                {byDay.length === 0 ? (
                  <p className="rounded-lg border border-border bg-surface-muted px-3 py-3 text-xs text-foreground-muted">
                    {strings.schedulePlanEmpty[lang]}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {byDay.map(({ dateKey, sessions }) => (
                      <div key={dateKey}>
                        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                          {weekdayShortLabels[dayOfWeek(dateKey)][lang]}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {sessions.map((s) => {
                            const subject = subjects.find((x) => x.id === s.subjectId);
                            const chapter = subject?.chapters.find((c) => c.id === s.chapterId);
                            return (
                              <div
                                key={s.id}
                                className="flex items-baseline gap-3 rounded-lg border border-border bg-surface-muted px-3 py-2"
                              >
                                <span className="shrink-0 text-xs tabular-nums text-foreground-muted">
                                  {formatTime(s.startTime, lang)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm text-foreground">
                                    {subject?.name[lang]}
                                    {chapter && (
                                      <span className="text-foreground-muted"> · {chapter.name[lang]}</span>
                                    )}
                                  </span>
                                </span>
                                <span className="shrink-0 text-xs tabular-nums text-foreground-faint">
                                  {formatDuration(s.durationMinutes, lang)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground disabled:invisible"
          >
            <ChevronLeft size={15} strokeWidth={1.75} />
            {strings.backBtn[lang]}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
            >
              {strings.continueBtn[lang]}
            </button>
          ) : step === 2 ? (
            <button
              onClick={generate}
              disabled={activeDays.length === 0}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
            >
              {strings.schedulePlanGenerate[lang]}
            </button>
          ) : (
            <button
              onClick={() => {
                onApply(generated);
                onClose();
              }}
              disabled={generated.length === 0}
              className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
            >
              {strings.schedulePlanApply[lang]}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
