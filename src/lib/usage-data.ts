export type UsagePeriod = "today" | "week" | "month";

export type UsageCategory = "aiChat" | "attachments" | "voiceInput" | "learning" | "practice" | "revision" | "other";

export const usageCategories: UsageCategory[] = [
  "aiChat",
  "attachments",
  "voiceInput",
  "learning",
  "practice",
  "revision",
  "other",
];

/** Minutes spent per category, per period — mock data only. */
export const usageBreakdown: Record<UsagePeriod, Record<UsageCategory, number>> = {
  today: { aiChat: 15, attachments: 5, voiceInput: 3, learning: 20, practice: 10, revision: 0, other: 5 },
  week: { aiChat: 90, attachments: 25, voiceInput: 15, learning: 140, practice: 70, revision: 50, other: 30 },
  month: { aiChat: 300, attachments: 90, voiceInput: 55, learning: 430, practice: 250, revision: 180, other: 80 },
};

export type UsageActivity = {
  id: string;
  type: UsageCategory;
  subject: { en: string; bn: string };
  topic: { en: string; bn: string };
  when: { en: string; bn: string };
  amount: { en: string; bn: string };
};

export const recentUsageActivity: UsageActivity[] = [
  {
    id: "1",
    type: "revision",
    subject: { en: "Chemistry", bn: "রসায়ন" },
    topic: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
    when: { en: "Today · 4:15 PM", bn: "আজ · বিকাল ৪:১৫" },
    amount: { en: "35 min", bn: "৩৫ মিনিট" },
  },
  {
    id: "2",
    type: "practice",
    subject: { en: "Mathematics", bn: "গণিত" },
    topic: { en: "Quadratic Equations", bn: "দ্বিঘাত সমীকরণ" },
    when: { en: "Today · 1:30 PM", bn: "আজ · দুপুর ১:৩০" },
    amount: { en: "20 min", bn: "২০ মিনিট" },
  },
  {
    id: "3",
    type: "aiChat",
    subject: { en: "Physics", bn: "পদার্থবিজ্ঞান" },
    topic: { en: "Motion", bn: "গতি" },
    when: { en: "Today · 11:05 AM", bn: "আজ · সকাল ১১:০৫" },
    amount: { en: "12 messages", bn: "১২টি বার্তা" },
  },
  {
    id: "4",
    type: "attachments",
    subject: { en: "Chemistry", bn: "রসায়ন" },
    topic: { en: "Lab report.pdf", bn: "ল্যাব রিপোর্ট.pdf" },
    when: { en: "Today · 10:20 AM", bn: "আজ · সকাল ১০:২০" },
    amount: { en: "1 file", bn: "১টি ফাইল" },
  },
  {
    id: "5",
    type: "voiceInput",
    subject: { en: "Mathematics", bn: "গণিত" },
    topic: { en: "Simultaneous Equations", bn: "একযোগে সমীকরণ" },
    when: { en: "Yesterday · 8:10 PM", bn: "গতকাল · রাত ৮:১০" },
    amount: { en: "2 min", bn: "২ মিনিট" },
  },
  {
    id: "6",
    type: "practice",
    subject: { en: "English 1st Paper", bn: "ইংরেজি ১ম পত্র" },
    topic: { en: "Unit 2: Story and Fable", bn: "ইউনিট ২: Story and Fable" },
    when: { en: "Yesterday · 7:05 PM", bn: "গতকাল · সন্ধ্যা ৭:০৫" },
    amount: { en: "15 min", bn: "১৫ মিনিট" },
  },
  {
    id: "7",
    type: "revision",
    subject: { en: "Bangla 1st Paper", bn: "বাংলা ১ম পত্র" },
    topic: { en: "Aparichita", bn: "অপরিচিতা" },
    when: { en: "Yesterday · 5:40 PM", bn: "গতকাল · বিকাল ৫:৪০" },
    amount: { en: "25 min", bn: "২৫ মিনিট" },
  },
  {
    id: "8",
    type: "other",
    subject: { en: "Chemistry", bn: "রসায়ন" },
    topic: { en: "Periodic Table", bn: "পর্যায় সারণি" },
    when: { en: "2 days ago", bn: "২ দিন আগে" },
    amount: { en: "8 min", bn: "৮ মিনিট" },
  },
];

export const usageLimits = {
  aiRequests: { current: 0, limit: 50 },
  dailyStudySessions: { current: 2, limit: 5 },
  practiceSessions: { current: 6, limit: 15 },
};

export const usageSummary = {
  aiText: { used: 0, limit: 50 },
  attachments: { used: 3, limit: 10 },
  voiceInput: { used: 4, limit: 20 },
  studyMinutes: { total: 2415, week: 380, month: 1240 },
  aiSessions: { total: 64, week: 9, month: 27 },
  messages: { total: 412, week: 58, month: 176 },
};
