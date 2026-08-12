export type ChapterStatus = "mastered" | "in-progress" | "needs-revision" | "not-started";

/** Where a chapter's current status came from — lets the UI show its
 * provenance without ever letting AI inference silently overrule a student's
 * own correction (see setChapterStatus in app-shell.tsx: any status change
 * made through the UI is a manual override by construction). */
export type ProgressSource = "ai" | "manual";

export type Chapter = {
  id: string;
  name: { en: string; bn: string };
  status: ChapterStatus;
  progress: number;
  estimatedMinutes?: number;
  /** "nctb" = part of the official seeded syllabus. "custom" = the student
   * typed this in themselves via Add Chapter, so it's kept visually distinct
   * rather than blended invisibly into the official curriculum. */
  source?: "nctb" | "custom";
  progressSource?: ProgressSource;
};

export type Subject = {
  id: string;
  name: { en: string; bn: string };
  progress: number;
  chapters: Chapter[];
  totalChapters: number;
  lastStudiedDaysAgo: number;
};

// Representative NCTB-aligned chapter sets — a demo-scale subset of each
// subject's real Class 9-10 table of contents, not the complete syllabus.
export const subjects: Subject[] = [
  {
    id: "bangla-1",
    name: { en: "Bangla 1st Paper", bn: "বাংলা ১ম পত্র" },
    progress: 40,
    totalChapters: 8,
    lastStudiedDaysAgo: 2,
    chapters: [
      { id: "bn-1", name: { en: "Aparichita", bn: "অপরিচিতা" }, status: "mastered", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "ai" },
      { id: "bn-2", name: { en: "Amar Path", bn: "আমার পথ" }, status: "mastered", progress: 100, estimatedMinutes: 20, source: "nctb", progressSource: "manual" },
      { id: "bn-3", name: { en: "Banglar Mati Banglar Jol", bn: "বাংলার মাটি বাংলার জল" }, status: "needs-revision", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "ai" },
      { id: "bn-4", name: { en: "Sultanar Swapno", bn: "সুলতানার স্বপ্ন" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "bn-5", name: { en: "Nimgachh", bn: "নিমগাছ" }, status: "not-started", progress: 0, estimatedMinutes: 20, source: "nctb" },
      { id: "bn-6", name: { en: "Bilashi", bn: "বিলাসী" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "bn-7", name: { en: "Kobita: Jonmokotha", bn: "কবিতা: জন্মকথা" }, status: "not-started", progress: 0, estimatedMinutes: 15, source: "nctb" },
      { id: "bn-8", name: { en: "Kobita: Ekattorer Dinguli", bn: "কবিতা: একাত্তরের দিনগুলি" }, status: "not-started", progress: 0, estimatedMinutes: 15, source: "nctb" },
    ],
  },
  {
    id: "english-1",
    name: { en: "English 1st Paper", bn: "ইংরেজি ১ম পত্র" },
    progress: 25,
    totalChapters: 7,
    lastStudiedDaysAgo: 5,
    chapters: [
      { id: "en-1", name: { en: "Unit 1: People and Places", bn: "ইউনিট ১: People and Places" }, status: "mastered", progress: 100, estimatedMinutes: 20, source: "nctb", progressSource: "ai" },
      { id: "en-2", name: { en: "Unit 2: Story and Fable", bn: "ইউনিট ২: Story and Fable" }, status: "needs-revision", progress: 100, estimatedMinutes: 20, source: "nctb", progressSource: "manual" },
      { id: "en-3", name: { en: "Unit 3: Youth and Nation Building", bn: "ইউনিট ৩: Youth and Nation Building" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "en-4", name: { en: "Unit 4: Environment and Nature", bn: "ইউনিট ৪: Environment and Nature" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "en-5", name: { en: "Unit 5: World Civilization", bn: "ইউনিট ৫: World Civilization" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "en-6", name: { en: "Grammar: Tense & Voice", bn: "গ্রামার: Tense ও Voice" }, status: "not-started", progress: 0, estimatedMinutes: 20, source: "nctb" },
      { id: "en-7", name: { en: "Writing: Paragraph & Composition", bn: "রাইটিং: Paragraph ও Composition" }, status: "not-started", progress: 0, estimatedMinutes: 20, source: "nctb" },
    ],
  },
  {
    id: "mathematics",
    name: { en: "Mathematics", bn: "গণিত" },
    progress: 55,
    totalChapters: 9,
    lastStudiedDaysAgo: 1,
    chapters: [
      { id: "math-1", name: { en: "Real Numbers", bn: "বাস্তব সংখ্যা" }, status: "mastered", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "ai" },
      { id: "math-2", name: { en: "Sets and Functions", bn: "সেট ও ফাংশন" }, status: "mastered", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "ai" },
      { id: "math-3", name: { en: "Algebraic Expressions", bn: "বীজগাণিতিক রাশি" }, status: "mastered", progress: 100, estimatedMinutes: 30, source: "nctb", progressSource: "manual" },
      { id: "math-4", name: { en: "Exponents and Logarithms", bn: "সূচক ও লগারিদম" }, status: "needs-revision", progress: 100, estimatedMinutes: 30, source: "nctb", progressSource: "ai" },
      { id: "math-5", name: { en: "Simultaneous Equations", bn: "একযোগে সমীকরণ" }, status: "not-started", progress: 0, estimatedMinutes: 35, source: "nctb" },
      { id: "math-6", name: { en: "Geometry: Triangles", bn: "জ্যামিতি: ত্রিভুজ" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "math-7", name: { en: "Trigonometric Ratios", bn: "ত্রিকোণমিতিক অনুপাত" }, status: "not-started", progress: 0, estimatedMinutes: 35, source: "nctb" },
      { id: "math-8", name: { en: "Practical Geometry", bn: "ব্যবহারিক জ্যামিতি" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "math-9", name: { en: "Statistics", bn: "পরিসংখ্যান" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
    ],
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
        source: "nctb",
        progressSource: "ai",
      },
      {
        id: "ch-2",
        name: { en: "Structure of Matter", bn: "পদার্থের গঠন" },
        status: "mastered",
        progress: 100,
        estimatedMinutes: 25,
        source: "nctb",
        progressSource: "ai",
      },
      {
        id: "ch-3",
        name: { en: "Periodic Table", bn: "পর্যায় সারণি" },
        status: "needs-revision",
        progress: 100,
        estimatedMinutes: 30,
        source: "nctb",
        progressSource: "manual",
      },
      {
        id: "ch-4",
        name: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
        status: "in-progress",
        progress: 62,
        estimatedMinutes: 35,
        source: "nctb",
        progressSource: "ai",
      },
      {
        id: "ch-5",
        name: { en: "Behaviour of Gases", bn: "গ্যাসের আচরণ" },
        status: "not-started",
        progress: 0,
        estimatedMinutes: 25,
        source: "nctb",
      },
    ],
  },
  {
    id: "physics",
    name: { en: "Physics", bn: "পদার্থবিজ্ঞান" },
    progress: 30,
    totalChapters: 8,
    lastStudiedDaysAgo: 3,
    chapters: [
      { id: "ph-1", name: { en: "Physical Quantities & Measurement", bn: "ভৌত রাশি ও পরিমাপ" }, status: "mastered", progress: 100, estimatedMinutes: 20, source: "nctb", progressSource: "ai" },
      { id: "ph-2", name: { en: "Motion", bn: "গতি" }, status: "mastered", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "manual" },
      { id: "ph-3", name: { en: "Force", bn: "বল" }, status: "needs-revision", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "ai" },
      { id: "ph-4", name: { en: "Newton's Laws of Motion", bn: "নিউটনের গতিসূত্র" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "ph-5", name: { en: "Work, Power and Energy", bn: "কাজ, ক্ষমতা ও শক্তি" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "ph-6", name: { en: "Pressure and States of Matter", bn: "চাপ ও পদার্থের অবস্থা" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "ph-7", name: { en: "Waves", bn: "তরঙ্গ" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "ph-8", name: { en: "Current Electricity", bn: "চল বিদ্যুৎ" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
    ],
  },
  {
    id: "biology",
    name: { en: "Biology", bn: "জীববিজ্ঞান" },
    progress: 18,
    totalChapters: 7,
    lastStudiedDaysAgo: 6,
    chapters: [
      { id: "bio-1", name: { en: "Organization of Life", bn: "জীবনের সংগঠন" }, status: "mastered", progress: 100, estimatedMinutes: 20, source: "nctb", progressSource: "ai" },
      { id: "bio-2", name: { en: "Cell Division", bn: "কোষ বিভাজন" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "bio-3", name: { en: "Classification of Living Organisms", bn: "জীবের শ্রেণিবিন্যাস" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "bio-4", name: { en: "Cell and Tissue", bn: "কোষ ও টিস্যু" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "bio-5", name: { en: "Plant Physiology", bn: "উদ্ভিদ শারীরতত্ত্ব" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "bio-6", name: { en: "Human Digestive System", bn: "মানুষের পরিপাকতন্ত্র" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
      { id: "bio-7", name: { en: "Reproduction in Plants", bn: "উদ্ভিদের প্রজনন" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
    ],
  },
  {
    id: "ict",
    name: { en: "ICT", bn: "তথ্য ও যোগাযোগ প্রযুক্তি" },
    progress: 70,
    totalChapters: 6,
    lastStudiedDaysAgo: 0,
    chapters: [
      { id: "ict-1", name: { en: "Introduction to ICT", bn: "তথ্য ও যোগাযোগ প্রযুক্তির পরিচিতি" }, status: "mastered", progress: 100, estimatedMinutes: 15, source: "nctb", progressSource: "ai" },
      { id: "ict-2", name: { en: "Communication Systems and Networking", bn: "যোগাযোগ ব্যবস্থা ও নেটওয়ার্কিং" }, status: "mastered", progress: 100, estimatedMinutes: 20, source: "nctb", progressSource: "ai" },
      { id: "ict-3", name: { en: "Number Systems and Digital Devices", bn: "সাংখ্যিক পদ্ধতি ও ডিজিটাল ডিভাইস" }, status: "mastered", progress: 100, estimatedMinutes: 25, source: "nctb", progressSource: "manual" },
      { id: "ict-4", name: { en: "Web Design Introduction (HTML)", bn: "ওয়েব ডিজাইন পরিচিতি (HTML)" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "ict-5", name: { en: "Programming Basics", bn: "প্রোগ্রামিং বেসিক" }, status: "not-started", progress: 0, estimatedMinutes: 30, source: "nctb" },
      { id: "ict-6", name: { en: "Database Basics", bn: "ডেটাবেজ বেসিক" }, status: "not-started", progress: 0, estimatedMinutes: 25, source: "nctb" },
    ],
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

/** The next thing worth studying AFTER the current target — deliberately
 * distinct from getNextRecommendedChapter/getActiveChapter so "Current" and
 * "Next Up" never collapse into the same chapter on screen. */
export function getUpNextChapter(
  subjects: Subject[],
  exclude?: { subjectId: string; chapterId: string }
): RecommendedChapter | null {
  const entries = subjects
    .flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })))
    .filter((entry) => !(exclude && entry.subject.id === exclude.subjectId && entry.chapter.id === exclude.chapterId));

  const needsRevision = entries.find((entry) => entry.chapter.status === "needs-revision");
  if (needsRevision) {
    return { subjectId: needsRevision.subject.id, subjectName: needsRevision.subject.name, chapter: needsRevision.chapter };
  }
  const notStarted = entries.find((entry) => entry.chapter.status === "not-started");
  if (notStarted) {
    return { subjectId: notStarted.subject.id, subjectName: notStarted.subject.name, chapter: notStarted.chapter };
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

// Last-resort placeholder for study-session-view.tsx when there is truly no
// active or recommended chapter anywhere — should rarely be reached.
export const suggestedTopic = {
  subjectId: "chemistry",
  subjectName: { en: "Chemistry", bn: "রসায়ন" },
  chapterName: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
  progress: 62,
};
