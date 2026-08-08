import {
  CalendarCheck2,
  Flame,
  FlaskConical,
  Timer,
  Sunrise,
  MoonStar,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getSubjectProgress, type Subject } from "@/lib/curriculum-data";

export type AchievementContext = {
  subjects: Subject[];
  streakDays: number;
  weeklyMinutesTotal: number;
  studiedToday: boolean;
  hour: number;
};

export type Achievement = {
  id: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  icon: LucideIcon;
  isUnlocked: (ctx: AchievementContext) => boolean;
};

export const achievements: Achievement[] = [
  {
    id: "first-week",
    title: { en: "First Week Completed", bn: "প্রথম সপ্তাহ সম্পন্ন" },
    description: {
      en: "Stayed active through your first 7 days.",
      bn: "প্রথম ৭ দিন সক্রিয় থেকেছ।",
    },
    icon: CalendarCheck2,
    isUnlocked: (ctx) => ctx.streakDays >= 5,
  },
  {
    id: "seven-day-streak",
    title: { en: "7 Day Consistency", bn: "৭ দিনের ধারাবাহিকতা" },
    description: {
      en: "Studied every single day this week.",
      bn: "এই সপ্তাহে প্রতিদিন পড়েছ।",
    },
    icon: Flame,
    isUnlocked: (ctx) => ctx.streakDays >= 7,
  },
  {
    id: "chemistry-master",
    title: { en: "Chemistry Master", bn: "রসায়ন মাস্টার" },
    description: {
      en: "Reached 100% mastery in Chemistry.",
      bn: "রসায়নে ১০০% দক্ষতা অর্জন করেছ।",
    },
    icon: FlaskConical,
    isUnlocked: (ctx) => {
      const chemistry = ctx.subjects.find((s) => s.id === "chemistry");
      return chemistry !== undefined && getSubjectProgress(chemistry) === 100;
    },
  },
  {
    id: "focused-learner",
    title: { en: "Focused Learner", bn: "মনোযোগী শিক্ষার্থী" },
    description: {
      en: "Logged 5+ hours of study this week.",
      bn: "এই সপ্তাহে ৫+ ঘণ্টা পড়েছ।",
    },
    icon: Timer,
    isUnlocked: (ctx) => ctx.weeklyMinutesTotal >= 300,
  },
  {
    id: "early-bird",
    title: { en: "Early Bird", bn: "প্রভাতী পাখি" },
    description: {
      en: "Studied before 9 AM.",
      bn: "সকাল ৯টার আগে পড়েছ।",
    },
    icon: Sunrise,
    isUnlocked: (ctx) => ctx.studiedToday && ctx.hour < 9,
  },
  {
    id: "night-learner",
    title: { en: "Night Learner", bn: "রাত্রিকালীন শিক্ষার্থী" },
    description: {
      en: "Studied after 9 PM.",
      bn: "রাত ৯টার পরে পড়েছ।",
    },
    icon: MoonStar,
    isUnlocked: (ctx) => ctx.studiedToday && ctx.hour >= 21,
  },
  {
    id: "perfect-revision",
    title: { en: "Perfect Revision", bn: "নিখুঁত পুনরালোচনা" },
    description: {
      en: "Every subject shows progress — nothing left untouched.",
      bn: "প্রতিটি বিষয়ে অগ্রগতি আছে — কিছুই বাদ যায়নি।",
    },
    icon: ShieldCheck,
    isUnlocked: (ctx) => ctx.subjects.length > 0 && ctx.subjects.every((s) => getSubjectProgress(s) > 0),
  },
];
