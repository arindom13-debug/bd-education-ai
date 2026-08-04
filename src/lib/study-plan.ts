export type CurriculumTrack = "bangla" | "english";
export type SubjectGroup = "science" | "humanities" | "business";
export type Weekday = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export type StudyPlan = {
  examName: string;
  examDate: string;
  goal: string;
  curriculumTrack: CurriculumTrack;
  subjectGroup: SubjectGroup;
  dailyMinutes: number;
  studyDays: Weekday[];
};

export const defaultStudyPlan: StudyPlan = {
  examName: "",
  examDate: "",
  goal: "",
  curriculumTrack: "bangla",
  subjectGroup: "science",
  dailyMinutes: 60,
  studyDays: ["sat", "sun", "mon", "tue", "wed"],
};

export const curriculumTrackOptions: { value: CurriculumTrack; label: { en: string; bn: string } }[] = [
  { value: "bangla", label: { en: "Bangla version", bn: "বাংলা ভার্সন" } },
  { value: "english", label: { en: "English version", bn: "ইংরেজি ভার্সন" } },
];

export const subjectGroupOptions: { value: SubjectGroup; label: { en: string; bn: string } }[] = [
  { value: "science", label: { en: "Science", bn: "বিজ্ঞান" } },
  { value: "humanities", label: { en: "Humanities", bn: "মানবিক" } },
  { value: "business", label: { en: "Business Studies", bn: "ব্যবসায় শিক্ষা" } },
];

export const weekdayOptions: { value: Weekday; label: { en: string; bn: string } }[] = [
  { value: "sat", label: { en: "Sat", bn: "শনি" } },
  { value: "sun", label: { en: "Sun", bn: "রবি" } },
  { value: "mon", label: { en: "Mon", bn: "সোম" } },
  { value: "tue", label: { en: "Tue", bn: "মঙ্গল" } },
  { value: "wed", label: { en: "Wed", bn: "বুধ" } },
  { value: "thu", label: { en: "Thu", bn: "বৃহঃ" } },
  { value: "fri", label: { en: "Fri", bn: "শুক্র" } },
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
