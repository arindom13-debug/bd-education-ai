"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  curriculumTrackOptions,
  classLevelOptions,
  examTargetOptions,
  studyLevelOptions,
  dailyMinutesOptions,
  daysUntil,
  type StudyPlan,
} from "@/lib/study-plan";
import { subjects } from "@/lib/curriculum-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const slideVariants = {
  enter: (dir: "forward" | "back") => ({ opacity: 0, x: dir === "forward" ? 28 : -28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: "forward" | "back") => ({ opacity: 0, x: dir === "forward" ? -28 : 28 }),
};

type StepId =
  | "welcome"
  | "name"
  | "classTrack"
  | "examTarget"
  | "strong"
  | "weak"
  | "level"
  | "routine"
  | "goal"
  | "done";

const STEP_ORDER: StepId[] = [
  "welcome",
  "name",
  "classTrack",
  "examTarget",
  "strong",
  "weak",
  "level",
  "routine",
  "goal",
  "done",
];
const QUESTION_STEPS: StepId[] = ["name", "classTrack", "examTarget", "strong", "weak", "level", "routine", "goal"];

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function ChipButton({
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
      className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border hover:border-accent/50"
      }`}
    >
      {children}
    </button>
  );
}

function PillButton({
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
      className={`rounded-full border px-3.5 py-1.5 text-sm ${
        active ? "border-accent bg-accent-soft text-accent" : "border-border text-foreground-muted"
      }`}
    >
      {children}
    </button>
  );
}

function QuestionHeader({ title, why }: { title: string; why?: string }) {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {why && <p className="mt-1.5 text-sm text-foreground-muted">{why}</p>}
    </div>
  );
}

function StepFooter({ onSkip, onContinue, lang }: { onSkip: () => void; onContinue: () => void; lang: Lang }) {
  return (
    <div className="flex items-center justify-between">
      <button onClick={onSkip} className="text-xs text-foreground-muted hover:text-foreground">
        {strings.skip[lang]}
      </button>
      <button
        onClick={onContinue}
        className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
      >
        {strings.continueBtn[lang]}
      </button>
    </div>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</span>
      <span className="max-w-[65%] truncate text-right text-sm font-medium">{value}</span>
    </div>
  );
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
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const step = STEP_ORDER[stepIndex];
  const remaining = daysUntil(plan.examDate);

  const goNext = () => {
    setDirection("forward");
    setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
  };
  const goBack = () => {
    setDirection("back");
    setStepIndex((i) => Math.max(i - 1, 0));
  };
  const chooseAndAdvance = (patch: Partial<StudyPlan>) => {
    onChange(patch);
    setDirection("forward");
    setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1)), 250);
  };
  const toggleInList = (key: "weakSubjects" | "strongSubjects", id: string) => {
    const list = plan[key];
    onChange({ [key]: list.includes(id) ? list.filter((s) => s !== id) : [...list, id] });
  };

  const questionNumber = QUESTION_STEPS.indexOf(step) + 1;
  const totalQuestions = QUESTION_STEPS.length;

  const classLabel = classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang] ?? "";
  const trackLabel = curriculumTrackOptions.find((o) => o.value === plan.curriculumTrack)?.label[lang] ?? "";
  const examTargetLabel = examTargetOptions.find((o) => o.value === plan.examTarget)?.label[lang] ?? "";
  const levelLabel = studyLevelOptions.find((o) => o.value === plan.studyLevel)?.label[lang] ?? "";
  const dailyLabel = dailyMinutesOptions.find((o) => o.value === plan.dailyMinutes)?.label[lang] ?? "";
  const strongNames = subjects
    .filter((s) => plan.strongSubjects.includes(s.id))
    .map((s) => s.name[lang])
    .join(", ");
  const weakNames = subjects
    .filter((s) => plan.weakSubjects.includes(s.id))
    .map((s) => s.name[lang])
    .join(", ");
  const examSummary = [examTargetLabel, remaining !== null ? formatExamDate(plan.examDate, lang) : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col p-5 sm:p-8">
      {questionNumber > 0 && (
        <div className="mb-8 shrink-0">
          <div className="flex items-center justify-between text-xs text-foreground-muted">
            <button onClick={goBack} aria-label="Back" className="flex items-center hover:text-foreground">
              <ChevronLeft size={16} strokeWidth={1.75} />
            </button>
            <span>
              {lang === "en"
                ? `Step ${questionNumber} of ${totalQuestions}`
                : `ধাপ ${questionNumber}/${totalQuestions}`}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-surface-muted">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3, ease: EASE }}
            />
          </div>
        </div>
      )}

      <div className="relative flex flex-1 flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: EASE }}
            className="flex flex-col gap-5"
          >
            {step === "welcome" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Sparkles size={28} strokeWidth={1.75} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {strings.onboardingWelcomeTitle[lang]}
                  </h1>
                  <p className="mt-2 text-sm text-foreground-muted">
                    {strings.onboardingWelcomeSubtitle[lang]}
                  </p>
                </div>
                <button
                  onClick={goNext}
                  className="mt-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground"
                >
                  {strings.onboardingStart[lang]}
                </button>
              </div>
            )}

            {step === "name" && (
              <>
                <QuestionHeader title={strings.qNameTitle[lang]} why={strings.qNameWhy[lang]} />
                <input
                  autoFocus
                  className={inputClass}
                  value={plan.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder={strings.namePlaceholder[lang]}
                />
                <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
              </>
            )}

            {step === "classTrack" && (
              <>
                <QuestionHeader title={strings.qClassTrackTitle[lang]} why={strings.qClassTrackWhy[lang]} />
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.qClassTitle[lang]}
                  </p>
                  <div className="flex flex-col gap-2">
                    {classLevelOptions.map((opt) => (
                      <ChipButton
                        key={opt.value}
                        active={plan.classLevel === opt.value}
                        onClick={() => onChange({ classLevel: opt.value })}
                      >
                        {opt.label[lang]}
                      </ChipButton>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.qTrackTitle[lang]}
                  </p>
                  <div className="flex flex-col gap-2">
                    {curriculumTrackOptions.map((opt) => (
                      <ChipButton
                        key={opt.value}
                        active={plan.curriculumTrack === opt.value}
                        onClick={() => onChange({ curriculumTrack: opt.value })}
                      >
                        {opt.label[lang]}
                      </ChipButton>
                    ))}
                  </div>
                </div>
                <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
              </>
            )}

            {step === "examTarget" && (
              <>
                <QuestionHeader title={strings.qExamTargetTitle[lang]} why={strings.qExamTargetWhy[lang]} />
                <div className="flex flex-wrap gap-2">
                  {examTargetOptions.map((opt) => (
                    <PillButton
                      key={opt.value}
                      active={plan.examTarget === opt.value}
                      onClick={() => onChange({ examTarget: opt.value })}
                    >
                      {opt.label[lang]}
                    </PillButton>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.qExamTitle[lang]}
                  </p>
                  <input
                    type="date"
                    className={inputClass}
                    value={plan.examDate}
                    onChange={(e) => onChange({ examDate: e.target.value })}
                  />
                  {remaining !== null && (
                    <p className="mt-2 text-sm font-medium text-accent">
                      {remaining >= 0
                        ? `${remaining} ${strings.daysLeft[lang]}`
                        : lang === "en"
                        ? "This date has passed"
                        : "তারিখটি পার হয়ে গেছে"}
                    </p>
                  )}
                </div>
                <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
              </>
            )}

            {step === "strong" && (
              <>
                <QuestionHeader title={strings.qStrongTitle[lang]} why={strings.qStrongWhy[lang]} />
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <PillButton
                      key={s.id}
                      active={plan.strongSubjects.includes(s.id)}
                      onClick={() => toggleInList("strongSubjects", s.id)}
                    >
                      {s.name[lang]}
                    </PillButton>
                  ))}
                </div>
                <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
              </>
            )}

            {step === "weak" && (
              <>
                <QuestionHeader title={strings.qWeakTitle[lang]} why={strings.qWeakWhy[lang]} />
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <PillButton
                      key={s.id}
                      active={plan.weakSubjects.includes(s.id)}
                      onClick={() => toggleInList("weakSubjects", s.id)}
                    >
                      {s.name[lang]}
                    </PillButton>
                  ))}
                </div>
                <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
              </>
            )}

            {step === "level" && (
              <>
                <QuestionHeader title={strings.qLevelTitle[lang]} why={strings.qLevelWhy[lang]} />
                <div className="flex flex-col gap-2">
                  {studyLevelOptions.map((opt) => (
                    <ChipButton
                      key={opt.value}
                      active={plan.studyLevel === opt.value}
                      onClick={() => chooseAndAdvance({ studyLevel: opt.value })}
                    >
                      {opt.label[lang]}
                    </ChipButton>
                  ))}
                </div>
              </>
            )}

            {step === "routine" && (
              <>
                <QuestionHeader title={strings.qRoutineTitle[lang]} why={strings.qRoutineWhy[lang]} />
                <div className="grid grid-cols-2 gap-2">
                  {dailyMinutesOptions.map((opt) => (
                    <ChipButton
                      key={opt.value}
                      active={plan.dailyMinutes === opt.value}
                      onClick={() => chooseAndAdvance({ dailyMinutes: opt.value })}
                    >
                      {opt.label[lang]}
                    </ChipButton>
                  ))}
                </div>
              </>
            )}

            {step === "goal" && (
              <>
                <QuestionHeader title={strings.qGoalTitle[lang]} why={strings.qGoalWhy[lang]} />
                <textarea
                  className={`${inputClass} min-h-24 resize-none`}
                  value={plan.goal}
                  onChange={(e) => onChange({ goal: e.target.value })}
                  placeholder={strings.goalPlaceholder[lang]}
                />
                <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
              </>
            )}

            {step === "done" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success animate-[pop-in_420ms_ease-out]">
                  <Check size={28} strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{strings.onboardingDoneTitle[lang]}</h1>
                  <p className="mt-2 text-sm text-foreground-muted">{strings.onboardingDoneSubtitle[lang]}</p>
                </div>

                <div className="w-full rounded-2xl border border-border bg-surface p-4 text-left">
                  <SummaryRow label={strings.qClassTitle[lang]} value={classLabel} />
                  <SummaryRow label={strings.qTrackTitle[lang]} value={trackLabel} />
                  {examSummary && <SummaryRow label={strings.setupSummaryExam[lang]} value={examSummary} />}
                  {strongNames && (
                    <SummaryRow label={strings.setupSummaryStrengths[lang]} value={strongNames} />
                  )}
                  {weakNames && (
                    <SummaryRow label={strings.setupSummaryFocusAreas[lang]} value={weakNames} />
                  )}
                  {levelLabel && <SummaryRow label={strings.setupSummaryLevel[lang]} value={levelLabel} />}
                  {dailyLabel && <SummaryRow label={strings.setupSummaryDailyTime[lang]} value={dailyLabel} />}
                  {plan.goal.trim() && (
                    <SummaryRow label={strings.setupSummaryGoal[lang]} value={plan.goal.trim()} />
                  )}
                </div>

                <button
                  onClick={onFinish}
                  className="mt-1 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground"
                >
                  {strings.startMyJourneyBtn[lang]}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
