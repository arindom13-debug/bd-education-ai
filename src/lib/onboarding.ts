export type Localized = { en: string; bn: string };

export type OnboardingAnswerValue = string | string[];
export type OnboardingAnswers = Record<string, OnboardingAnswerValue>;

export type OnboardingProgress = {
  step: number;
  answers: OnboardingAnswers;
  completed: boolean;
  /** Whether the one-time "basics" prelude (name/class/curriculum/study
   * language/study time) has been passed. Tracked separately from the 10
   * deep questions so their own "X / 10" progress count never includes it. */
  basicsCompleted: boolean;
};

export const defaultOnboardingProgress: OnboardingProgress = {
  step: 0,
  answers: {},
  completed: false,
  basicsCompleted: false,
};

// Local-only persistence for now — the OnboardingProgress shape is what a
// future per-student backend profile record should store, so swapping this
// for API calls later should not require UI changes.
const STORAGE_KEY = "arindoms-ai-onboarding-v3";

export function loadOnboardingProgress(): OnboardingProgress {
  if (typeof window === "undefined") return defaultOnboardingProgress;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultOnboardingProgress;
    const parsed = JSON.parse(raw) as Partial<OnboardingProgress>;
    const step = typeof parsed.step === "number" && parsed.step >= 0 ? Math.min(parsed.step, TOTAL_QUESTIONS) : 0;
    return {
      step,
      answers:
        parsed.answers && typeof parsed.answers === "object" && !Array.isArray(parsed.answers)
          ? (parsed.answers as OnboardingAnswers)
          : {},
      completed: parsed.completed === true,
      basicsCompleted: parsed.basicsCompleted === true,
    };
  } catch {
    return defaultOnboardingProgress;
  }
}

export function saveOnboardingProgress(progress: OnboardingProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable — progress just won't survive reloads
  }
}

export type OnboardingOption = { value: string; label: Localized; description?: Localized };

export type DeepQuestion = {
  id: string;
  section: "context" | "challenges" | "preferences" | "habits" | "goals" | "teaching";
  title: Localized;
  subtitle?: Localized;
  /**
   * single: one card, auto-advances.
   * multi: several cards, explicit Continue.
   * subjects-single / subjects-multi: reuses the student's real StudyPlan subject lists.
   * scale: an ordered level picker (rendered as a slider/segmented control).
   */
  type: "single" | "multi" | "subjects-single" | "subjects-multi" | "scale";
  options?: OnboardingOption[];
  /** Which StudyPlan list a "subjects-*" question reads and writes. */
  planList?: "weakSubjects" | "strongSubjects";
};

/** Exactly ten questions — the answers become a live personalization layer,
 * not a form to fill out. Every field here is read elsewhere in the app. */
export const onboardingQuestions: DeepQuestion[] = [
  {
    id: "examTarget",
    section: "context",
    type: "single",
    title: { en: "What are you preparing for right now?", bn: "তুমি এখন কীসের জন্য প্রস্তুতি নিচ্ছ?" },
    options: [
      { value: "ssc", label: { en: "SSC Examination", bn: "এসএসসি পরীক্ষা" } },
      { value: "half-yearly", label: { en: "Half-Yearly Examination", bn: "অর্ধবার্ষিক পরীক্ষা" } },
      { value: "test", label: { en: "Class Test", bn: "ক্লাস টেস্ট" } },
      { value: "general", label: { en: "General Study", bn: "সাধারণ পড়াশোনা" } },
      { value: "other", label: { en: "Other", bn: "অন্য কিছু" } },
    ],
  },
  {
    id: "hardestSubject",
    section: "challenges",
    type: "subjects-single",
    planList: "weakSubjects",
    title: { en: "Which subject feels hardest for you right now?", bn: "এখন কোন বিষয়টা তোমার কাছে সবচেয়ে কঠিন লাগে?" },
    subtitle: { en: "Pick the one that's giving you the most trouble.", bn: "যেটা তোমাকে সবচেয়ে বেশি ভোগাচ্ছে সেটাই বেছে নাও।" },
  },
  {
    id: "strongestSubject",
    section: "challenges",
    type: "subjects-multi",
    planList: "strongSubjects",
    title: { en: "Which subject do you feel most confident in?", bn: "কোন বিষয়ে তুমি সবচেয়ে আত্মবিশ্বাসী?" },
    subtitle: { en: "Select one or as many as apply.", bn: "একটি বা একাধিক বেছে নিতে পারো।" },
  },
  {
    id: "understandingProblems",
    section: "challenges",
    type: "multi",
    title: {
      en: "When you get stuck on a topic, what usually causes the problem?",
      bn: "কোনো টপিকে আটকে গেলে সাধারণত সমস্যাটা কোথায় হয়?",
    },
    subtitle: { en: "Select everything that sounds like you.", bn: "যেগুলো তোমার সাথে মেলে সেগুলো বেছে নাও।" },
    options: [
      { value: "concept", label: { en: "Conceptual understanding", bn: "ধারণাগত বোঝাপড়া" } },
      { value: "formulas", label: { en: "Remembering formulas", bn: "সূত্র মনে রাখা" } },
      { value: "apply", label: { en: "Applying concepts to problems", bn: "সমস্যায় ধারণা প্রয়োগ করা" } },
      { value: "careless", label: { en: "Careless mistakes", bn: "অসাবধানতায় ভুল" } },
      { value: "language", label: { en: "Understanding the language used", bn: "ব্যবহৃত ভাষা বুঝতে সমস্যা" } },
      { value: "speed", label: { en: "Running out of time", bn: "সময়ের অভাব" } },
      { value: "start", label: { en: "Not knowing where to start", bn: "কোথা থেকে শুরু করব বুঝি না" } },
    ],
  },
  {
    id: "learningStyle",
    section: "preferences",
    type: "multi",
    title: { en: "What helps you understand something fastest?", bn: "কী তোমাকে সবচেয়ে দ্রুত বুঝতে সাহায্য করে?" },
    subtitle: { en: "Select everything that sounds like you.", bn: "যেগুলো তোমার সাথে মেলে সেগুলো বেছে নাও।" },
    options: [
      { value: "simple", label: { en: "Simple explanation", bn: "সহজ ব্যাখ্যা" } },
      { value: "deep", label: { en: "Deep explanation", bn: "গভীর ব্যাখ্যা" } },
      { value: "examples", label: { en: "Examples", bn: "উদাহরণ" } },
      { value: "visual", label: { en: "Visual explanation", bn: "চিত্রে ব্যাখ্যা" } },
      { value: "step-by-step", label: { en: "Step-by-step solving", bn: "ধাপে ধাপে সমাধান" } },
      { value: "practice", label: { en: "Practice questions", bn: "অনুশীলন প্রশ্ন" } },
      { value: "real-life", label: { en: "Real-life connections", bn: "বাস্তব জীবনের সাথে যোগসূত্র" } },
    ],
  },
  {
    id: "explanationDepth",
    section: "teaching",
    type: "scale",
    title: {
      en: "How detailed should my explanations be?",
      bn: "আমার ব্যাখ্যা কতটা বিস্তারিত হওয়া উচিত?",
    },
    options: [
      {
        value: "quick",
        label: { en: "Quick", bn: "দ্রুত" },
        description: { en: "Short, to the point — just the answer.", bn: "সংক্ষিপ্ত, সরাসরি — শুধু উত্তর।" },
      },
      {
        value: "balanced",
        label: { en: "Balanced", bn: "মাঝামাঝি" },
        description: { en: "The answer plus a short reason why.", bn: "উত্তরের সাথে সংক্ষিপ্ত কারণও।" },
      },
      {
        value: "detailed",
        label: { en: "Detailed", bn: "বিস্তারিত" },
        description: { en: "Full working, step by step.", bn: "সম্পূর্ণ ধাপে ধাপে সমাধান।" },
      },
      {
        value: "deep-dive",
        label: { en: "Deep Dive", bn: "গভীর বিশ্লেষণ" },
        description: { en: "Everything — theory, method, and context.", bn: "সবকিছু — তত্ত্ব, পদ্ধতি ও প্রেক্ষাপট।" },
      },
    ],
  },
  {
    id: "consistencyBlockers",
    section: "habits",
    type: "multi",
    title: {
      en: "What usually gets in the way of studying consistently?",
      bn: "নিয়মিত পড়ার পথে সাধারণত কী বাধা হয়ে দাঁড়ায়?",
    },
    subtitle: { en: "Select everything that sounds like you.", bn: "যেগুলো তোমার সাথে মেলে সেগুলো বেছে নাও।" },
    options: [
      { value: "procrastination", label: { en: "Procrastination", bn: "কাজ ফেলে রাখা" } },
      { value: "distractions", label: { en: "Phone / social media", bn: "ফোন / সোশ্যাল মিডিয়া" } },
      { value: "no-plan", label: { en: "Not knowing what to study", bn: "কী পড়ব তা না জানা" } },
      { value: "overwhelmed", label: { en: "Feeling overwhelmed", bn: "চাপে হাঁপিয়ে যাওয়া" } },
      { value: "tired", label: { en: "Low energy / tiredness", bn: "ক্লান্তি / শক্তির অভাব" } },
      { value: "no-routine", label: { en: "No fixed routine", bn: "নির্দিষ্ট রুটিন নেই" } },
      { value: "none", label: { en: "Nothing — I study consistently", bn: "কিছুই না — আমি নিয়মিত পড়ি" } },
    ],
  },
  {
    id: "academicGoal",
    section: "goals",
    type: "single",
    title: { en: "What is your biggest academic goal right now?", bn: "এখন তোমার সবচেয়ে বড় একাডেমিক লক্ষ্য কী?" },
    options: [
      { value: "exam-result", label: { en: "Achieve a specific exam result", bn: "নির্দিষ্ট পরীক্ষার ফলাফল অর্জন করা" } },
      { value: "weak-subjects", label: { en: "Improve my weak subjects", bn: "দুর্বল বিষয়গুলোতে উন্নতি করা" } },
      { value: "syllabus", label: { en: "Finish the syllabus on time", bn: "সময়মতো সিলেবাস শেষ করা" } },
      { value: "problem-solving", label: { en: "Improve problem-solving", bn: "সমস্যা সমাধানে উন্নতি করা" } },
      { value: "fundamentals", label: { en: "Build strong fundamentals", bn: "মজবুত ভিত্তি তৈরি করা" } },
      { value: "confidence", label: { en: "Feel more confident overall", bn: "সার্বিকভাবে আত্মবিশ্বাসী হওয়া" } },
    ],
  },
  {
    id: "mistakeResponse",
    section: "teaching",
    type: "single",
    title: { en: "When you make a mistake, how should I respond?", bn: "তুমি ভুল করলে আমি কীভাবে সাড়া দেব?" },
    options: [
      {
        value: "guide",
        label: { en: "Guide me", bn: "পথ দেখাও" },
        description: { en: "Give me hints first.", bn: "আগে আমাকে ইঙ্গিত দাও।" },
      },
      {
        value: "explain",
        label: { en: "Explain it", bn: "ব্যাখ্যা করো" },
        description: { en: "Show me exactly where I went wrong.", bn: "ঠিক কোথায় ভুল করেছি তা দেখাও।" },
      },
      {
        value: "challenge",
        label: { en: "Challenge me", bn: "চ্যালেঞ্জ করো" },
        description: { en: "Make me solve it again.", bn: "আবার সমাধান করতে বাধ্য করো।" },
      },
    ],
  },
  {
    id: "challengeLevel",
    section: "teaching",
    type: "scale",
    title: { en: "How should I challenge you?", bn: "আমি তোমাকে কীভাবে চ্যালেঞ্জ করব?" },
    options: [
      {
        value: "supportive",
        label: { en: "Supportive", bn: "সহায়ক" },
        description: { en: "Keep things easy until I'm ready.", bn: "আমি প্রস্তুত না হওয়া পর্যন্ত সহজ রাখো।" },
      },
      {
        value: "balanced",
        label: { en: "Balanced", bn: "ভারসাম্যপূর্ণ" },
        description: { en: "Gradually increase difficulty as I improve.", bn: "উন্নতির সাথে সাথে ধীরে ধীরে কঠিন করো।" },
      },
      {
        value: "aggressive",
        label: { en: "Aggressive", bn: "কঠিন" },
        description: { en: "Push me hard, right from the start.", bn: "শুরু থেকেই আমাকে কঠিনভাবে চ্যালেঞ্জ করো।" },
      },
    ],
  },
];

export const TOTAL_QUESTIONS = onboardingQuestions.length;

export function getQuestion(id: string): DeepQuestion | undefined {
  return onboardingQuestions.find((q) => q.id === id);
}

export function getQuestionIndex(id: string): number {
  return onboardingQuestions.findIndex((q) => q.id === id);
}

/** Human-readable answer for a plain (non-subjects) question, or "" if unanswered. */
export function formatAnswer(q: DeepQuestion, answers: OnboardingAnswers, lang: "en" | "bn"): string {
  const value = answers[q.id];
  if (q.type === "multi") {
    if (!Array.isArray(value) || value.length === 0) return "";
    return value
      .map((v) => q.options?.find((o) => o.value === v)?.label[lang])
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof value !== "string" || !value) return "";
  return q.options?.find((o) => o.value === value)?.label[lang] ?? "";
}
