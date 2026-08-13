export type TimerPhase = "focus" | "break" | "longBreak";
export type TimerStatus = "idle" | "running" | "paused" | "completed";

export type TimerSettings = {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  /** After this many completed focus sessions, the next break is a long break. */
  longBreakInterval: number;
  autoStartNext: boolean;
  alarmOn: boolean;
  alarmSoundIndex: number;
};

/**
 * What the current focus block is *about*. References the curriculum by id
 * only — the timer never copies subject/chapter data, so it can't drift out
 * of sync with the Study Plan. `sessionId` links back to a scheduled
 * StudySession when the block came from the schedule rather than an ad-hoc start.
 */
export type TimerContext = {
  subjectId: string;
  chapterId: string | null;
  goal?: string;
  sessionId?: string;
};

export type TimerState = {
  status: TimerStatus;
  phase: TimerPhase;
  /** Absolute ms-since-epoch the current phase ends — only meaningful while running. */
  endAt: number | null;
  /** Remaining ms captured at the moment of pausing — only meaningful while paused. */
  remainingMsAtPause: number | null;
  /** Total duration of the current phase, in ms — drives the idle/progress display. */
  phaseDurationMs: number;
  /** Minutes of the most recently completed focus phase, for the completion copy. */
  completedFocusMinutes: number;
  /** Focus sessions completed since the last long break — drives the cycle dots. */
  focusSessionsCompleted: number;
  /** What this focus block is about, when it has a subject attached. */
  context: TimerContext | null;
  settings: TimerSettings;
};

export const defaultTimerSettings: TimerSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartNext: false,
  alarmOn: true,
  alarmSoundIndex: 0,
};

export const defaultTimerState: TimerState = {
  status: "idle",
  phase: "focus",
  endAt: null,
  remainingMsAtPause: null,
  phaseDurationMs: defaultTimerSettings.focusMinutes * 60_000,
  completedFocusMinutes: 0,
  focusSessionsCompleted: 0,
  context: null,
  settings: defaultTimerSettings,
};

const STORAGE_KEY = "arindoms-ai-study-timer";

export function loadTimerState(): TimerState {
  if (typeof window === "undefined") return defaultTimerState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTimerState;
    const parsed = JSON.parse(raw) as Partial<TimerState>;
    const settings: TimerSettings = { ...defaultTimerSettings, ...(parsed.settings ?? {}) };
    const state: TimerState = {
      status: parsed.status ?? "idle",
      phase: parsed.phase ?? "focus",
      endAt: typeof parsed.endAt === "number" ? parsed.endAt : null,
      remainingMsAtPause: typeof parsed.remainingMsAtPause === "number" ? parsed.remainingMsAtPause : null,
      phaseDurationMs:
        typeof parsed.phaseDurationMs === "number" ? parsed.phaseDurationMs : phaseMinutes("focus", settings) * 60_000,
      completedFocusMinutes: typeof parsed.completedFocusMinutes === "number" ? parsed.completedFocusMinutes : 0,
      focusSessionsCompleted: typeof parsed.focusSessionsCompleted === "number" ? parsed.focusSessionsCompleted : 0,
      context: parsed.context ?? null,
      settings,
    };
    // A phase that finished while the tab was closed is surfaced as completed
    // immediately, rather than silently lost or left drifting into negative time.
    if (state.status === "running" && state.endAt !== null && state.endAt <= Date.now()) {
      return markCompleted(state);
    }
    return state;
  } catch {
    return defaultTimerState;
  }
}

export function saveTimerState(state: TimerState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — timer just won't survive reloads
  }
}

export function phaseMinutes(phase: TimerPhase, settings: TimerSettings): number {
  if (phase === "focus") return settings.focusMinutes;
  if (phase === "break") return settings.breakMinutes;
  return settings.longBreakMinutes;
}

/** Focus always leads to a break; which kind depends on how many focus
 * sessions have landed since the last long break. Any break always leads
 * back to focus. */
export function nextPhaseFor(state: TimerState): TimerPhase {
  if (state.phase !== "focus") return "focus";
  const interval = Math.max(1, state.settings.longBreakInterval);
  return state.focusSessionsCompleted > 0 && state.focusSessionsCompleted % interval === 0 ? "longBreak" : "break";
}

/** How far through the current long-break cycle the student is, for the
 * compact "● ● ● ○" indicator — e.g. 3 of 4 completed, about to long-break. */
export function cyclePosition(state: TimerState): { completed: number; total: number } {
  const total = Math.max(1, state.settings.longBreakInterval);
  const completed = state.focusSessionsCompleted % total === 0 && state.focusSessionsCompleted > 0
    ? total
    : state.focusSessionsCompleted % total;
  return { completed, total };
}

/** Derives the live remaining time from the stored timestamp — never a
 * decrementing counter, so it can't drift and stays correct after a reload. */
export function getRemainingMs(state: TimerState, now: number = Date.now()): number {
  if (state.status === "running" && state.endAt !== null) return Math.max(0, state.endAt - now);
  if (state.status === "paused" && state.remainingMsAtPause !== null) return state.remainingMsAtPause;
  if (state.status === "completed") return 0;
  return state.phaseDurationMs;
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function startPhase(state: TimerState, phase: TimerPhase, now: number = Date.now()): TimerState {
  const durationMs = phaseMinutes(phase, state.settings) * 60_000;
  return { ...state, status: "running", phase, endAt: now + durationMs, remainingMsAtPause: null, phaseDurationMs: durationMs };
}

export function quickStart(
  state: TimerState,
  focusMinutes: number,
  breakMinutes: number,
  now: number = Date.now()
): TimerState {
  const settings = { ...state.settings, focusMinutes, breakMinutes };
  const durationMs = focusMinutes * 60_000;
  return {
    ...state,
    settings,
    status: "running",
    phase: "focus",
    endAt: now + durationMs,
    remainingMsAtPause: null,
    phaseDurationMs: durationMs,
  };
}

/** Starts a focus block attached to a subject/chapter — the path used by both
 * the schedule ("Start early", "Start today's plan") and the manual start form. */
export function startSessionPhase(
  state: TimerState,
  context: TimerContext,
  minutes: number,
  now: number = Date.now()
): TimerState {
  const durationMs = minutes * 60_000;
  return {
    ...state,
    settings: { ...state.settings, focusMinutes: minutes },
    status: "running",
    phase: "focus",
    endAt: now + durationMs,
    remainingMsAtPause: null,
    phaseDurationMs: durationMs,
    context,
  };
}

/** Ends a contextual session early, keeping how far it actually got so the
 * caller can record partial credit against the scheduled session. */
export function endSession(state: TimerState, now: number = Date.now()): TimerState {
  return {
    ...state,
    status: "idle",
    endAt: null,
    remainingMsAtPause: null,
    context: null,
    completedFocusMinutes: Math.round(elapsedMs(state, now) / 60_000),
  };
}

/** How much of the current phase has actually been spent. */
export function elapsedMs(state: TimerState, now: number = Date.now()): number {
  return Math.max(0, state.phaseDurationMs - getRemainingMs(state, now));
}

export function pauseTimer(state: TimerState, now: number = Date.now()): TimerState {
  if (state.status !== "running" || state.endAt === null) return state;
  return { ...state, status: "paused", remainingMsAtPause: Math.max(0, state.endAt - now), endAt: null };
}

export function resumeTimer(state: TimerState, now: number = Date.now()): TimerState {
  if (state.status !== "paused" || state.remainingMsAtPause === null) return state;
  return { ...state, status: "running", endAt: now + state.remainingMsAtPause, remainingMsAtPause: null };
}

export function resetTimer(state: TimerState): TimerState {
  return { ...state, status: "idle", endAt: null, remainingMsAtPause: null };
}

export function markCompleted(state: TimerState): TimerState {
  const wasFocus = state.phase === "focus";
  const wasLongBreak = state.phase === "longBreak";
  return {
    ...state,
    status: "completed",
    endAt: null,
    remainingMsAtPause: null,
    completedFocusMinutes: wasFocus ? Math.round(state.phaseDurationMs / 60_000) : state.completedFocusMinutes,
    focusSessionsCompleted: wasFocus
      ? state.focusSessionsCompleted + 1
      : wasLongBreak
      ? 0
      : state.focusSessionsCompleted,
  };
}

export function dismissCompletion(state: TimerState): TimerState {
  return { ...state, status: "idle", endAt: null, remainingMsAtPause: null, context: null };
}

/** Updates settings; an already-running/paused phase keeps counting down
 * exactly as started — only the idle display reflects new durations live. */
export function applySettings(state: TimerState, patch: Partial<TimerSettings>): TimerState {
  const settings = { ...state.settings, ...patch };
  if (state.status !== "idle") return { ...state, settings };
  return { ...state, settings, phaseDurationMs: phaseMinutes(state.phase, settings) * 60_000 };
}

export type TimerPreset = { id: string; label: { en: string; bn: string }; focusMinutes: number; breakMinutes: number };

export const studyTimerPresets: TimerPreset[] = [
  { id: "quick", label: { en: "Quick Focus", bn: "দ্রুত ফোকাস" }, focusMinutes: 15, breakMinutes: 5 },
  { id: "standard", label: { en: "Standard", bn: "স্ট্যান্ডার্ড" }, focusMinutes: 25, breakMinutes: 5 },
  { id: "deep", label: { en: "Deep Focus", bn: "গভীর ফোকাস" }, focusMinutes: 50, breakMinutes: 10 },
  { id: "long", label: { en: "Long Study", bn: "দীর্ঘ পড়াশোনা" }, focusMinutes: 90, breakMinutes: 15 },
];

export function applyPreset(state: TimerState, preset: TimerPreset): TimerState {
  return applySettings(state, { focusMinutes: preset.focusMinutes, breakMinutes: preset.breakMinutes });
}

export const focusDurationOptions = [15, 25, 45, 60, 90];
export const breakDurationOptions = [5, 10, 15];
export const longBreakDurationOptions = [15, 20, 30];
export const longBreakIntervalOptions = [2, 3, 4];

/** The single shared surface every consumer (global pill, sidebar badge,
 * Tools page) drives the global timer through — kept as one bundle since the
 * app has no context provider and threading nine callbacks individually
 * would just add noise at every level in between. */
export type TimerActions = {
  start: (phase: TimerPhase) => void;
  quickStart: (focusMinutes: number, breakMinutes: number) => void;
  /** Start a focus block attached to a subject/chapter (schedule or manual). */
  startSession: (context: TimerContext, minutes: number) => void;
  /** Stop a contextual session early and bank the time actually spent. */
  endSession: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  applyPreset: (preset: TimerPreset) => void;
  updateSettings: (patch: Partial<TimerSettings>) => void;
  dismissCompletion: () => void;
};
