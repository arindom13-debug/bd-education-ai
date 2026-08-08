export type ChapterStatus = "mastered" | "in-progress" | "needs-revision" | "not-started";

export type Chapter = {
  id: string;
  name: { en: string; bn: string };
  status: ChapterStatus;
  progress: number;
  estimatedMinutes?: number;
};

export type Subject = {
  id: string;
  name: { en: string; bn: string };
  progress: number;
  chapters: Chapter[];
  totalChapters: number;
  lastStudiedDaysAgo: number;
};

export const subjects: Subject[] = [
  {
    id: "bangla-1",
    name: { en: "Bangla 1st Paper", bn: "বাংলা ১ম পত্র" },
    progress: 40,
    chapters: [],
    totalChapters: 15,
    lastStudiedDaysAgo: 2,
  },
  {
    id: "english-1",
    name: { en: "English 1st Paper", bn: "ইংরেজি ১ম পত্র" },
    progress: 25,
    chapters: [],
    totalChapters: 12,
    lastStudiedDaysAgo: 5,
  },
  {
    id: "mathematics",
    name: { en: "Mathematics", bn: "গণিত" },
    progress: 55,
    chapters: [],
    totalChapters: 18,
    lastStudiedDaysAgo: 1,
  },
  {
    id: "chemistry",
    name: { en: "Chemistry", bn: "রসায়ন" },
    progress: 48,
    totalChapters: 5,
    lastStudiedDaysAgo: 0,
    chapters: [
      {
        id: "ch-1",
        name: { en: "Chemistry & Its Branches", bn: "রসায়নের ধারণা" },
        status: "mastered",
        progress: 100,
        estimatedMinutes: 20,
      },
      {
        id: "ch-2",
        name: { en: "Structure of Matter", bn: "পদার্থের গঠন" },
        status: "mastered",
        progress: 100,
        estimatedMinutes: 25,
      },
      {
        id: "ch-3",
        name: { en: "Periodic Table", bn: "পর্যায় সারণি" },
        status: "needs-revision",
        progress: 100,
        estimatedMinutes: 30,
      },
      {
        id: "ch-4",
        name: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
        status: "in-progress",
        progress: 62,
        estimatedMinutes: 35,
      },
      {
        id: "ch-5",
        name: { en: "Behaviour of Gases", bn: "গ্যাসের আচরণ" },
        status: "not-started",
        progress: 0,
        estimatedMinutes: 25,
      },
    ],
  },
  {
    id: "physics",
    name: { en: "Physics", bn: "পদার্থবিজ্ঞান" },
    progress: 30,
    chapters: [],
    totalChapters: 16,
    lastStudiedDaysAgo: 3,
  },
  {
    id: "biology",
    name: { en: "Biology", bn: "জীববিজ্ঞান" },
    progress: 18,
    chapters: [],
    totalChapters: 14,
    lastStudiedDaysAgo: 6,
  },
  {
    id: "ict",
    name: { en: "ICT", bn: "তথ্য ও যোগাযোগ প্রযুক্তি" },
    progress: 70,
    chapters: [],
    totalChapters: 9,
    lastStudiedDaysAgo: 0,
  },
];

// A chapter counts toward completion once it's been learned, even if it's
// since been flagged for revision — "needs revision" is a reminder overlay,
// not unfinished work.
export function isChapterComplete(status: ChapterStatus): boolean {
  return status === "mastered" || status === "needs-revision";
}

export function getSubjectProgress(subject: Subject): number {
  if (subject.chapters.length === 0) return subject.progress;
  const completedCount = subject.chapters.filter((c) => isChapterComplete(c.status)).length;
  return Math.round((completedCount / subject.chapters.length) * 100);
}

export function getSubjectTotalChapters(subject: Subject): number {
  return subject.chapters.length > 0 ? subject.chapters.length : subject.totalChapters;
}

export function getSubjectChaptersCompleted(subject: Subject): number {
  if (subject.chapters.length > 0) {
    return subject.chapters.filter((c) => isChapterComplete(c.status)).length;
  }
  return Math.round((getSubjectProgress(subject) / 100) * subject.totalChapters);
}

/** The single chapter within this subject most worth studying next — finish what's started, then revise, then begin new material. */
export function getChapterRecommendation(subject: Subject): Chapter | null {
  return (
    subject.chapters.find((c) => c.status === "in-progress") ??
    subject.chapters.find((c) => c.status === "needs-revision") ??
    subject.chapters.find((c) => c.status === "not-started") ??
    null
  );
}

const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliDigits(n: number): string {
  return String(n)
    .split("")
    .map((d) => (d >= "0" && d <= "9" ? bengaliDigits[Number(d)] : d))
    .join("");
}

export function getSubjectNextChapterLabel(subject: Subject, lang: "en" | "bn"): string | null {
  if (subject.chapters.length > 0) {
    const next = getChapterRecommendation(subject);
    return next ? next.name[lang] : null;
  }
  const completed = getSubjectChaptersCompleted(subject);
  const total = getSubjectTotalChapters(subject);
  if (completed >= total) return null;
  const nextNumber = completed + 1;
  return lang === "en" ? `Chapter ${nextNumber}` : `অধ্যায় ${toBengaliDigits(nextNumber)}`;
}

export function getSubjectRemainingMinutes(subject: Subject): number {
  const total = getSubjectTotalChapters(subject);
  const completed = getSubjectChaptersCompleted(subject);
  return Math.max(0, total - completed) * 25;
}

export function getSubjectReadiness(subject: Subject, isWeak: boolean): number {
  const progress = getSubjectProgress(subject);
  return isWeak ? Math.max(0, progress - 15) : progress;
}

export type RecommendedChapter = {
  subjectId: string;
  subjectName: { en: string; bn: string };
  chapter: Chapter;
};

export function getNextRecommendedChapter(subjects: Subject[]): RecommendedChapter | null {
  const inProgress = subjects
    .flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })))
    .find((entry) => entry.chapter.status === "in-progress");
  if (inProgress) {
    return {
      subjectId: inProgress.subject.id,
      subjectName: inProgress.subject.name,
      chapter: inProgress.chapter,
    };
  }
  const notStarted = subjects
    .flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })))
    .find((entry) => entry.chapter.status === "not-started");
  if (notStarted) {
    return {
      subjectId: notStarted.subject.id,
      subjectName: notStarted.subject.name,
      chapter: notStarted.chapter,
    };
  }
  return null;
}

export type ActiveChapter = {
  subject: Subject;
  chapter: Chapter;
};

/** The chapter the student is genuinely mid-way through right now, if any. */
export function getActiveChapter(subjects: Subject[]): ActiveChapter | null {
  for (const subject of subjects) {
    const chapter = subject.chapters.find((c) => c.status === "in-progress");
    if (chapter) return { subject, chapter };
  }
  return null;
}

export const streakDays = 5;

export const suggestedTopic = {
  subjectId: "chemistry",
  subjectName: { en: "Chemistry", bn: "রসায়ন" },
  chapterName: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
  progress: 62,
};
