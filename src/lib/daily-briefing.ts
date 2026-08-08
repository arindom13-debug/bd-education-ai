import type { Lang } from "@/lib/i18n";
import {
  getSubjectTotalChapters,
  getSubjectChaptersCompleted,
  type Subject,
  type ChapterStatus,
} from "@/lib/curriculum-data";

// Placeholder until real session-tracking exists — swap for a real query later.
export const placeholderYesterdayMinutes = 42;

export function getGreeting(lang: Lang, name: string): string {
  const hour = new Date().getHours();
  const namePart = name ? (lang === "en" ? `, ${name}` : ` ${name}`) : "";
  if (hour < 12) return lang === "en" ? `Good morning${namePart}.` : `শুভ সকাল${namePart}।`;
  if (hour < 17) return lang === "en" ? `Good afternoon${namePart}.` : `শুভ বিকেল${namePart}।`;
  if (hour < 21) return lang === "en" ? `Good evening${namePart}.` : `শুভ সন্ধ্যা${namePart}।`;
  return lang === "en" ? `Welcome back${namePart}.` : `আবার স্বাগতম${namePart}।`;
}

export function getRecommendationSentence(lang: Lang, chapterName: string, status: ChapterStatus): string {
  const isInProgress = status === "in-progress";
  if (lang === "en") return `${isInProgress ? "Finish" : "Start"} ${chapterName}.`;
  return `${chapterName} ${isInProgress ? "শেষ করো" : "শুরু করো"}।`;
}

/** One specific, human-feeling observation — the thing that makes the briefing feel personal. */
export function getProgressObservation(
  lang: Lang,
  subjects: Subject[],
  weakSubjectIds: string[]
): string {
  const almostDone = subjects.find((s) => {
    const total = getSubjectTotalChapters(s);
    const completed = getSubjectChaptersCompleted(s);
    return total - completed === 1;
  });
  if (almostDone) {
    return lang === "en"
      ? `You're only one chapter away from finishing ${almostDone.name.en}.`
      : `${almostDone.name.bn} শেষ করতে তোমার মাত্র একটি অধ্যায় বাকি।`;
  }

  const weakSubject = subjects.find((s) => weakSubjectIds.includes(s.id));
  if (weakSubject) {
    return lang === "en"
      ? `${weakSubject.name.en} could use a bit more attention this week.`
      : `এই সপ্তাহে ${weakSubject.name.bn}-এর দিকে আরেকটু মনোযোগ দরকার।`;
  }

  return lang === "en"
    ? "You're making steady progress across your subjects."
    : "তুমি সব বিষয়ে স্থিরভাবে এগিয়ে যাচ্ছ।";
}
