"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, Minus, Play, Plus, Sparkles, Trash2, X } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";
import type { StudyPlan } from "@/lib/study-plan";
import {
  addDays,
  availableMinutesOn,
  findChapter,
  findSubject,
  formatDuration,
  formatTime,
  minutesFromTime,
  nextUpcomingSession,
  sessionsOn,
  todayKey,
  weekdayLabels,
  weeklyMinutesForSubject,
  type ScheduleState,
  type StudySession,
  type TimeSlot,
} from "@/lib/study-schedule";
import { formatClock, getRemainingMs, type TimerContext, type TimerState } from "@/lib/study-timer";
import { useTimerNow } from "@/components/study-timer-controls";
import { StartStudyForm } from "@/components/start-study-form";
import { CreateSessionForm } from "@/components/create-session-form";
import { PlanMyWeek } from "@/components/plan-my-week";

const EASE = [0.16, 1, 0.3, 1] as const;

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{title}</p>
          {description && <p className="mt-1 text-sm text-foreground-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** One row in the day timeline. Active/next is marked with a left rule rather
 * than a colour fill, keeping the calendar restrained. */
function SessionRow({
  lang,
  session,
  subjects,
  highlighted,
  isRunning,
  remainingLabel,
  onStart,
  onDelete,
}: {
  lang: Lang;
  session: StudySession;
  subjects: Subject[];
  highlighted: boolean;
  isRunning: boolean;
  remainingLabel?: string;
  onStart?: () => void;
  onDelete?: () => void;
}) {
  const subject = findSubject(subjects, session.subjectId);
  const chapter = findChapter(subjects, session.subjectId, session.chapterId);
  const done = session.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: EASE }}
      className={`group flex items-start gap-3 rounded-xl border py-3 pl-3 pr-3 transition-colors duration-150 ${
        highlighted ? "border-foreground-faint bg-surface-muted" : "border-border bg-surface hover:bg-surface-muted"
      }`}
    >
      <div className="w-16 shrink-0 pt-0.5">
        <p className="text-xs tabular-nums text-foreground-muted">{formatTime(session.startTime, lang)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${done ? "text-foreground-muted" : "text-foreground-strong"}`}>
          {done && <Check size={12} strokeWidth={2.5} className="mr-1 inline text-success" />}
          {subject?.name[lang] ?? session.subjectId}
        </p>
        {chapter && <p className="truncate text-xs text-foreground-muted">{chapter.name[lang]}</p>}
        {session.goal && <p className="mt-0.5 truncate text-[11px] text-foreground-faint">{session.goal}</p>}
        <p className="mt-0.5 text-[11px] text-foreground-faint">
          {isRunning && remainingLabel
            ? `${strings.scheduleCurrentlyStudying[lang]} · ${remainingLabel} ${strings.scheduleRemainingWord[lang]}`
            : formatDuration(session.completedMinutes ?? session.durationMinutes, lang)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onStart && !done && !isRunning && (
          <button
            onClick={onStart}
            className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground-muted opacity-0 transition-all duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Play size={11} strokeWidth={2} />
            {strings.scheduleStartBtn[lang]}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label={strings.scheduleDeleteSession[lang]}
            className="rounded-md p-1.5 text-foreground-faint opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Trash2 size={13} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function WeeklyTargetRow({
  lang,
  subject,
  targetMinutes,
  doneMinutes,
  onChange,
}: {
  lang: Lang;
  subject: Subject;
  targetMinutes: number;
  doneMinutes: number;
  onChange: (minutes: number) => void;
}) {
  const pct = targetMinutes > 0 ? Math.min(100, Math.round((doneMinutes / targetMinutes) * 100)) : 0;
  const step = 30;
  return (
    <div className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{subject.name[lang]}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-progress-track">
            <motion.div
              className="h-full rounded-full bg-success"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-foreground-muted">
            {formatDuration(doneMinutes, lang)} / {formatDuration(targetMinutes, lang)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, targetMinutes - step))}
          aria-label="Decrease"
          className="flex size-6 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors duration-150 hover:border-foreground-faint hover:text-foreground"
        >
          <Minus size={11} strokeWidth={2} />
        </button>
        <button
          onClick={() => onChange(Math.min(1200, targetMinutes + step))}
          aria-label="Increase"
          className="flex size-6 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors duration-150 hover:border-foreground-faint hover:text-foreground"
        >
          <Plus size={11} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function AvailabilityRow({
  lang,
  dayIndex,
  slots,
  onChange,
}: {
  lang: Lang;
  dayIndex: number;
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}) {
  const update = (i: number, patch: Partial<TimeSlot>) =>
    onChange(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:gap-4">
      <p className="w-24 shrink-0 pt-1.5 text-sm text-foreground">{weekdayLabels[dayIndex][lang]}</p>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {slots.length === 0 && (
          <p className="pt-1.5 text-xs text-foreground-faint">{strings.scheduleNotAvailable[lang]}</p>
        )}
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              value={slot.start}
              onChange={(e) => update(i, { start: e.target.value })}
              className="rounded-lg border border-border bg-control px-2 py-1.5 text-xs outline-none focus:border-foreground-faint"
            />
            <span className="text-xs text-foreground-faint">—</span>
            <input
              type="time"
              value={slot.end}
              onChange={(e) => update(i, { end: e.target.value })}
              className="rounded-lg border border-border bg-control px-2 py-1.5 text-xs outline-none focus:border-foreground-faint"
            />
            <button
              onClick={() => onChange(slots.filter((_, idx) => idx !== i))}
              aria-label={strings.scheduleNotAvailable[lang]}
              className="rounded-md p-1 text-foreground-faint transition-colors duration-150 hover:text-foreground"
            >
              <X size={13} strokeWidth={1.75} />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...slots, { start: "17:00", end: "19:00" }])}
          className="flex items-center gap-1 self-start text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <Plus size={12} strokeWidth={2} />
          {strings.scheduleAddSlot[lang]}
        </button>
      </div>
    </div>
  );
}

export function StudyScheduleView({
  lang,
  subjects,
  plan,
  schedule,
  timer,
  onAddSession,
  onDeleteSession,
  onReplaceWeek,
  onUpdateTargets,
  onUpdateAvailability,
  onStartSession,
}: {
  lang: Lang;
  subjects: Subject[];
  plan: StudyPlan;
  schedule: ScheduleState;
  timer: TimerState;
  onAddSession: (draft: Omit<StudySession, "id" | "status">) => void;
  onDeleteSession: (id: string) => void;
  onReplaceWeek: (sessions: StudySession[]) => void;
  onUpdateTargets: (targets: Record<string, number>) => void;
  onUpdateAvailability: (availability: TimeSlot[][]) => void;
  onStartSession: (context: TimerContext, minutes: number) => void;
}) {
  const [planOpen, setPlanOpen] = useState(false);
  const now = useTimerNow(timer.status);
  const timerRemainingLabel = formatClock(getRemainingMs(timer, now));
  const today = todayKey();
  const todaySessions = sessionsOn(schedule.sessions, today);
  const next = nextUpcomingSession(schedule.sessions);
  const upcoming = Array.from({ length: 6 }, (_, i) => addDays(today, i + 1))
    .map((d) => ({ dateKey: d, sessions: sessionsOn(schedule.sessions, d).filter((s) => s.status === "scheduled") }))
    .filter((d) => d.sessions.length > 0);
  const history = schedule.sessions
    .filter((s) => s.status === "completed")
    .sort((a, b) => (a.date === b.date ? minutesFromTime(b.startTime) - minutesFromTime(a.startTime) : a.date < b.date ? 1 : -1))
    .slice(0, 8);

  const startFromSession = (session: StudySession) =>
    onStartSession(
      {
        subjectId: session.subjectId,
        chapterId: session.chapterId,
        goal: session.goal,
        sessionId: session.id,
      },
      session.durationMinutes
    );

  const runningSessionId = timer.context?.sessionId ?? null;
  const nextSubject = next ? findSubject(subjects, next.subjectId) : null;
  const nextChapter = next ? findChapter(subjects, next.subjectId, next.chapterId) : null;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">
              {strings.scheduleTitle[lang]}
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">{strings.scheduleSubtitle[lang]}</p>
          </div>
          <button
            onClick={() => setPlanOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform duration-150 active:scale-[0.98]"
          >
            <Sparkles size={14} strokeWidth={1.75} />
            {strings.schedulePlanMyWeekBtn[lang]}
          </button>
        </div>

        {/* Next session — the one thing to act on right now */}
        {next && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {strings.scheduleNextSessionLabel[lang]}
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground-strong">
                  {formatTime(next.startTime, lang)}
                </p>
                <p className="mt-0.5 truncate text-sm text-foreground">{nextSubject?.name[lang]}</p>
                {nextChapter && <p className="truncate text-xs text-foreground-muted">{nextChapter.name[lang]}</p>}
                <p className="mt-0.5 text-[11px] text-foreground-faint">
                  {formatDuration(next.durationMinutes, lang)}
                  {next.date !== today && ` · ${weekdayLabels[new Date(next.date).getDay()][lang]}`}
                </p>
              </div>
              <button
                onClick={() => startFromSession(next)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-muted"
              >
                <Play size={13} strokeWidth={2} />
                {strings.scheduleStartEarlyBtn[lang]}
              </button>
            </div>
          </div>
        )}

        {/* Today's timeline */}
        <SectionCard title={strings.scheduleTodayLabel[lang]}>
          {todaySessions.length === 0 ? (
            <div className="py-2">
              <p className="text-sm text-foreground">{strings.scheduleNoSessionsToday[lang]}</p>
              <p className="mt-1 text-xs text-foreground-muted">{strings.scheduleNoSessionsTodayDesc[lang]}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {todaySessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    lang={lang}
                    session={s}
                    subjects={subjects}
                    highlighted={next?.id === s.id || runningSessionId === s.id}
                    isRunning={runningSessionId === s.id}
                    remainingLabel={timerRemainingLabel}
                    onStart={() => startFromSession(s)}
                    onDelete={() => onDeleteSession(s.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </SectionCard>

        {/* Start something now, without scheduling it */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <StartStudyForm
            lang={lang}
            subjects={subjects}
            defaultMinutes={timer.settings.focusMinutes}
            onStart={onStartSession}
          />
        </div>

        <SectionCard title={strings.scheduleCreateSessionTitle[lang]}>
          <CreateSessionForm lang={lang} subjects={subjects} onCreate={onAddSession} />
        </SectionCard>

        {upcoming.length > 0 && (
          <SectionCard title={strings.scheduleUpcomingTitle[lang]}>
            <div className="flex flex-col gap-4">
              {upcoming.map(({ dateKey, sessions }) => (
                <div key={dateKey}>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-foreground-faint">
                    {dateKey === addDays(today, 1)
                      ? strings.scheduleTomorrowLabel[lang]
                      : weekdayLabels[new Date(dateKey).getDay()][lang]}
                  </p>
                  <div className="flex flex-col gap-2">
                    {sessions.map((s) => (
                      <SessionRow
                        key={s.id}
                        lang={lang}
                        session={s}
                        subjects={subjects}
                        highlighted={false}
                        isRunning={false}
                        onStart={() => startFromSession(s)}
                        onDelete={() => onDeleteSession(s.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard
          title={strings.scheduleWeeklyTargetTitle[lang]}
          description={strings.scheduleWeeklyTargetDesc[lang]}
        >
          <div className="flex flex-col">
            {subjects.map((s) => (
              <WeeklyTargetRow
                key={s.id}
                lang={lang}
                subject={s}
                targetMinutes={schedule.weeklyTargets[s.id] ?? 0}
                doneMinutes={weeklyMinutesForSubject(schedule.sessions, s.id)}
                onChange={(m) => onUpdateTargets({ ...schedule.weeklyTargets, [s.id]: m })}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={strings.scheduleAvailabilityTitle[lang]}
          description={strings.scheduleAvailabilityDesc[lang]}
          action={
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-foreground-faint">
              <CalendarDays size={13} strokeWidth={1.75} />
              {formatDuration(availableMinutesOn(schedule.availability, schedule.sessions, today), lang)}
            </span>
          }
        >
          <div className="flex flex-col">
            {schedule.availability.map((slots, i) => (
              <AvailabilityRow
                key={i}
                lang={lang}
                dayIndex={i}
                slots={slots}
                onChange={(next) =>
                  onUpdateAvailability(schedule.availability.map((s, idx) => (idx === i ? next : s)))
                }
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title={strings.scheduleHistoryTitle[lang]}>
          {history.length === 0 ? (
            <p className="text-sm text-foreground-muted">{strings.scheduleNoHistory[lang]}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((s) => (
                <SessionRow key={s.id} lang={lang} session={s} subjects={subjects} highlighted={false} isRunning={false} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <AnimatePresence>
        {planOpen && (
          <PlanMyWeek
            lang={lang}
            subjects={subjects}
            plan={plan}
            schedule={schedule}
            sessionMinutes={timer.settings.focusMinutes}
            breakMinutes={timer.settings.breakMinutes}
            onApply={onReplaceWeek}
            onClose={() => setPlanOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
