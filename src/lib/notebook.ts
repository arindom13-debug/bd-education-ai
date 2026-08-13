import { toBengaliDigits } from "@/lib/curriculum-data";

/**
 * A student's own note. Fully self-contained — the Notebook tool owns this
 * data end to end, it isn't read or written by any other feature. Optional
 * chapterId/sourceTopic let a note retain where it came from (e.g. an AI
 * learning session) without requiring one.
 */
export type Note = {
  id: string;
  title: string;
  subjectId: string | null;
  content: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
  chapterId?: string | null;
  sourceTopic?: string;
};

const STORAGE_KEY = "arindoms-ai-notebook";

/** A few realistic starting notes so the panel isn't empty on first run —
 * same spirit as the previous static demo entries, now real editable data. */
function seedNotes(): Note[] {
  const now = Date.now();
  const day = 86_400_000;
  return [
    {
      id: "seed-1",
      title: "Chemical reactions — key points",
      subjectId: "chemistry",
      chapterId: "ch-4",
      content: "Exothermic releases heat, endothermic absorbs it. Watch for state changes in equations.",
      pinned: false,
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    },
    {
      id: "seed-2",
      title: "Quadratic formula tricks",
      subjectId: "mathematics",
      content: "Always check the discriminant first — saves time on real vs. complex roots.",
      pinned: false,
      createdAt: now - 4 * day,
      updatedAt: now - 4 * day,
    },
    {
      id: "seed-3",
      title: "Newton's laws — quick recap",
      subjectId: "physics",
      content: "3rd law pairs act on different objects — that's the part board questions test most.",
      pinned: false,
      createdAt: now - 7 * day,
      updatedAt: now - 7 * day,
    },
  ];
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return seedNotes();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedNotes();
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Note[]) : seedNotes();
  } catch {
    return seedNotes();
  }
}

export function saveNotes(notes: Note[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // storage unavailable — notes just won't survive reloads
  }
}

/** Pinned first, then most recently updated. */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export function matchesQuery(note: Note, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q);
}

export function createDraftNote(): Note {
  const now = Date.now();
  return {
    id: `note-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    subjectId: null,
    content: "",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function isEmptyNote(note: Note): boolean {
  return note.title.trim() === "" && note.content.trim() === "";
}

/** "Updated 5m ago" style relative time, bilingual. */
export function timeAgo(ms: number, lang: "en" | "bn", now: number = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  const week = day * 7;

  const fmt = (n: number, unitEn: string, unitBn: string) =>
    lang === "en" ? `${n}${unitEn} ago` : `${toBengaliDigits(n)} ${unitBn} আগে`;

  if (diff < minute) return lang === "en" ? "just now" : "এইমাত্র";
  if (diff < hour) return fmt(Math.floor(diff / minute), "m", "মিনিট");
  if (diff < day) return fmt(Math.floor(diff / hour), "h", "ঘণ্টা");
  if (diff < week) return fmt(Math.floor(diff / day), "d", "দিন");
  return fmt(Math.floor(diff / week), "w", "সপ্তাহ");
}
