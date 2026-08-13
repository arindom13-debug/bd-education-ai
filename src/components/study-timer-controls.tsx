"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import {
  breakDurationOptions,
  focusDurationOptions,
  longBreakDurationOptions,
  longBreakIntervalOptions,
  type TimerActions,
  type TimerSettings,
  type TimerStatus,
} from "@/lib/study-timer";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Forces a re-render once a second while a phase is running, so any
 * consumer can derive a live MM:SS purely from the stored end timestamp. */
export function useTimerNow(status: TimerStatus): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [status]);
  return now;
}

/** A slim ring showing how far through the current phase the student is —
 * green while running (the app's one progress color), muted while paused. */
export function TimerProgressRing({
  progress,
  status,
  size = 18,
  strokeWidth = 2,
}: {
  progress: number;
  status: TimerStatus;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: circumference * (1 - clamped) }}
        transition={{ duration: status === "running" ? 0.4 : 0.2, ease: "linear" }}
        className={status === "paused" ? "text-foreground-faint" : "text-success"}
      />
    </svg>
  );
}

/** Compact "● ● ● ○" cycle indicator — how many focus sessions have landed
 * since the last long break. */
export function CycleDots({ completed, total }: { completed: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`size-1.5 rounded-full transition-colors duration-200 ${i < completed ? "bg-success" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function CustomStepper({
  lang,
  value,
  min,
  max,
  step,
  onCommit,
  onCancel,
}: {
  lang: Lang;
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (v: number) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(String(value));

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const commit = () => {
    const n = parseInt(text, 10);
    if (Number.isFinite(n)) onCommit(clamp(n));
    else setText(String(value));
  };
  const bump = (delta: number) => {
    const n = clamp((parseInt(text, 10) || value) + delta);
    setText(String(n));
    onCommit(n);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="overflow-hidden"
    >
      <div className="flex items-center justify-center gap-3 pt-2.5">
        <button
          type="button"
          onClick={() => bump(-step)}
          disabled={value <= min}
          aria-label="Decrease"
          className="flex size-7 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors duration-150 hover:border-foreground-faint hover:text-foreground disabled:opacity-30"
        >
          <Minus size={13} strokeWidth={2} />
        </button>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            inputMode="numeric"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setText(String(value));
                onCancel();
              }
            }}
            className="w-12 rounded-md border border-border bg-control px-1.5 py-1 text-center text-sm tabular-nums outline-none focus:border-foreground-faint"
          />
          <span className="text-xs text-foreground-muted">{strings.minutesWord[lang]}</span>
        </div>
        <button
          type="button"
          onClick={() => bump(step)}
          disabled={value >= max}
          aria-label="Increase"
          className="flex size-7 items-center justify-center rounded-md border border-border text-foreground-muted transition-colors duration-150 hover:border-foreground-faint hover:text-foreground disabled:opacity-30"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}

export function DurationPicker({
  lang,
  label,
  value,
  options,
  onChange,
  min = 1,
  max = 180,
  step = 5,
}: {
  lang: Lang;
  label: string;
  value: number;
  options: number[];
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [forceCustom, setForceCustom] = useState(false);
  const showCustom = forceCustom || !options.includes(value);

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
      active
        ? "border-accent bg-surface-muted text-foreground-strong"
        : "border-border text-foreground-muted hover:border-foreground-faint hover:bg-surface-muted hover:text-foreground"
    }`;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((m) => (
          <motion.button
            key={m}
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15, ease: EASE }}
            onClick={() => {
              setForceCustom(false);
              onChange(m);
            }}
            className={chipClass(!showCustom && value === m)}
          >
            {m} {strings.minutesWord[lang]}
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15, ease: EASE }}
          onClick={() => setForceCustom(true)}
          className={chipClass(showCustom)}
        >
          {strings.timerCustomLabel[lang]}
        </motion.button>
      </div>
      <AnimatePresence initial={false}>
        {showCustom && (
          <CustomStepper
            lang={lang}
            value={value}
            min={min}
            max={max}
            step={step}
            onCommit={onChange}
            onCancel={() => setForceCustom(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Chip row used for the non-duration option groups (long-break interval). */
function ChipRow({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  renderLabel: (v: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((n) => (
        <motion.button
          key={n}
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.15, ease: EASE }}
          onClick={() => onChange(n)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
            value === n
              ? "border-accent bg-surface-muted text-foreground-strong"
              : "border-border text-foreground-muted hover:border-foreground-faint hover:bg-surface-muted hover:text-foreground"
          }`}
        >
          {renderLabel(n)}
        </motion.button>
      ))}
    </div>
  );
}

/**
 * The whole timer configuration, focus-first. Long-break rules are real
 * Pomodoro settings but most students never touch them, so they stay folded
 * behind a disclosure rather than competing with the two that matter.
 */
export function TimerSettingsForm({
  lang,
  settings,
  actions,
  showPreview = true,
}: {
  lang: Lang;
  settings: TimerSettings;
  actions: TimerActions;
  showPreview?: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {showPreview && (
        <LiveTimerPreview
          lang={lang}
          focusMinutes={settings.focusMinutes}
          breakMinutes={settings.breakMinutes}
          longBreakMinutes={settings.longBreakMinutes}
        />
      )}

      <DurationPicker
        lang={lang}
        label={strings.timerFocusSessionLabel[lang]}
        value={settings.focusMinutes}
        options={focusDurationOptions}
        onChange={(m) => actions.updateSettings({ focusMinutes: m })}
      />

      <DurationPicker
        lang={lang}
        label={strings.timerBreakAfterSession[lang]}
        value={settings.breakMinutes}
        options={breakDurationOptions}
        max={60}
        onChange={(m) => actions.updateSettings({ breakMinutes: m })}
      />

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          aria-expanded={advancedOpen}
          className="flex w-full items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <motion.span
            animate={{ rotate: advancedOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex"
          >
            <ChevronRight size={13} strokeWidth={2} />
          </motion.span>
          {strings.timerAdvancedBreakSettings[lang]}
        </button>
        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-4 pt-3">
                <DurationPicker
                  lang={lang}
                  label={strings.timerLongBreakDurationLabel[lang]}
                  value={settings.longBreakMinutes}
                  options={longBreakDurationOptions}
                  max={90}
                  onChange={(m) => actions.updateSettings({ longBreakMinutes: m })}
                />
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.timerLongBreakAfter[lang]}
                  </p>
                  <ChipRow
                    options={longBreakIntervalOptions}
                    value={settings.longBreakInterval}
                    onChange={(n) => actions.updateSettings({ longBreakInterval: n })}
                    renderLabel={(n) => `${n} ${strings.timerSessionsWord[lang]}`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LiveTimerPreview({
  lang,
  focusMinutes,
  breakMinutes,
  longBreakMinutes,
}: {
  lang: Lang;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">{strings.timerPhaseFocus[lang]}</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={focusMinutes}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="text-3xl font-semibold tabular-nums tracking-tight text-foreground-strong"
        >
          {String(focusMinutes).padStart(2, "0")}:00
        </motion.p>
      </AnimatePresence>
      <div className="mt-2 flex flex-col gap-0.5 text-xs text-foreground-muted">
        <span>
          {strings.timerPhaseFocus[lang]} {focusMinutes} {strings.minutesWord[lang]}
        </span>
        <span>
          {strings.timerPhaseBreak[lang]} {breakMinutes} {strings.minutesWord[lang]}
        </span>
        <span>
          {strings.timerLongBreakDurationLabel[lang]} {longBreakMinutes} {strings.minutesWord[lang]}
        </span>
      </div>
    </div>
  );
}
