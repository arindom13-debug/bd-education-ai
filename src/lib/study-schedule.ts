import {
  getSubjectProgress,
  isChapterComplete,
  type Chapter,
  type Subject,
} from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";

/**
 * The scheduling layer sits between the Study Plan (what there is to learn)
 * and the timer (the execution layer). It owns no curriculum of its own — a
 * session only ever *references* a subject/chapter that already exists in
 * curriculum-data, so progress, schedule, and timer can never disagree.
 */

export type SessionStatus = "scheduled" | "completed" | "skipped";

export type StudySession = {
  id: string;
  subjectId: string;
  /** null = whole-subject session with no specific chapter chosen. */
  chapterId: string | null;
  /** YYYY-MM-DD, local. */
  date: string;
  /** HH:MM, 24h, local. */
  startTime: string;
  durationMinutes: number;
  goal?: string;
  status: SessionStatus;
  /** Minutes actually studied — set when the session is completed. */
  completedMinutes?: number;
};

/** Minutes per week the student wants to give each subject, keyed by subject id. */
export type WeeklyTargets = Record<string, number>;

export type TimeSlot = { start: string; end: string };
/** Indexed 0 = Sunday … 6 = Saturday, matching Date.getDay(). */
export type Availability = TimeSlot[][];

export type ScheduleState = {
  sessions: StudySession[];
  weeklyTargets: WeeklyTargets;
  availability: Availability;
};

// ---------------------------------------------------------------- date utils

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function dayOfWeek(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Sunday-anchored start of the week containing `dateKey`. */
export function startOfWeek(dateKey: string): string {
  return addDays(dateKey, -dayOfWeek(dateKey));
}

export function minutesFromTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeFromMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(total)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 12-hour display used everywhere in the UI ("05:00 PM"). */
export function formatTime(time: string, lang: "en" | "bn"): string {
  const total = minutesFromTime(time);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 < 12 ? (lang === "en" ? "AM" : "পূর্বাহ্ন") : lang === "en" ? "PM" : "অপরাহ্ন";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDuration(minutes: number, lang: "en" | "bn"): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return lang === "en" ? `${m} min` : `${m} মিনিট`;
  if (m === 0) return lang === "en" ? `${h}h` : `${h} ঘণ্টা`;
  return lang === "en" ? `${h}h ${m}m` : `${h} ঘ ${m} মি`;
}

export const weekdayLabels: { en: string; bn: string }[] = [
  { en: "Sunday", bn: "রবিবার" },
  { en: "Monday", bn: "সোমবার" },
  { en: "Tuesday", bn: "মঙ্গলবার" },
  { en: "Wednesday", bn: "বুধবার" },
  { en: "Thursday", bn: "বৃহস্পতিবার" },
  { en: "Friday", bn: "শুক্রবার" },
  { en: "Saturday", bn: "শনিবার" },
];

export const weekdayShortLabels: { en: string; bn: string }[] = [
  { en: "Sun", bn: "রবি" },
  { en: "Mon", bn: "সোম" },
  { en: "Tue", bn: "মঙ্গল" },
  { en: "Wed", bn: "বুধ" },
  { en: "Thu", bn: "বৃহঃ" },
  { en: "Fri", bn: "শুক্র" },
  { en: "Sat", bn: "শনি" },
];

// ------------------------------------------------------------------ defaults

/** Sensible starting point: study after school on weekdays, mornings at the
 * weekend, Wednesday off. The student can change any of it. */
export const defaultAvailability: Availability = [
  [{ start: "10:00", end: "12:00" }], // Sun
  [{ start: "17:00", end: "20:00" }], // Mon
  [{ start: "17:00", end: "21:00" }], // Tue
  [], // Wed — not available
  [{ start: "17:00", end: "20:00" }], // Thu
  [{ start: "15:00", end: "18:00" }], // Fri
  [{ start: "10:00", end: "13:00" }], // Sat
];

export const defaultWeeklyTargets: WeeklyTargets = {
  mathematics: 300,
  physics: 240,
  chemistry: 240,
  biology: 180,
  "bangla-1": 120,
  "english-1": 120,
  ict: 120,
};

/** A week of plausible history so the hub's charts, targets, and history list
 * all read from real session records on first run instead of placeholder
 * arrays. Generated relative to today so it never goes stale. */
function seedSessions(): StudySession[] {
  const t = todayKey();
  const weekStart = startOfWeek(t);
  const elapsedDays = dayOfWeek(t);
  // Anchored to the current week (not to "today minus N") so the hub's weekly
  // chart is always populated, whatever day the app is first opened.
  const perDay: [string, string, number, string][][] = [
    [["mathematics", "math-3", 45, "17:00"]],
    [
      ["chemistry", "ch-2", 30, "18:00"],
      ["physics", "ph-2", 30, "19:30"],
    ],
    [["mathematics", "math-4", 30, "17:00"]],
    [
      ["biology", "bio-1", 45, "10:30"],
      ["ict", "ict-3", 45, "12:00"],
    ],
    [["chemistry", "ch-3", 40, "17:30"]],
    [["mathematics", "math-4", 45, "17:00"]],
    [["english-1", "en-2", 30, "19:00"]],
  ];
  const seeded: StudySession[] = [];
  for (let day = 0; day < elapsedDays; day += 1) {
    perDay[day].forEach(([subjectId, chapterId, minutes, startTime], i) => {
      seeded.push({
        id: `seed-${day}-${i}`,
        subjectId,
        chapterId,
        date: addDays(weekStart, day),
        startTime,
        durationMinutes: minutes,
        status: "completed",
        completedMinutes: minutes,
      });
    });
  }
  // Today's plan — left scheduled so "Next session" and the timeline have
  // something real to point at.
  seeded.push(
    {
      id: "seed-today-1",
      subjectId: "chemistry",
      chapterId: "ch-4",
      date: t,
      startTime: "17:00",
      durationMinutes: 35,
      goal: "",
      status: "scheduled",
    },
    {
      id: "seed-today-2",
      subjectId: "mathematics",
      chapterId: "math-5",
      date: t,
      startTime: "19:00",
      durationMinutes: 45,
      goal: "",
      status: "scheduled",
    }
  );
  return seeded;
}

export function defaultScheduleState(): ScheduleState {
  return {
    sessions: seedSessions(),
    weeklyTargets: defaultWeeklyTargets,
    availability: defaultAvailability,
  };
}

// --------------------------------------------------------------- persistence

const STORAGE_KEY = "arindoms-ai-study-schedule";

export function loadScheduleState(): ScheduleState {
  if (typeof window === "undefined") return defaultScheduleState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultScheduleState();
    const parsed = JSON.parse(raw) as Partial<ScheduleState>;
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      weeklyTargets: { ...defaultWeeklyTargets, ...(parsed.weeklyTargets ?? {}) },
      availability:
        Array.isArray(parsed.availability) && parsed.availability.length === 7
          ? parsed.availability
          : defaultAvailability,
    };
  } catch {
    return defaultScheduleState();
  }
}

export function saveScheduleState(state: ScheduleState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — schedule just won't survive reloads
  }
}

// ------------------------------------------------------------------- queries

export function sessionsOn(sessions: StudySession[], dateKey: string): StudySession[] {
  return sessions
    .filter((s) => s.date === dateKey)
    .sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime));
}

/** The next session still to come — today's next by clock time, otherwise the
 * soonest scheduled day after today. */
export function nextUpcomingSession(sessions: StudySession[], now: Date = new Date()): StudySession | null {
  const t = toDateKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const upcoming = sessions
    .filter((s) => s.status === "scheduled")
    .filter((s) => s.date > t || (s.date === t && minutesFromTime(s.startTime) + s.durationMinutes > nowMinutes))
    .sort((a, b) =>
      a.date === b.date ? minutesFromTime(a.startTime) - minutesFromTime(b.startTime) : a.date < b.date ? -1 : 1
    );
  return upcoming[0] ?? null;
}

export function minutesStudiedOn(sessions: StudySession[], dateKey: string): number {
  return sessions
    .filter((s) => s.date === dateKey && s.status === "completed")
    .reduce((sum, s) => sum + (s.completedMinutes ?? s.durationMinutes), 0);
}

/** Sunday-first array of completed minutes for the week containing `dateKey` —
 * what the hub's weekly chart renders. */
export function weeklyMinutesByDay(sessions: StudySession[], dateKey: string = todayKey()): number[] {
  const start = startOfWeek(dateKey);
  return Array.from({ length: 7 }, (_, i) => minutesStudiedOn(sessions, addDays(start, i)));
}

export function weeklyMinutesForSubject(
  sessions: StudySession[],
  subjectId: string,
  dateKey: string = todayKey()
): number {
  const start = startOfWeek(dateKey);
  const end = addDays(start, 6);
  return sessions
    .filter((s) => s.subjectId === subjectId && s.status === "completed" && s.date >= start && s.date <= end)
    .reduce((sum, s) => sum + (s.completedMinutes ?? s.durationMinutes), 0);
}

/** Total free minutes on a given weekday, minus whatever is already booked. */
export function availableMinutesOn(
  availability: Availability,
  sessions: StudySession[],
  dateKey: string
): number {
  const slots = availability[dayOfWeek(dateKey)] ?? [];
  const capacity = slots.reduce((sum, s) => sum + Math.max(0, minutesFromTime(s.end) - minutesFromTime(s.start)), 0);
  const booked = sessionsOn(sessions, dateKey)
    .filter((s) => s.status === "scheduled")
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  return Math.max(0, capacity - booked);
}

// ------------------------------------------------------------------- ranking

export type ChapterCandidate = {
  subject: Subject;
  chapter: Chapter;
  score: number;
  /** Why this was prioritized — surfaced verbatim in the UI. */
  reason: "highPriority" | "practiceNeeded" | "continueChapter" | "revision" | "getStarted";
};

/**
 * Ranks every unfinished chapter by how much it deserves the student's next
 * hour. Deterministic and explainable — every term below maps to something
 * the student can actually see elsewhere in the app.
 */
export function rankChapters(
  subjects: Subject[],
  plan: StudyPlan,
  schedule: ScheduleState,
  dateKey: string = todayKey()
): ChapterCandidate[] {
  const examDaysLeft = daysUntil(plan.examDate);
  const candidates: ChapterCandidate[] = [];

  for (const subject of subjects) {
    const isWeak = plan.weakSubjects.includes(subject.id);
    const subjectProgress = getSubjectProgress(subject);
    const target = schedule.weeklyTargets[subject.id] ?? 0;
    const done = weeklyMinutesForSubject(schedule.sessions, subject.id, dateKey);
    const deficitRatio = target > 0 ? Math.max(0, (target - done) / target) : 0;

    for (const chapter of subject.chapters) {
      if (chapter.status === "mastered") continue;

      let score = 0;
      let reason: ChapterCandidate["reason"];
      if (chapter.status === "in-progress") {
        score += 100;
        reason = "continueChapter";
      } else if (chapter.status === "needs-revision") {
        score += 80;
        reason = "revision";
      } else {
        score += 50;
        reason = "getStarted";
      }

      // A weak subject earns the biggest single boost — this is the lever the
      // student explicitly pulled in their Learning Profile.
      if (isWeak) {
        score += 40;
        reason = chapter.status === "not-started" ? "practiceNeeded" : reason;
      }
      // Exam pressure ramps up only inside the final month.
      if (examDaysLeft !== null && examDaysLeft >= 0 && examDaysLeft <= 30) {
        score += (30 - examDaysLeft) * 1.5;
        if (isWeak) reason = "highPriority";
      }
      // Behind on this week's target for the subject.
      score += deficitRatio * 30;
      // Nearly-finished subjects yield to ones that still need the ground work.
      if (subjectProgress >= 80) score -= 20;
      // Neglected subjects drift upward over time.
      score += Math.min(subject.lastStudiedDaysAgo, 7) * 2;

      candidates.push({ subject, chapter, score, reason });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Picks the day's chapters without stacking one subject — after a subject is
 * used its remaining candidates are penalised, so a plan reads as a varied
 * study day rather than four rounds of the same book.
 */
export function pickForDay(
  ranked: ChapterCandidate[],
  availableMinutes: number,
  defaultSessionMinutes: number
): { candidate: ChapterCandidate; minutes: number }[] {
  const picks: { candidate: ChapterCandidate; minutes: number }[] = [];
  const usedSubjects = new Map<string, number>();
  const usedChapters = new Set<string>();
  let remaining = availableMinutes;

  while (remaining >= 20) {
    let best: ChapterCandidate | null = null;
    let bestScore = -Infinity;
    for (const c of ranked) {
      if (usedChapters.has(c.chapter.id)) continue;
      const penalty = (usedSubjects.get(c.subject.id) ?? 0) * 45;
      const adjusted = c.score - penalty;
      if (adjusted > bestScore) {
        bestScore = adjusted;
        best = c;
      }
    }
    if (!best) break;

    const wanted = best.chapter.estimatedMinutes ?? defaultSessionMinutes;
    const minutes = Math.min(Math.max(20, wanted), remaining);
    picks.push({ candidate: best, minutes });
    usedChapters.add(best.chapter.id);
    usedSubjects.set(best.subject.id, (usedSubjects.get(best.subject.id) ?? 0) + 1);
    remaining -= minutes;
  }

  return picks;
}

/** Lays picks onto a day's real free slots, back to back with a short gap. */
function layOutDay(
  dateKey: string,
  slots: TimeSlot[],
  picks: { candidate: ChapterCandidate; minutes: number }[],
  breakMinutes: number,
  idPrefix: string
): StudySession[] {
  const out: StudySession[] = [];
  let slotIndex = 0;
  let cursor = slots.length > 0 ? minutesFromTime(slots[0].start) : 0;

  for (const pick of picks) {
    while (slotIndex < slots.length) {
      const slotEnd = minutesFromTime(slots[slotIndex].end);
      if (cursor + pick.minutes <= slotEnd) break;
      slotIndex += 1;
      if (slotIndex < slots.length) cursor = minutesFromTime(slots[slotIndex].start);
    }
    if (slotIndex >= slots.length) break;

    out.push({
      id: `${idPrefix}-${dateKey}-${out.length}`,
      subjectId: pick.candidate.subject.id,
      chapterId: pick.candidate.chapter.id,
      date: dateKey,
      startTime: timeFromMinutes(cursor),
      durationMinutes: pick.minutes,
      status: "scheduled",
    });
    cursor += pick.minutes + breakMinutes;
  }

  return out;
}

export type WeekPlanOptions = {
  /** Days of the week the student opted into for this plan. */
  activeDays: number[];
  /** Subject ids the student flagged as priorities in the planning flow. */
  prioritySubjectIds: string[];
  /** Total minutes they said they can give the whole week. */
  weeklyMinutes: number;
  sessionMinutes: number;
  breakMinutes: number;
};

/**
 * Generates a week of sessions from the same ranking used everywhere else,
 * spread across the days the student is actually free.
 */
export function generateWeekPlan(
  subjects: Subject[],
  plan: StudyPlan,
  schedule: ScheduleState,
  options: WeekPlanOptions,
  fromDateKey: string = todayKey()
): StudySession[] {
  const ranked = rankChapters(subjects, plan, schedule, fromDateKey).map((c) =>
    options.prioritySubjectIds.includes(c.subject.id) ? { ...c, score: c.score + 50 } : c
  );
  if (ranked.length === 0) return [];

  const days = Array.from({ length: 7 }, (_, i) => addDays(fromDateKey, i)).filter((d) =>
    options.activeDays.includes(dayOfWeek(d))
  );
  if (days.length === 0) return [];

  const perDayBudget = Math.floor(options.weeklyMinutes / days.length);
  const sessions: StudySession[] = [];
  const consumed = new Set<string>();

  for (const dateKey of days) {
    const slots = schedule.availability[dayOfWeek(dateKey)] ?? [];
    if (slots.length === 0) continue;
    const slotCapacity = slots.reduce(
      (sum, s) => sum + Math.max(0, minutesFromTime(s.end) - minutesFromTime(s.start)),
      0
    );
    const budget = Math.min(perDayBudget, slotCapacity);
    const pool = ranked.filter((c) => !consumed.has(c.chapter.id));
    const picks = pickForDay(pool, budget, options.sessionMinutes);
    picks.forEach((p) => consumed.add(p.candidate.chapter.id));
    sessions.push(...layOutDay(dateKey, slots, picks, options.breakMinutes, "plan"));
  }

  return sessions;
}

/** Today's recommended list for the Student Hub — same ranking, fitted to
 * whatever time is actually left today. */
export function recommendForToday(
  subjects: Subject[],
  plan: StudyPlan,
  schedule: ScheduleState,
  defaultSessionMinutes: number,
  dateKey: string = todayKey()
): { candidate: ChapterCandidate; minutes: number }[] {
  const minutes = availableMinutesOn(schedule.availability, schedule.sessions, dateKey);
  const ranked = rankChapters(subjects, plan, schedule, dateKey);
  return pickForDay(ranked, minutes || defaultSessionMinutes * 2, defaultSessionMinutes).slice(0, 4);
}

// ------------------------------------------------------------------- helpers

export function findSubject(subjects: Subject[], subjectId: string): Subject | null {
  return subjects.find((s) => s.id === subjectId) ?? null;
}

export function findChapter(subjects: Subject[], subjectId: string, chapterId: string | null): Chapter | null {
  if (!chapterId) return null;
  return findSubject(subjects, subjectId)?.chapters.find((c) => c.id === chapterId) ?? null;
}

/** Chapters worth offering when scheduling — finished ones are filtered out
 * unless they're flagged for revision. */
export function schedulableChapters(subject: Subject): Chapter[] {
  return subject.chapters.filter((c) => !isChapterComplete(c.status) || c.status === "needs-revision");
}

export const durationOptions = [15, 25, 30, 45, 60, 90];
