import { strings, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";

export type AiRecommendation = {
  message: string;
  actionLabel: string;
};

const NEGLECTED_THRESHOLD_DAYS = 3;
const REVISION_MINUTES = 20;

/**
 * Picks the single most relevant observation for the student right now.
 * Priority: a neglected subject > a chapter worth revisiting > positive
 * reinforcement > a generic nudge. Placeholder heuristics — swap the
 * internals for a real model/analytics call later without touching callers.
 */
export function getAiRecommendation(lang: Lang, subjects: Subject[], streakDays: number): AiRecommendation {
  const neglected = subjects
    .filter((s) => s.lastStudiedDaysAgo >= NEGLECTED_THRESHOLD_DAYS)
    .sort((a, b) => b.lastStudiedDaysAgo - a.lastStudiedDaysAgo)[0];
  if (neglected) {
    return {
      message:
        lang === "en"
          ? `I noticed ${neglected.name.en} has been untouched for ${neglected.lastStudiedDaysAgo} days. A ${REVISION_MINUTES}-minute revision session would be a good next step.`
          : `আমি লক্ষ্য করেছি ${neglected.name.bn} ${neglected.lastStudiedDaysAgo} দিন ধরে ছোঁয়া হয়নি। ${REVISION_MINUTES} মিনিটের একটি রিভিশন সেশন ভালো পরবর্তী পদক্ষেপ হবে।`,
      actionLabel: strings.startRevisionBtn[lang],
    };
  }

  const midProgress = subjects
    .flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })))
    .find(
      (entry) => entry.chapter.status === "in-progress" && entry.chapter.progress >= 40 && entry.chapter.progress < 80
    );
  if (midProgress) {
    return {
      message:
        lang === "en"
          ? `${midProgress.chapter.name.en} is ${midProgress.chapter.progress}% done — a quick revisit now will make it easier to finish.`
          : `${midProgress.chapter.name.bn} ${midProgress.chapter.progress}% সম্পন্ন — এখন একবার দেখে নিলে শেষ করা সহজ হবে।`,
      actionLabel: strings.continueLearning[lang],
    };
  }

  if (streakDays >= 3) {
    return {
      message:
        lang === "en"
          ? `Nice work — a ${streakDays}-day streak so far. Keeping today's session short and consistent will carry it forward.`
          : `দারুণ কাজ — এ পর্যন্ত ${streakDays} দিনের স্ট্রিক। আজকের সেশনটি ছোট ও নিয়মিত রাখলে এটি এগিয়ে যাবে।`,
      actionLabel: strings.continueLearning[lang],
    };
  }

  return {
    message:
      lang === "en"
        ? "A short, focused session today is the easiest way to keep moving forward."
        : "আজ একটি সংক্ষিপ্ত, মনোযোগী সেশন এগিয়ে যাওয়ার সবচেয়ে সহজ উপায়।",
    actionLabel: strings.startStudyingBtn[lang],
  };
}
