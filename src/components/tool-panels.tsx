"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Plus, Sparkles, FileCheck2, Check } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  notebookEntries,
  aiNotebookEntries,
  mistakeBookEntries,
  savedAnswers,
  roadmapWeeks,
  timerPresets,
  alarmSounds,
} from "@/lib/tools-data";

export function StudyTimerPanel({ lang }: { lang: Lang }) {
  const [presetIndex, setPresetIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(timerPresets[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [alarmOn, setAlarmOn] = useState(true);
  const [soundIndex, setSoundIndex] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const selectPreset = (i: number) => {
    setPresetIndex(i);
    setSecondsLeft(timerPresets[i].minutes * 60);
    setRunning(false);
  };

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center gap-2">
        {timerPresets.map((p, i) => (
          <button
            key={p.minutes}
            onClick={() => selectPreset(i)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              presetIndex === i
                ? "border-accent bg-accent-soft text-accent"
                : "border-border text-foreground-muted"
            }`}
          >
            {p.label[lang]}
          </button>
        ))}
      </div>

      <div className="text-center text-5xl font-semibold tabular-nums tracking-tight">
        {minutes}:{seconds}
      </div>

      <div className="flex justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
        >
          {running ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
          {running ? strings.timerPause[lang] : strings.timerStart[lang]}
        </button>
        <button
          onClick={() => selectPreset(presetIndex)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground"
        >
          <RotateCcw size={15} strokeWidth={1.75} />
          {strings.timerReset[lang]}
        </button>
      </div>

      <div className="rounded-xl border border-border p-4">
        <label className="flex items-center justify-between text-sm">
          <span>{strings.alarmToggleLabel[lang]}</span>
          <input
            type="checkbox"
            checked={alarmOn}
            onChange={(e) => setAlarmOn(e.target.checked)}
            className="size-4 accent-accent"
          />
        </label>
        {alarmOn && (
          <>
            <p className="mt-3 text-xs text-foreground-muted">{strings.alarmSoundLabel[lang]}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {alarmSounds.map((s, i) => (
                <button
                  key={s.en}
                  onClick={() => setSoundIndex(i)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    soundIndex === i
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-foreground-muted"
                  }`}
                >
                  {s[lang]}
                </button>
              ))}
            </div>
          </>
        )}
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
        <div key={i} className="rounded-xl border border-accent/30 bg-accent-soft p-3.5">
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
          <p className="mt-2 text-xs text-warning">
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
