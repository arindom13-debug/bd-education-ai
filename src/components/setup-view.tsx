"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, Pencil, RotateCcw } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  curriculumTrackOptions,
  classLevelOptions,
  examTargetOptions,
  type StudyPlan,
} from "@/lib/study-plan";
import { subjects } from "@/lib/curriculum-data";
import { Modal } from "@/components/modal";
import {
  onboardingQuestions,
  TOTAL_QUESTIONS,
  formatAnswer,
  getQuestionIndex,
  loadOnboardingProgress,
  saveOnboardingProgress,
  type DeepQuestion,
  type OnboardingAnswerValue,
  type OnboardingProgress,
} from "@/lib/onboarding";

const EASE = [0.16, 1, 0.3, 1] as const;

// Direction-aware horizontal slide: moving forward exits left / enters from
// the right; moving back exits right / enters from the left. 250-400ms.
const SLIDE_DISTANCE = 28;
const questionVariants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * SLIDE_DISTANCE }),
  center: { opacity: 1, x: 0 },
  exit: (dir: 1 | -1) => ({ opacity: 0, x: dir * -SLIDE_DISTANCE }),
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

function OptionCard({
  active,
  onClick,
  title,
  description,
  cardRef,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  cardRef?: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15, ease: EASE }}
      className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${
        active
          ? "border-accent bg-surface-muted"
          : "border-border bg-surface hover:border-foreground-faint hover:bg-surface-muted"
      }`}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`text-sm ${active ? "font-medium text-foreground-strong" : "text-foreground"}`}>
          {title}
        </span>
        {description && <span className="text-xs text-foreground-muted">{description}</span>}
      </span>
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
          active ? "border-accent bg-accent text-accent-foreground" : "border-border text-transparent"
        }`}
      >
        <Check size={12} strokeWidth={2.5} />
      </span>
    </motion.button>
  );
}

function LevelSlider({
  levels,
  value,
  onChange,
}: {
  levels: { value: string; label: string; description?: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const activeLevel = levels.find((l) => l.value === value);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex rounded-full border border-border bg-surface p-1">
        {levels.map((level) => {
          const active = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className="relative z-10 flex-1 rounded-full px-2 py-2 text-center text-xs transition-colors duration-150 sm:text-sm"
            >
              {active && (
                <motion.span
                  layoutId="level-slider-fill"
                  transition={{ duration: 0.3, ease: EASE }}
                  className="absolute inset-0 -z-10 rounded-full bg-accent"
                />
              )}
              <span className={active ? "font-medium text-accent-foreground" : "text-foreground-muted hover:text-foreground"}>
                {level.label}
              </span>
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {activeLevel?.description && (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground-muted"
          >
            {activeLevel.description}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">{title}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="group flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="mt-1 text-sm text-foreground">{value}</p>
      </div>
      <button
        onClick={onEdit}
        aria-label={label}
        className="shrink-0 rounded-md p-1.5 text-foreground-faint opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Pencil size={13} strokeWidth={1.75} />
      </button>
    </div>
  );
}

const byId: Record<string, DeepQuestion> = Object.fromEntries(onboardingQuestions.map((q) => [q.id, q]));

export function SetupView({
  lang,
  plan,
  onChange,
}: {
  lang: Lang;
  plan: StudyPlan;
  onChange: (patch: Partial<StudyPlan>) => void;
}) {
  const [progress, setProgress] = useState<OnboardingProgress>(() => loadOnboardingProgress());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const commit = (next: OnboardingProgress) => {
    setProgress(next);
    saveOnboardingProgress(next);
  };
  const setAnswer = (id: string, value: OnboardingAnswerValue) =>
    commit({ ...progress, answers: { ...progress.answers, [id]: value } });

  const stepIndex = Math.min(progress.step, TOTAL_QUESTIONS);
  const hasProgress = progress.completed || progress.step > 0 || Object.keys(progress.answers).length > 0;
  const showIntro = !hasProgress && !introDismissed;
  const flowQuestion: DeepQuestion | null = stepIndex < TOTAL_QUESTIONS ? onboardingQuestions[stepIndex] : null;
  const editQuestion: DeepQuestion | null = editingId ? onboardingQuestions[getQuestionIndex(editingId)] ?? null : null;
  const activeQuestion = showIntro ? null : editQuestion ?? flowQuestion;

  const exitEditing = () => setEditingId(null);
  const exitToProfile = () => commit({ ...progress, step: TOTAL_QUESTIONS });

  const advanceFrom = (base: OnboardingProgress) => {
    setDirection(1);
    commit({ ...base, step: Math.min(base.step + 1, TOTAL_QUESTIONS) });
  };

  const goNext = () => {
    if (editingId) {
      exitEditing();
      return;
    }
    advanceFrom(progress);
  };
  const goBack = () => {
    if (editingId) {
      exitEditing();
      return;
    }
    setDirection(-1);
    if (stepIndex === 0) {
      if (progress.completed) exitToProfile();
      return;
    }
    commit({ ...progress, step: stepIndex - 1 });
  };

  const selectSingle = (id: string, value: string) => setAnswer(id, value);
  const selectSubjectSingle = (planList: "weakSubjects" | "strongSubjects", subjectId: string) =>
    onChange({ [planList]: [subjectId] });
  const toggleMulti = (id: string, value: string) => {
    const current = progress.answers[id];
    const list = Array.isArray(current) ? current : [];
    setAnswer(id, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };
  const toggleSubject = (list: "weakSubjects" | "strongSubjects", id: string) => {
    const current = plan[list];
    onChange({ [list]: current.includes(id) ? current.filter((s) => s !== id) : [...current, id] });
  };
  const selectScale = (id: string, value: string) => setAnswer(id, value);

  const canContinue = (q: DeepQuestion): boolean => {
    if (q.type === "subjects-single" || q.type === "subjects-multi") {
      return q.planList ? plan[q.planList].length > 0 : false;
    }
    if (q.type === "multi") {
      const v = progress.answers[q.id];
      return Array.isArray(v) && v.length > 0;
    }
    const v = progress.answers[q.id];
    return typeof v === "string" && v !== "";
  };

  const finishFlow = () => commit({ ...progress, completed: true });
  const editProfile = () => {
    setDirection(1);
    commit({ ...progress, step: 0 });
  };

  const confirmRestart = () => {
    setShowRestartConfirm(false);
    setEditingId(null);
    setIntroDismissed(false);
    onChange({ examTarget: "", weakSubjects: [], strongSubjects: [] });
    commit({ step: 0, answers: {}, completed: false });
  };

  // Keyboard support: Escape cancels an edit-jump or closes the restart
  // dialog; Enter continues once an answer is valid and focus isn't already
  // on an interactive control (which already handles Enter/Space itself).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showRestartConfirm) {
        if (e.key === "Escape") setShowRestartConfirm(false);
        return;
      }
      if (e.key === "Escape" && editingId) {
        exitEditing();
        return;
      }
      if (e.key !== "Enter") return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "button" || tag === "input" || tag === "textarea") return;
      if (!activeQuestion) return;
      if (canContinue(activeQuestion)) goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestion, editingId, showRestartConfirm, progress, plan]);

  const handleOptionsKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const refs = optionRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (refs.length === 0) return;
    const currentIndex = refs.findIndex((el) => el === document.activeElement);
    const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + dir + refs.length) % refs.length;
    refs[nextIndex]?.focus();
  };

  const subjectNames = (ids: string[]): string =>
    subjects
      .filter((s) => ids.includes(s.id))
      .map((s) => s.name[lang])
      .join(", ");

  const sectionLabel = (section: DeepQuestion["section"]): string =>
    ({
      context: strings.sectionContext[lang],
      challenges: strings.sectionChallenges[lang],
      preferences: strings.sectionPreferences[lang],
      habits: strings.sectionHabits[lang],
      goals: strings.sectionGoals[lang],
      teaching: strings.sectionTeaching[lang],
    })[section];

  // ===================== INTRO =====================
  if (showIntro) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-col items-start gap-5"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{strings.learningProfile[lang]}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground-strong">{strings.introTitle[lang]}</h1>
            <p className="mt-3 text-sm text-foreground-muted">{strings.introDesc[lang]}</p>
          </div>
          <p className="text-xs text-foreground-faint">
            {TOTAL_QUESTIONS} {strings.introQuestionsLabel[lang]} · {strings.introDurationLabel[lang]}
          </p>
          <button
            onClick={() => setIntroDismissed(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground"
          >
            {strings.startBtn[lang]}
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ===================== PROFILE (already completed) =====================
  if (!activeQuestion && progress.completed) {
    const rows = [
      { q: byId.hardestSubject, value: subjectNames(plan.weakSubjects) },
      { q: byId.understandingProblems, value: formatAnswer(byId.understandingProblems, progress.answers, lang) },
      { q: byId.learningStyle, value: formatAnswer(byId.learningStyle, progress.answers, lang) },
      { q: byId.consistencyBlockers, value: formatAnswer(byId.consistencyBlockers, progress.answers, lang) },
      { q: byId.academicGoal, value: formatAnswer(byId.academicGoal, progress.answers, lang) },
      { q: byId.explanationDepth, value: formatAnswer(byId.explanationDepth, progress.answers, lang) },
      { q: byId.mistakeResponse, value: formatAnswer(byId.mistakeResponse, progress.answers, lang) },
      { q: byId.challengeLevel, value: formatAnswer(byId.challengeLevel, progress.answers, lang) },
    ].filter((r) => r.value);
    const rowFor = (id: string) => rows.find((r) => r.q.id === id);
    const confidentIn = subjectNames(plan.strongSubjects);

    const sections: { title: string; ids: string[] }[] = [
      { title: strings.sectionChallenges[lang], ids: ["hardestSubject", "understandingProblems"] },
      { title: strings.sectionPreferences[lang], ids: ["learningStyle"] },
      { title: strings.sectionHabits[lang], ids: ["consistencyBlockers"] },
      { title: strings.sectionGoals[lang], ids: ["academicGoal"] },
      { title: strings.sectionTeaching[lang], ids: ["explanationDepth", "mistakeResponse", "challengeLevel"] },
    ];

    return (
      <div className="p-5 sm:p-8">
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">
              {strings.learningProfile[lang]}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">{strings.studentProfileSubtitle[lang]}</p>
          </div>

          <SectionCard title={strings.sectionContext[lang]}>
            <div className="flex flex-col gap-3 pb-1">
              <div className="flex flex-wrap gap-2">
                {classLevelOptions.map((opt) => (
                  <Chip key={opt.value} active={plan.classLevel === opt.value} onClick={() => onChange({ classLevel: opt.value })}>
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
                  <Chip key={opt.value} active={plan.examTarget === opt.value} onClick={() => onChange({ examTarget: opt.value })}>
                    {opt.label[lang]}
                  </Chip>
                ))}
              </div>
            </div>
            {confidentIn && (
              <SummaryRow label={strings.confidentInLabel[lang]} value={confidentIn} onEdit={() => setEditingId("strongestSubject")} />
            )}
          </SectionCard>

          {sections.map((s) => {
            const sectionRows = s.ids.map(rowFor).filter((r): r is { q: DeepQuestion; value: string } => Boolean(r));
            if (sectionRows.length === 0) return null;
            return (
              <SectionCard key={s.title} title={s.title}>
                {sectionRows.map((r) => (
                  <SummaryRow key={r.q.id} label={r.q.title[lang]} value={r.value} onEdit={() => setEditingId(r.q.id)} />
                ))}
              </SectionCard>
            );
          })}

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              onClick={editProfile}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              <Pencil size={14} strokeWidth={1.75} />
              {strings.editProfileBtn[lang]}
            </button>
            <button
              onClick={() => setShowRestartConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <RotateCcw size={14} strokeWidth={1.75} />
              {strings.restartOnboardingBtn[lang]}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showRestartConfirm && (
            <Modal title={strings.restartConfirmTitle[lang]} onClose={() => setShowRestartConfirm(false)}>
              <p className="text-sm text-foreground-muted">{strings.restartConfirmDesc[lang]}</p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowRestartConfirm(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                >
                  {strings.cancelBtn[lang]}
                </button>
                <button onClick={confirmRestart} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
                  {strings.restartBtn[lang]}
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ===================== COMPLETION STATE =====================
  if (!activeQuestion) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center p-5 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-col items-start gap-5"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.setupCompleteTitle[lang]}</h1>
            <p className="mt-2 text-sm text-foreground-muted">{strings.setupCompleteDesc[lang]}</p>
          </div>
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: EASE, delay: 0.1 }}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground-strong"
          >
            <Check size={13} strokeWidth={2.5} />
            {TOTAL_QUESTIONS} / {TOTAL_QUESTIONS} {strings.profileReadyLabel[lang]}
          </motion.span>
          <button
            onClick={finishFlow}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground"
          >
            {strings.viewProfileBtn[lang]}
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ===================== QUESTION (flow or single-question edit) =====================
  const q = activeQuestion;
  const isLast = !editingId && stepIndex === TOTAL_QUESTIONS - 1;
  const continueOk = canContinue(q);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col p-5 sm:p-8">
      <div className="mb-10 shrink-0">
        {editingId ? (
          <button
            onClick={exitEditing}
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <ChevronLeft size={14} strokeWidth={2} />
            {strings.editingAnswerLabel[lang]}
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span className="font-medium uppercase tracking-wide">{sectionLabel(q.section)}</span>
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
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={q.id}
            custom={direction}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: EASE }}
            className="flex flex-col gap-5"
          >
            <div>
              <h1 className="text-xl font-semibold leading-snug tracking-tight text-foreground-strong">{q.title[lang]}</h1>
              {q.subtitle && <p className="mt-2 text-sm text-foreground-muted">{q.subtitle[lang]}</p>}
            </div>

            {(q.type === "single" || q.type === "multi") && (
              <div role="group" onKeyDown={handleOptionsKeyDown} className="flex flex-col gap-2">
                {q.options!.map((opt, i) => {
                  const answer = progress.answers[q.id];
                  const active =
                    q.type === "multi" ? Array.isArray(answer) && answer.includes(opt.value) : answer === opt.value;
                  return (
                    <OptionCard
                      key={opt.value}
                      cardRef={(el) => {
                        optionRefs.current[i] = el;
                      }}
                      active={active}
                      onClick={() => (q.type === "multi" ? toggleMulti(q.id, opt.value) : selectSingle(q.id, opt.value))}
                      title={opt.label[lang]}
                      description={opt.description?.[lang]}
                    />
                  );
                })}
              </div>
            )}

            {(q.type === "subjects-single" || q.type === "subjects-multi") && (
              <div role="group" onKeyDown={handleOptionsKeyDown} className="flex flex-col gap-2">
                {subjects.map((s, i) => {
                  const active = q.planList ? plan[q.planList].includes(s.id) : false;
                  return (
                    <OptionCard
                      key={s.id}
                      cardRef={(el) => {
                        optionRefs.current[i] = el;
                      }}
                      active={active}
                      onClick={() => {
                        if (!q.planList) return;
                        if (q.type === "subjects-single") selectSubjectSingle(q.planList, s.id);
                        else toggleSubject(q.planList, s.id);
                      }}
                      title={s.name[lang]}
                    />
                  );
                })}
              </div>
            )}

            {q.type === "scale" && (
              <LevelSlider
                levels={q.options!.map((o) => ({ value: o.value, label: o.label[lang], description: o.description?.[lang] }))}
                value={typeof progress.answers[q.id] === "string" ? (progress.answers[q.id] as string) : ""}
                onChange={(v) => selectScale(q.id, v)}
              />
            )}

            <div className="mt-2 flex items-center justify-between">
              {!editingId ? (
                <button
                  onClick={goBack}
                  disabled={stepIndex === 0 && !progress.completed}
                  className="flex items-center gap-1 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground disabled:invisible"
                >
                  <ChevronLeft size={15} strokeWidth={1.75} />
                  {strings.backBtn[lang]}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={goNext}
                disabled={!continueOk}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-opacity duration-150 disabled:opacity-40"
              >
                {editingId ? strings.saveBtn[lang] : isLast ? strings.finishProfileBtn[lang] : strings.continueBtn[lang]}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
