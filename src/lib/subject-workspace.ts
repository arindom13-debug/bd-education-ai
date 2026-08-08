import { strings, type Lang } from "@/lib/i18n";
import {
  getSubjectChaptersCompleted,
  getSubjectTotalChapters,
  toBengaliDigits,
  type Subject,
} from "@/lib/curriculum-data";

/** The chapter the student is actively mid-way through, if any. */
export function getCurrentTopic(subject: Subject, lang: Lang): string | null {
  const inProgress = subject.chapters.find((c) => c.status === "in-progress");
  if (inProgress) return inProgress.name[lang];
  if (subject.chapters.length > 0) return null;

  // No granular chapter data yet — fall back to a generic label from overall progress.
  const completed = getSubjectChaptersCompleted(subject);
  const total = getSubjectTotalChapters(subject);
  if (completed >= total) return null;
  return lang === "en" ? `Chapter ${completed + 1}` : `অধ্যায় ${toBengaliDigits(completed + 1)}`;
}

/** What comes after the current topic. */
export function getNextTopic(subject: Subject, lang: Lang): string | null {
  if (subject.chapters.length > 0) {
    const inProgressIndex = subject.chapters.findIndex((c) => c.status === "in-progress");
    const searchFrom = inProgressIndex === -1 ? 0 : inProgressIndex + 1;
    const next = subject.chapters.slice(searchFrom).find((c) => c.status !== "mastered");
    return next ? next.name[lang] : null;
  }

  const completed = getSubjectChaptersCompleted(subject);
  const total = getSubjectTotalChapters(subject);
  const nextNumber = completed + 2;
  if (nextNumber > total) return null;
  return lang === "en" ? `Chapter ${nextNumber}` : `অধ্যায় ${toBengaliDigits(nextNumber)}`;
}

export function formatLastStudied(daysAgo: number, lang: Lang): string {
  if (daysAgo === 0) return strings.today[lang];
  if (daysAgo === 1) return strings.yesterday[lang];
  return `${daysAgo} ${strings.daysAgo[lang]}`;
}
