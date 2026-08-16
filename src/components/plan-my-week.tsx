"use client";

import { useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { ChevronLeft, GripVertical, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { Modal } from "@/components/modal";
import { strings, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";
import type { StudyPlan } from "@/lib/study-plan";
import {
  addDays,
  dayOfWeek,
  findChapter,
  findConflict,
  findSubject,
  formatDuration,
  formatTime,
  generateWeekPlan,
  minutesFromTime,
  schedulableChapters,
  todayKey,
  weekdayShortLabels,
  durationOptions,
  type ScheduleState,
  type StudySession,
} from "@/lib/study-schedule";
import { SelectField, InputField } from "@/components/schedule-fields";
import { CreateSessionForm } from "@/components/create-session-form";
import { Tooltip } from "@/components/tooltip";

const EASE = [0.16, 1, 0.3, 1] as const;
const weeklyHourOptions = [4, 7, 10, 14, 20];
const GENERATE_ERROR_RATE = 1 / 12;

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

function ProvenanceBadge({ lang, kind }: { lang: Lang; kind: "ai" | "edited" }) {
  return (
    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-faint">
      {kind === "ai" ? strings.planAiSuggestedLabel[lang] : strings.planEditedLabel[lang]}
    </span>
  );
}

/** Inline editor for a single session — subject, topic, date, time, duration,
 * plus a soft conflict warning. Opens as a small anchored popover so the
 * modal never needs to grow or navigate away. */
function SessionEditPopover({
  lang,
  session,
  subjects,
  conflict,
  onChange,
  onDelete,
  onClose,
}: {
  lang: Lang;
  session: StudySession;
  subjects: Subject[];
  conflict: StudySession | null;
  onChange: (patch: Partial<StudySession>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const subject = findSubject(subjects, session.subjectId);
  const chapters = subject ? schedulableChapters(subject) : [];
  const conflictSubject = conflict ? findSubject(subjects, conflict.subjectId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: EASE }}
      className="absolute left-0 right-0 top-full z-20 mt-1.5 flex flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-lg"
    >
      <div className="grid grid-cols-2 gap-2.5">
        <SelectField
          label={strings.scheduleSubjectLabel[lang]}
          value={session.subjectId}
          onChange={(v) => onChange({ subjectId: v, chapterId: null })}
          options={subjects.map((s) => ({ value: s.id, label: s.name[lang] }))}
        />
        <SelectField
          label={strings.scheduleTopicLabel[lang]}
          value={session.chapterId ?? ""}
          onChange={(v) => onChange({ chapterId: v || null })}
          options={[
            { value: "", label: strings.scheduleWholeSubject[lang] },
            ...chapters.map((c) => ({ value: c.id, label: c.name[lang] })),
          ]}
        />
        <InputField
          label={strings.scheduleDateLabel[lang]}
          type="date"
          value={session.date}
          onChange={(v) => onChange({ date: v })}
        />
        <InputField
          label={strings.scheduleStartTimeLabel[lang]}
          type="time"
          value={session.startTime}
          onChange={(v) => onChange({ startTime: v })}
        />
        <div className="col-span-2">
          <SelectField
            label={strings.scheduleDurationLabel[lang]}
            value={String(session.durationMinutes)}
            onChange={(v) => onChange({ durationMinutes: Number(v) })}
            options={durationOptions.map((d) => ({ value: String(d), label: `${d} ${strings.minutesWord[lang]}` }))}
          />
        </div>
      </div>

      <AnimatePresence>
        {conflict && conflictSubject && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
            className="overflow-hidden rounded-lg border border-border bg-surface-muted px-2.5 py-2 text-[11px] leading-relaxed text-foreground-muted"
          >
            {strings.planConflictOverlap[lang]} {conflictSubject.name[lang]} {strings.planConflictSessionAt[lang]}{" "}
            {formatTime(conflict.startTime, lang)}.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-border pt-2.5">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <Trash2 size={12} strokeWidth={1.75} />
          {strings.scheduleDeleteSession[lang]}
        </button>
        <button
          onClick={onClose}
          className="text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          {strings.doneBtn[lang]}
        </button>
      </div>
    </motion.div>
  );
}

/** One draggable, editable row. The grip icon owns the drag gesture
 * (dragListener=false + manual dragControls) so grabbing it never fights
 * with clicking the row to open its editor. */
function EditableSessionRow({
  lang,
  session,
  subjects,
  badge,
  isOpen,
  conflict,
  onToggle,
  onChange,
  onDelete,
}: {
  lang: Lang;
  session: StudySession;
  subjects: Subject[];
  badge: "ai" | "edited" | null;
  isOpen: boolean;
  conflict: StudySession | null;
  onToggle: () => void;
  onChange: (patch: Partial<StudySession>) => void;
  onDelete: () => void;
}) {
  const dragControls = useDragControls();
  const subject = findSubject(subjects, session.subjectId);
  const chapter = findChapter(subjects, session.subjectId, session.chapterId);
  const topicLabel = [subject?.name[lang], chapter?.name[lang]].filter(Boolean).join(" · ");

  return (
    <Reorder.Item as="div" value={session} dragListener={false} dragControls={dragControls} className="relative min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          aria-label={strings.planDragHandleLabel[lang]}
          className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded-md p-1 text-foreground-faint transition-colors duration-150 hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical size={14} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={`flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
            isOpen ? "border-foreground-faint bg-surface-muted" : "border-border bg-surface-muted hover:border-foreground-faint"
          }`}
        >
          <span className="shrink-0 text-xs tabular-nums text-foreground-muted">{formatTime(session.startTime, lang)}</span>
          <Tooltip label={topicLabel} side="top" className="min-w-0 flex-1">
            <span className="block w-full min-w-0 truncate text-sm text-foreground">
              {subject?.name[lang]}
              {chapter && <span className="text-foreground-muted"> · {chapter.name[lang]}</span>}
            </span>
          </Tooltip>
          {badge && <ProvenanceBadge lang={lang} kind={badge} />}
          <span className="shrink-0 text-xs tabular-nums text-foreground-faint">
            {formatDuration(session.durationMinutes, lang)}
          </span>
          <Pencil size={12} strokeWidth={1.75} className="ml-0.5 shrink-0 text-foreground-faint" />
        </button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <SessionEditPopover
            lang={lang}
            session={session}
            subjects={subjects}
            conflict={conflict}
            onChange={onChange}
            onDelete={onDelete}
            onClose={onToggle}
          />
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

/**
 * Four short questions, then a generated week the student can still edit.
 * The generator itself lives in lib/study-schedule so the Student Hub's daily
 * recommendation and this flow rank chapters exactly the same way.
 *
 * The review step (step 3) has two sub-modes: a read-only preview of the
 * generated plan, and an "Edit Plan" mode where every row is editable,
 * reorderable, and deletable, plus a form to add sessions outright. Edits
 * live in a local draft until "Save Changes" folds them back into the
 * working plan — Cancel discards them, and the AI's own output is never
 * touched until the student explicitly saves.
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

  // Edit Plan mode — a scoped draft so nothing touches `generated` (the
  // working plan) until the student explicitly saves.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<StudySession[]>([]);
  const [originalAiIds, setOriginalAiIds] = useState<Set<string>>(new Set());
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(false);

  const toggle = (list: number[], value: number) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const generate = () => {
    setGenerateError(false);
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      // On failure nothing here changes — activeDays/priorities/step all stay
      // exactly as the student left them, so Retry just re-runs this attempt.
      if (Math.random() < GENERATE_ERROR_RATE) {
        setGenerateError(true);
        return;
      }
      setGenerated(
        generateWeekPlan(
          subjects,
          plan,
          schedule,
          { activeDays, prioritySubjectIds, weeklyMinutes: weeklyHours * 60, sessionMinutes, breakMinutes },
          todayKey()
        )
      );
      setEditing(false);
      setDraft([]);
      setOpenRowId(null);
      setAddOpen(false);
      setStep(3);
    }, 500);
  };

  // Any edit that has already been folded into `generated` via a prior Save
  // Changes, plus an in-progress edit session, both count as work the
  // student would lose by regenerating.
  const hasUnsavedWork = editing || generated.some((s) => s.source === "student");
  const requestRegenerate = () => {
    if (hasUnsavedWork) setConfirmRegenerateOpen(true);
    else generate();
  };

  const startEditing = () => {
    setDraft(generated.map((s) => ({ ...s })));
    setOriginalAiIds(new Set(generated.filter((s) => s.source === "ai").map((s) => s.id)));
    setOpenRowId(null);
    setAddOpen(false);
    setEditing(true);
  };
  const saveChanges = () => {
    setGenerated(draft);
    setEditing(false);
    setOpenRowId(null);
  };
  const cancelEditing = () => {
    setEditing(false);
    setDraft([]);
    setOpenRowId(null);
    setAddOpen(false);
  };

  const updateDraftSession = (id: string, patch: Partial<StudySession>) =>
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch, source: "student" as const } : s)));
  const deleteDraftSession = (id: string) => {
    setDraft((prev) => prev.filter((s) => s.id !== id));
    setOpenRowId(null);
  };
  const addDraftSession = (draftSession: Omit<StudySession, "id" | "status">) => {
    setDraft((prev) => [...prev, { ...draftSession, id: `manual-${Date.now()}`, status: "scheduled" }]);
    setAddOpen(false);
  };
  const reorderDay = (dateKey: string, newOrder: StudySession[]) => {
    setDraft((prev) => {
      const before = prev
        .filter((s) => s.date === dateKey)
        .sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime));
      const times = before.map((s) => s.startTime);
      const reassigned = newOrder.map((s, i) => ({
        ...s,
        startTime: times[i] ?? s.startTime,
        source: s.source === "ai" ? ("student" as const) : s.source,
      }));
      const others = prev.filter((s) => s.date !== dateKey);
      return [...others, ...reassigned];
    });
  };
  const badgeFor = (s: StudySession): "ai" | "edited" | null => {
    if (s.source === "ai") return "ai";
    if (editing && originalAiIds.has(s.id)) return "edited";
    return null;
  };

  const activeSessions = editing ? draft : generated;
  const byDay = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), i))
    .map((dateKey) => ({
      dateKey,
      sessions: activeSessions
        .filter((s) => s.date === dateKey)
        .sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime)),
    }))
    .filter((d) => d.sessions.length > 0);

  return (
    <Modal title={strings.schedulePlanMyWeekTitle[lang]} onClose={onClose}>
      <div className="relative flex flex-col gap-5">
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
                  <div className="flex items-center gap-3">
                    {!editing && (
                      <button
                        onClick={startEditing}
                        disabled={generated.length === 0}
                        className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground disabled:opacity-40"
                      >
                        <Pencil size={12} strokeWidth={1.75} />
                        {strings.planEditModeBtn[lang]}
                      </button>
                    )}
                    <button
                      onClick={requestRegenerate}
                      disabled={generating}
                      className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground disabled:opacity-40"
                    >
                      <RotateCcw size={12} strokeWidth={1.75} className={generating ? "animate-spin" : ""} />
                      {generating ? strings.schedulePlanGenerating[lang] : strings.schedulePlanRegenerate[lang]}
                    </button>
                  </div>
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
                        {editing ? (
                          <Reorder.Group
                            as="div"
                            axis="y"
                            values={sessions}
                            onReorder={(newOrder) => reorderDay(dateKey, newOrder as StudySession[])}
                            className="flex flex-col gap-1.5"
                          >
                            {sessions.map((s) => (
                              <EditableSessionRow
                                key={s.id}
                                lang={lang}
                                session={s}
                                subjects={subjects}
                                badge={badgeFor(s)}
                                isOpen={openRowId === s.id}
                                conflict={findConflict(draft, s, s.id)}
                                onToggle={() => setOpenRowId((id) => (id === s.id ? null : s.id))}
                                onChange={(patch) => updateDraftSession(s.id, patch)}
                                onDelete={() => deleteDraftSession(s.id)}
                              />
                            ))}
                          </Reorder.Group>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {sessions.map((s) => {
                              const subject = findSubject(subjects, s.subjectId);
                              const chapter = findChapter(subjects, s.subjectId, s.chapterId);
                              const badge = badgeFor(s);
                              const topicLabel = [subject?.name[lang], chapter?.name[lang]]
                                .filter(Boolean)
                                .join(" · ");
                              return (
                                <div
                                  key={s.id}
                                  className="flex min-w-0 items-baseline gap-3 overflow-hidden rounded-lg border border-border bg-surface-muted px-3 py-2"
                                >
                                  <span className="shrink-0 text-xs tabular-nums text-foreground-muted">
                                    {formatTime(s.startTime, lang)}
                                  </span>
                                  <Tooltip label={topicLabel} side="top" className="min-w-0 flex-1">
                                    <span className="block w-full min-w-0 truncate text-sm text-foreground">
                                      {subject?.name[lang]}
                                      {chapter && (
                                        <span className="text-foreground-muted"> · {chapter.name[lang]}</span>
                                      )}
                                    </span>
                                  </Tooltip>
                                  {badge && <ProvenanceBadge lang={lang} kind={badge} />}
                                  <span className="shrink-0 text-xs tabular-nums text-foreground-faint">
                                    {formatDuration(s.durationMinutes, lang)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {editing && (
                  <div className="border-t border-border pt-3">
                    <button
                      onClick={() => setAddOpen((o) => !o)}
                      className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      <motion.span
                        animate={{ rotate: addOpen ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="flex"
                      >
                        <Plus size={13} strokeWidth={2} />
                      </motion.span>
                      {strings.planAddSessionToggle[lang]}
                    </button>
                    <AnimatePresence initial={false}>
                      {addOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: EASE }}
                          className="overflow-hidden"
                        >
                          <div className="pt-3">
                            <CreateSessionForm lang={lang} subjects={subjects} onCreate={addDraftSession} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {generateError && (step === 2 || step === 3) && (
          <div role="alert" className="flex items-center gap-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            <span className="flex-1">{strings.schedulePlanGenerateFailedDesc[lang]}</span>
            <button onClick={generate} className="shrink-0 font-medium underline underline-offset-2 hover:opacity-80">
              {strings.retryBtn[lang]}
            </button>
            <button
              onClick={() => setGenerateError(false)}
              aria-label={strings.dismissErrorLabel[lang]}
              className="shrink-0 rounded-md p-1 hover:bg-danger/10"
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        )}

        {step === 3 && editing ? (
          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={cancelEditing}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              {strings.cancelBtn[lang]}
            </button>
            <button onClick={saveChanges} className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground">
              {strings.planSaveChangesBtn[lang]}
            </button>
          </div>
        ) : (
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
                disabled={activeDays.length === 0 || generating}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
              >
                {generating ? strings.schedulePlanGenerating[lang] : strings.schedulePlanGenerate[lang]}
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
        )}

        <AnimatePresence>
          {confirmRegenerateOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-surface/95 p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="flex max-w-xs flex-col items-center gap-3 text-center"
              >
                <p className="text-sm font-semibold text-foreground-strong">{strings.planRegenerateConfirmTitle[lang]}</p>
                <p className="text-xs text-foreground-muted">{strings.planRegenerateConfirmDesc[lang]}</p>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => setConfirmRegenerateOpen(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmRegenerateOpen(false);
                      generate();
                    }}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                  >
                    {strings.schedulePlanRegenerate[lang]}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
