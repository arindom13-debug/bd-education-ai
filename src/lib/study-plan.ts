export type CurriculumTrack = "bangla" | "english";
export type ClassLevel = "9" | "10";
export type ExamTarget = "ssc" | "half-yearly" | "test" | "other";
export type StudyLevel = "beginner" | "intermediate" | "advanced";

export type StudyPlan = {
  name: string;
  classLevel: ClassLevel;
  curriculumTrack: CurriculumTrack;
  examTarget: ExamTarget | "";
  goal: string;
  strongSubjects: string[];
  weakSubjects: string[];
  studyLevel: StudyLevel | "";
  dailyMinutes: number;
  examDate: string;
};

export const defaultStudyPlan: StudyPlan = {
  name: "",
  classLevel: "9",
  curriculumTrack: "bangla",
  examTarget: "",
  goal: "",
  strongSubjects: [],
  weakSubjects: [],
  studyLevel: "",
  dailyMinutes: 60,
  examDate: "",
};

export const classLevelOptions: { value: ClassLevel; label: { en: string; bn: string } }[] = [
  { value: "9", label: { en: "Class 9", bn: "নবম শ্রেণি" } },
  { value: "10", label: { en: "Class 10", bn: "দশম শ্রেণি" } },
];

export const curriculumTrackOptions: { value: CurriculumTrack; label: { en: string; bn: string } }[] = [
  { value: "bangla", label: { en: "Bangla version", bn: "বাংলা ভার্সন" } },
  { value: "english", label: { en: "English version", bn: "ইংরেজি ভার্সন" } },
];

export const examTargetOptions: { value: ExamTarget; label: { en: string; bn: string } }[] = [
  { value: "ssc", label: { en: "SSC Examination", bn: "এসএসসি পরীক্ষা" } },
  { value: "half-yearly", label: { en: "Half-Yearly Exam", bn: "অর্ধবার্ষিক পরীক্ষা" } },
  { value: "test", label: { en: "Class Test", bn: "ক্লাস টেস্ট" } },
  { value: "other", label: { en: "Something Else", bn: "অন্য কিছু" } },
];

export const studyLevelOptions: { value: StudyLevel; label: { en: string; bn: string } }[] = [
  { value: "beginner", label: { en: "Just getting started", bn: "সবেমাত্র শুরু করছি" } },
  { value: "intermediate", label: { en: "Comfortable with basics", bn: "বেসিকে স্বাচ্ছন্দ্য বোধ করি" } },
  { value: "advanced", label: { en: "Confident, refining details", bn: "আত্মবিশ্বাসী, খুঁটিনাটি ঠিক করছি" } },
];

export const dailyMinutesOptions: { value: number; label: { en: string; bn: string } }[] = [
  { value: 30, label: { en: "30 min", bn: "৩০ মিনিট" } },
  { value: 60, label: { en: "1 hour", bn: "১ ঘণ্টা" } },
  { value: 90, label: { en: "1.5 hours", bn: "দেড় ঘণ্টা" } },
  { value: 120, label: { en: "2 hours", bn: "২ ঘণ্টা" } },
  { value: 180, label: { en: "3+ hours", bn: "৩+ ঘণ্টা" } },
];

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
