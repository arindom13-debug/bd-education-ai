export type ChapterStatus = "mastered" | "in-progress" | "not-started";

export type Chapter = {
  id: string;
  name: { en: string; bn: string };
  status: ChapterStatus;
  progress: number;
};

export type Subject = {
  id: string;
  name: { en: string; bn: string };
  progress: number;
  chapters: Chapter[];
};

export const subjects: Subject[] = [
  {
    id: "bangla-1",
    name: { en: "Bangla 1st Paper", bn: "বাংলা ১ম পত্র" },
    progress: 40,
    chapters: [],
  },
  {
    id: "english-1",
    name: { en: "English 1st Paper", bn: "ইংরেজি ১ম পত্র" },
    progress: 25,
    chapters: [],
  },
  {
    id: "mathematics",
    name: { en: "Mathematics", bn: "গণিত" },
    progress: 55,
    chapters: [],
  },
  {
    id: "chemistry",
    name: { en: "Chemistry", bn: "রসায়ন" },
    progress: 48,
    chapters: [
      {
        id: "ch-1",
        name: { en: "Chemistry & Its Branches", bn: "রসায়নের ধারণা" },
        status: "mastered",
        progress: 100,
      },
      {
        id: "ch-2",
        name: { en: "Structure of Matter", bn: "পদার্থের গঠন" },
        status: "mastered",
        progress: 100,
      },
      {
        id: "ch-3",
        name: { en: "Periodic Table", bn: "পর্যায় সারণি" },
        status: "mastered",
        progress: 100,
      },
      {
        id: "ch-4",
        name: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
        status: "in-progress",
        progress: 62,
      },
      {
        id: "ch-5",
        name: { en: "Behaviour of Gases", bn: "গ্যাসের আচরণ" },
        status: "not-started",
        progress: 0,
      },
    ],
  },
  {
    id: "physics",
    name: { en: "Physics", bn: "পদার্থবিজ্ঞান" },
    progress: 30,
    chapters: [],
  },
  {
    id: "biology",
    name: { en: "Biology", bn: "জীববিজ্ঞান" },
    progress: 18,
    chapters: [],
  },
  {
    id: "ict",
    name: { en: "ICT", bn: "তথ্য ও যোগাযোগ প্রযুক্তি" },
    progress: 70,
    chapters: [],
  },
];

export const streakDays = 5;

export const suggestedTopic = {
  subjectId: "chemistry",
  subjectName: { en: "Chemistry", bn: "রসায়ন" },
  chapterName: { en: "Chemical Reactions", bn: "রাসায়নিক বিক্রিয়া" },
  progress: 62,
};
