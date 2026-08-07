"use client";

import { useState } from "react";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  curriculumTrackOptions,
  classLevelOptions,
  dailyMinutesOptions,
  daysUntil,
  type StudyPlan,
} from "@/lib/study-plan";
import { subjects } from "@/lib/curriculum-data";

type StepId = "welcome" | "name" | "class" | "track" | "goal" | "weak" | "routine" | "exam" | "done";

const STEP_ORDER: StepId[] = [
  "welcome",
  "name",
  "class",
  "track",
  "goal",
  "weak",
  "routine",
  "exam",
  "done",
];
const QUESTION_STEPS: StepId[] = ["name", "class", "track", "goal", "weak", "routine", "exam"];

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

function QuestionHeader({ title, why }: { title: string; why: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-foreground-muted">{why}</p>
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
  const toggleWeakSubject = (id: string) => {
    const has = plan.weakSubjects.includes(id);
    onChange({
      weakSubjects: has ? plan.weakSubjects.filter((s) => s !== id) : [...plan.weakSubjects, id],
    });
  };

  const questionNumber = QUESTION_STEPS.indexOf(step) + 1;
  const totalQuestions = QUESTION_STEPS.length;

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
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div
        key={step}
        className={`flex flex-1 flex-col justify-center gap-5 ${
          direction === "forward"
            ? "animate-[step-in-forward_320ms_ease-out]"
            : "animate-[step-in-back_320ms_ease-out]"
        }`}
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

        {step === "class" && (
          <>
            <QuestionHeader title={strings.qClassTitle[lang]} why={strings.qClassWhy[lang]} />
            <div className="flex flex-col gap-2">
              {classLevelOptions.map((opt) => (
                <ChipButton
                  key={opt.value}
                  active={plan.classLevel === opt.value}
                  onClick={() => chooseAndAdvance({ classLevel: opt.value })}
                >
                  {opt.label[lang]}
                </ChipButton>
              ))}
            </div>
          </>
        )}

        {step === "track" && (
          <>
            <QuestionHeader title={strings.qTrackTitle[lang]} why={strings.qTrackWhy[lang]} />
            <div className="flex flex-col gap-2">
              {curriculumTrackOptions.map((opt) => (
                <ChipButton
                  key={opt.value}
                  active={plan.curriculumTrack === opt.value}
                  onClick={() => chooseAndAdvance({ curriculumTrack: opt.value })}
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

        {step === "weak" && (
          <>
            <QuestionHeader title={strings.qWeakTitle[lang]} why={strings.qWeakWhy[lang]} />
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <PillButton
                  key={s.id}
                  active={plan.weakSubjects.includes(s.id)}
                  onClick={() => toggleWeakSubject(s.id)}
                >
                  {s.name[lang]}
                </PillButton>
              ))}
            </div>
            <StepFooter onSkip={goNext} onContinue={goNext} lang={lang} />
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

        {step === "exam" && (
          <>
            <QuestionHeader title={strings.qExamTitle[lang]} why={strings.qExamWhy[lang]} />
            <div className="flex flex-col gap-3">
              <input
                type="date"
                className={inputClass}
                value={plan.examDate}
                onChange={(e) => onChange({ examDate: e.target.value })}
              />
              {remaining !== null && (
                <p className="text-sm font-medium text-accent">
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

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-success/15 text-success animate-[pop-in_420ms_ease-out]">
              <Check size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{strings.onboardingDoneTitle[lang]}</h1>
              <p className="mt-2 text-sm text-foreground-muted">{strings.onboardingDoneSubtitle[lang]}</p>
            </div>
            <button
              onClick={onFinish}
              className="mt-2 animate-[step-in-forward_350ms_ease-out_300ms_both] rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground"
            >
              {strings.startLearning[lang]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
