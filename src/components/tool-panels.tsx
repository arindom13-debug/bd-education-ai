"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Plus, Sparkles, FileCheck2, Check } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  notebookEntries,
  aiNotebookEntries,
  mistakeBookEntries,
  savedAnswers,
  roadmapWeeks,
  alarmSounds,
} from "@/lib/tools-data";
import {
  cyclePosition,
  formatClock,
  getRemainingMs,
  studyTimerPresets,
  type TimerActions,
  type TimerState,
} from "@/lib/study-timer";
import { CycleDots, TimerSettingsForm, useTimerNow } from "@/components/study-timer-controls";

export function StudyTimerPanel({
  lang,
  timer,
  actions,
}: {
  lang: Lang;
  timer: TimerState;
  actions: TimerActions;
}) {
  const now = useTimerNow(timer.status);
  const remainingMs = getRemainingMs(timer, now);
  const active = timer.status === "running" || timer.status === "paused";
  const cycle = cyclePosition(timer);
  const phaseLabel =
    timer.phase === "focus"
      ? strings.timerPhaseFocus[lang]
      : timer.phase === "break"
      ? strings.timerPhaseBreak[lang]
      : strings.timerPhaseLongBreak[lang];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.timerCurrentSessionLabel[lang]}
          </p>
          <CycleDots completed={cycle.completed} total={cycle.total} />
        </div>
        {active ? (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground-strong">{phaseLabel}</p>
              <p className="text-5xl font-semibold tabular-nums tracking-tight">{formatClock(remainingMs)}</p>
              <p className="text-xs text-foreground-muted">{strings.timerRemainingLabel[lang]}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => (timer.status === "running" ? actions.pause() : actions.resume())}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
              >
                {timer.status === "running" ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
                {timer.status === "running" ? strings.timerPause[lang] : strings.timerResume[lang]}
              </button>
              <button
                onClick={() => actions.reset()}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground"
              >
                <RotateCcw size={15} strokeWidth={1.75} />
                {strings.timerReset[lang]}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm font-medium text-foreground-strong">{strings.timerNoActiveSession[lang]}</p>
            <p className="text-xs text-foreground-muted">{strings.timerNoActiveSessionDesc[lang]}</p>
            <button
              onClick={() => actions.start("focus")}
              className="mt-1 flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
            >
              <Play size={15} strokeWidth={2} />
              {strings.timerStart[lang]}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.timerSessionSettingsLabel[lang]}
        </p>
        <TimerSettingsForm lang={lang} settings={timer.settings} actions={actions} showPreview={false} />
        <label className="flex items-center justify-between text-sm">
          <span>{strings.timerAutoStartLabel[lang]}</span>
          <input
            type="checkbox"
            checked={timer.settings.autoStartNext}
            onChange={(e) => actions.updateSettings({ autoStartNext: e.target.checked })}
            className="size-4 accent-accent"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>{strings.alarmToggleLabel[lang]}</span>
          <input
            type="checkbox"
            checked={timer.settings.alarmOn}
            onChange={(e) => actions.updateSettings({ alarmOn: e.target.checked })}
            className="size-4 accent-accent"
          />
        </label>
        {timer.settings.alarmOn && (
          <div>
            <p className="text-xs text-foreground-muted">{strings.alarmSoundLabel[lang]}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {alarmSounds.map((s, i) => (
                <button
                  key={s.en}
                  onClick={() => actions.updateSettings({ alarmSoundIndex: i })}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    timer.settings.alarmSoundIndex === i
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-foreground-muted"
                  }`}
                >
                  {s[lang]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.timerPresetsLabel[lang]}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {studyTimerPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => actions.applyPreset(p)}
              className="rounded-xl border border-border p-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
            >
              <p className="text-sm font-medium">{p.label[lang]}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {p.focusMinutes} {strings.minutesWord[lang]} · {p.breakMinutes} {strings.minutesWord[lang]}{" "}
                {strings.timerBreakLabel[lang]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotebookPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      <button className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted hover:text-foreground">
        <Plus size={13} strokeWidth={1.75} />
        {strings.newNote[lang]}
      </button>
      <div className="flex flex-col gap-2">
        {notebookEntries.map((n, i) => (
          <div key={i} className="rounded-xl border border-border p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{n.title[lang]}</p>
              <span className="shrink-0 text-xs text-foreground-muted">{n.date[lang]}</span>
            </div>
            <p className="mt-1 text-xs text-foreground-muted">{n.snippet[lang]}</p>
            <span className="mt-2 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-muted">
              {n.subject[lang]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AiNotebookPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      {aiNotebookEntries.map((n, i) => (
        <div key={i} className="rounded-xl border border-border bg-highlight p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles size={13} strokeWidth={1.75} className="text-accent" />
            <p className="text-sm font-medium text-accent">{n.title[lang]}</p>
          </div>
          <ul className="mt-2 list-disc pl-4 text-xs text-foreground">
            {n.points[lang].map((pt, j) => (
              <li key={j}>{pt}</li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-foreground-muted">{n.generatedFrom[lang]}</p>
        </div>
      ))}
    </div>
  );
}

export function MistakeBookPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      {mistakeBookEntries.map((m, i) => (
        <div key={i} className="rounded-xl border border-border p-3.5">
          <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-muted">
            {m.subject[lang]}
          </span>
          <p className="mt-2 text-sm font-medium">{m.question[lang]}</p>
          <p className="mt-2 text-xs text-danger">
            {strings.yourAnswer[lang]}: <span className="line-through">{m.yourAnswer[lang]}</span>
          </p>
          <p className="mt-1 text-xs text-success">
            {strings.correctAnswer[lang]}: {m.correctAnswer[lang]}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SavedAnswersPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      {savedAnswers.map((a, i) => (
        <div key={i} className="rounded-xl border border-border p-3.5">
          <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-muted">
            {a.subject[lang]}
          </span>
          <p className="mt-2 text-sm font-medium">{a.question[lang]}</p>
          <p className="mt-1 text-xs text-foreground-muted">{a.answer[lang]}</p>
          <p className="mt-2 text-xs text-foreground-muted">{a.source[lang]}</p>
        </div>
      ))}
    </div>
  );
}

export function MyLibraryPanel({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState<"aiNotebook" | "savedAnswers">("aiNotebook");
  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
      active ? "bg-accent-soft text-accent" : "text-foreground-muted hover:text-foreground"
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg border border-border p-1">
        <button onClick={() => setTab("aiNotebook")} className={tabClass(tab === "aiNotebook")}>
          <Sparkles size={13} strokeWidth={1.75} />
          {strings.aiNotebookTitle[lang]}
        </button>
        <button onClick={() => setTab("savedAnswers")} className={tabClass(tab === "savedAnswers")}>
          <FileCheck2 size={13} strokeWidth={1.75} />
          {strings.savedAnswersTitle[lang]}
        </button>
      </div>
      {tab === "aiNotebook" ? <AiNotebookPanel lang={lang} /> : <SavedAnswersPanel lang={lang} />}
    </div>
  );
}

export function AiRoadmapPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col">
      {roadmapWeeks.map((w, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                w.status === "done"
                  ? "bg-success text-white"
                  : w.status === "in-progress"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-foreground-muted"
              }`}
            >
              {w.status === "done" ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            {i < roadmapWeeks.length - 1 && <span className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium">{w.week[lang]}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{w.topics[lang]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
