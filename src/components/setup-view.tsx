"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Pencil, RotateCcw } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  curriculumTrackOptions,
  classLevelOptions,
  examTargetOptions,
  type StudyPlan,
} from "@/lib/study-plan";
import { subjects } from "@/lib/curriculum-data";
import {
  onboardingQuestions,
  TOTAL_QUESTIONS,
  OTHER_VALUE,
  otherKey,
  formatAnswer,
  getExtraText,
  loadOnboardingProgress,
  saveOnboardingProgress,
  type DeepQuestion,
  type Localized,
  type OnboardingProgress,
} from "@/lib/onboarding";

const EASE = [0.16, 1, 0.3, 1] as const;
const AUTO_ADVANCE_MS = 220;

// Fade + slight upward movement — no horizontal slide, no bounce.
const questionVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const inputClass =
  "w-full rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-foreground-faint";

function OptionRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors duration-150 ${
        active
          ? "border-foreground-faint bg-surface-muted font-medium text-foreground-strong"
          : "border-border text-foreground hover:bg-surface-muted"
      }`}
    >
      <span>{children}</span>
      {active && <Check size={15} strokeWidth={2} className="shrink-0" />}
    </button>
  );
}

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
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150 ${
        active
          ? "border-foreground-faint bg-surface-muted font-medium text-foreground-strong"
          : "border-border text-foreground-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function formatExamDate(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "bn-BD", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function SetupView({
  lang,
  plan,
  onChange,
  onFinish,
}: {
  lang: Lang;
  plan: StudyPlan;
  onChange: (patch: Partial<StudyPlan>) => void;
  onFinish: () => void;
}) {
  const [progress, setProgress] = useState<OnboardingProgress>(() => loadOnboardingProgress());
  const [editing, setEditing] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const commit = (next: OnboardingProgress) => {
    setProgress(next);
    saveOnboardingProgress(next);
  };
  const setAnswer = (id: string, value: string) =>
    commit({ ...progress, answers: { ...progress.answers, [id]: value } });

  const stepIndex = Math.min(progress.step, TOTAL_QUESTIONS);
  const question: DeepQuestion | null = stepIndex < TOTAL_QUESTIONS ? onboardingQuestions[stepIndex] : null;

  const advanceFrom = (base: OnboardingProgress) =>
    commit({ ...base, step: Math.min(base.step + 1, TOTAL_QUESTIONS) });

  const goNext = () => advanceFrom(progress);
  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (stepIndex === 0) return;
    commit({ ...progress, step: stepIndex - 1 });
  };

  /** Single-select saves, then animates on to the next question by itself. */
  const selectSingle = (id: string, value: string) => {
    const next: OnboardingProgress = { ...progress, answers: { ...progress.answers, [id]: value } };
    commit(next);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    // "Other" needs its follow-up input, so it never auto-advances.
    if (value === OTHER_VALUE) return;
    advanceTimer.current = setTimeout(() => advanceFrom(next), AUTO_ADVANCE_MS);
  };

  const toggleSubject = (list: "weakSubjects" | "strongSubjects", id: string) => {
    const current = plan[list];
    onChange({ [list]: current.includes(id) ? current.filter((s) => s !== id) : [...current, id] });
  };

  const canContinue = (q: DeepQuestion): boolean => {
    if (q.optional) return true;
    if (q.type === "subjects") {
      const chosen = q.planList ? plan[q.planList].length > 0 : false;
      const extra = q.extra ? getExtraText(q.extra.id, progress.answers) !== "" : false;
      return chosen || extra;
    }
    const value = progress.answers[q.id];
    if (q.type === "text") return typeof value === "string" && value.trim() !== "";
    if (value === OTHER_VALUE) return getExtraText(otherKey(q.id), progress.answers) !== "";
    return typeof value === "string" && value !== "";
  };

  const finish = () => {
    commit({ ...progress, completed: true });
    if (editing) setEditing(false);
    else onFinish();
  };

  const startEditing = () => {
    setEditing(true);
    commit({ ...progress, step: 0 });
  };

  const restart = () => {
    setEditing(false);
    commit({ step: 0, answers: {}, completed: false });
  };

  const subjectsAnswer = (q: DeepQuestion): string => {
    const names = q.planList
      ? subjects.filter((s) => plan[q.planList!].includes(s.id)).map((s) => s.name[lang]).join(", ")
      : "";
    const extra = q.extra ? getExtraText(q.extra.id, progress.answers) : "";
    return [names, extra].filter(Boolean).join(" — ");
  };
  const answerFor = (q: DeepQuestion): string =>
    q.type === "subjects" ? subjectsAnswer(q) : formatAnswer(q, progress.answers, lang);

  // ===================== PROFILE (already completed) =====================
  if (progress.completed && !editing) {
    const groups: { stage: Localized; items: { label: string; value: string }[] }[] = [];
    for (const q of onboardingQuestions) {
      const value = answerFor(q);
      if (!value) continue;
      const last = groups[groups.length - 1];
      if (last && last.stage.en === q.stage.en) last.items.push({ label: q.title[lang], value });
      else groups.push({ stage: q.stage, items: [{ label: q.title[lang], value }] });
    }

    return (
      <div className="p-5 sm:p-8">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">
              {strings.studentProfileTitle[lang]}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">{strings.studentProfileSubtitle[lang]}</p>
          </div>

          {/* Academic context lives here rather than in the ten questions —
              the app already knows it, and it stays editable. */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {strings.academicProfileLabel[lang]}
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {classLevelOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={plan.classLevel === opt.value}
                    onClick={() => onChange({ classLevel: opt.value })}
                  >
                    {opt.label[lang]}
                  </Chip>
                ))}
                {curriculumTrackOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={plan.curriculumTrack === opt.value}
                    onClick={() => onChange({ curriculumTrack: opt.value })}
                  >
                    {opt.label[lang]}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {examTargetOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    active={plan.examTarget === opt.value}
                    onClick={() => onChange({ examTarget: opt.value })}
                  >
                    {opt.label[lang]}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  className="w-44 rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none focus:border-foreground-faint"
                  value={plan.examDate}
                  onChange={(e) => onChange({ examDate: e.target.value })}
                />
                {plan.examDate && (
                  <span className="text-xs text-foreground-muted">{formatExamDate(plan.examDate, lang)}</span>
                )}
              </div>
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.stage.en} className="rounded-xl border border-border bg-surface p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {g.stage[lang]}
              </p>
              <div className="flex flex-col">
                {g.items.map((item) => (
                  <div key={item.label} className="border-b border-border py-2.5 last:border-b-0 last:pb-0">
                    <p className="text-xs text-foreground-muted">{item.label}</p>
                    <p className="mt-1 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              <Pencil size={14} strokeWidth={1.75} />
              {strings.editProfileBtn[lang]}
            </button>
            <button
              onClick={restart}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <RotateCcw size={14} strokeWidth={1.75} />
              {strings.restartOnboardingBtn[lang]}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== COMPLETION STATE =====================
  if (!question) {
    const personalizes = [
      strings.personalizeExplanations[lang],
      strings.personalizeDifficulty[lang],
      strings.personalizeRecommendations[lang],
      strings.personalizeRevision[lang],
      strings.personalizeStudyPlans[lang],
      strings.personalizeLearningStyle[lang],
    ];
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-col gap-5"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">
              {strings.setupCompleteTitle[lang]}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">{strings.setupCompleteDesc[lang]}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {personalizes.map((label) => (
              <span
                key={label}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={goBack}
              className="flex items-center gap-1 rounded-lg border border-border px-4 py-2.5 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <ChevronLeft size={15} strokeWidth={1.75} />
              {strings.backBtn[lang]}
            </button>
            <button
              onClick={finish}
              className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground"
            >
              {editing ? strings.saveBtn[lang] : strings.continueToAiBtn[lang]}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===================== QUESTION =====================
  const q = question;
  const answer = progress.answers[q.id];
  const showOtherInput = q.type === "single" && answer === OTHER_VALUE;
  const isLast = stepIndex === TOTAL_QUESTIONS - 1;
  const continueOk = canContinue(q);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col p-5 sm:p-8">
      <div className="mb-10 shrink-0">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="font-medium uppercase tracking-wide">{q.stage[lang]}</span>
          <span className="tabular-nums">
            {String(stepIndex + 1).padStart(2, "0")} / {String(TOTAL_QUESTIONS).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-2 h-px w-full bg-border">
          <motion.div
            className="h-full bg-foreground-faint"
            animate={{ width: `${((stepIndex + 1) / TOTAL_QUESTIONS) * 100}%` }}
            transition={{ duration: 0.3, ease: EASE }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: EASE }}
            className="flex flex-col gap-5"
          >
            <div>
              <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground-strong">
                {q.title[lang]}
              </h1>
              {q.why && <p className="mt-2 text-sm text-foreground-muted">{q.why[lang]}</p>}
            </div>

            {q.type === "subjects" && (
              <>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <Chip
                      key={s.id}
                      active={q.planList ? plan[q.planList].includes(s.id) : false}
                      onClick={() => q.planList && toggleSubject(q.planList, s.id)}
                    >
                      {s.name[lang]}
                    </Chip>
                  ))}
                </div>
                {q.extra && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                      {q.extra.label[lang]}
                    </label>
                    <input
                      value={getExtraText(q.extra.id, progress.answers)}
                      onChange={(e) => setAnswer(q.extra!.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && continueOk) goNext();
                      }}
                      placeholder={q.extra.placeholder[lang]}
                      className={inputClass}
                    />
                  </div>
                )}
              </>
            )}

            {q.type === "single" && (
              <div className="flex flex-col gap-2">
                {q.options!.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    active={answer === opt.value}
                    onClick={() => selectSingle(q.id, opt.value)}
                  >
                    {opt.label[lang]}
                  </OptionRow>
                ))}
                {showOtherInput && (
                  <input
                    autoFocus
                    value={getExtraText(otherKey(q.id), progress.answers)}
                    onChange={(e) => setAnswer(otherKey(q.id), e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && continueOk) goNext();
                    }}
                    placeholder={strings.otherPlaceholder[lang]}
                    className={`${inputClass} mt-1`}
                  />
                )}
              </div>
            )}

            {q.type === "text" && (
              <textarea
                autoFocus
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    goNext();
                  }
                }}
                placeholder={q.placeholder?.[lang] ?? ""}
                className={`${inputClass} min-h-28 resize-none`}
              />
            )}

            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={stepIndex === 0}
                className="flex items-center gap-1 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground disabled:invisible"
              >
                <ChevronLeft size={15} strokeWidth={1.75} />
                {strings.backBtn[lang]}
              </button>
              <div className="flex items-center gap-3">
                {q.optional && (
                  <button onClick={goNext} className="text-xs text-foreground-muted hover:text-foreground">
                    {strings.skip[lang]}
                  </button>
                )}
                <button
                  onClick={goNext}
                  disabled={!continueOk}
                  className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-opacity duration-150 disabled:opacity-40"
                >
                  {isLast ? strings.finishBtn[lang] : strings.continueBtn[lang]}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
