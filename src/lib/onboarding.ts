export type Localized = { en: string; bn: string };

export type OnboardingAnswerValue = string | string[];
export type OnboardingAnswers = Record<string, OnboardingAnswerValue>;

export type OnboardingProgress = {
  step: number;
  answers: OnboardingAnswers;
  completed: boolean;
};

export const defaultOnboardingProgress: OnboardingProgress = {
  step: 0,
  answers: {},
  completed: false,
};

// Local-only persistence for now — the OnboardingProgress shape is what a
// future per-student backend profile record should store, so swapping this
// for API calls later should not require UI changes.
const STORAGE_KEY = "arindoms-ai-onboarding-v2";

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

export type OnboardingOption = { value: string; label: Localized };

export type DeepQuestion = {
  id: string;
  /** Small context label above the question. */
  stage: Localized;
  title: Localized;
  why?: Localized;
  /** "subjects" reuses the student's existing StudyPlan subject lists. */
  type: "single" | "text" | "subjects";
  options?: OnboardingOption[];
  /** Which StudyPlan list a "subjects" question reads and writes. */
  planList?: "weakSubjects" | "strongSubjects";
  /** Free-text companion stored alongside the main answer. */
  extra?: { id: string; label: Localized; placeholder: Localized };
  optional?: boolean;
  placeholder?: Localized;
};

const stages = {
  situation: { en: "Your academic situation", bn: "তোমার একাডেমিক অবস্থা" },
  learning: { en: "How you learn", bn: "তুমি কীভাবে শেখো" },
  habits: { en: "Study habits", bn: "পড়ার অভ্যাস" },
  goals: { en: "Your goals", bn: "তোমার লক্ষ্য" },
  teaching: { en: "How I should teach you", bn: "আমি কীভাবে পড়াব" },
  reflection: { en: "One last thing", bn: "শেষ একটি কথা" },
} as const;

export const OTHER_VALUE = "other";
export function otherKey(questionId: string): string {
  return `${questionId}__other`;
}

const otherOption: OnboardingOption = { value: OTHER_VALUE, label: { en: "Other", bn: "অন্য কিছু" } };

/** Exactly ten questions — deliberately scoped, no filler. */
export const onboardingQuestions: DeepQuestion[] = [
  {
    id: "struggling",
    stage: stages.situation,
    type: "subjects",
    planList: "weakSubjects",
    title: {
      en: "What are you struggling with the most right now?",
      bn: "এখন তুমি কোন জায়গায় সবচেয়ে বেশি সমস্যায় পড়ছ?",
    },
    why: {
      en: "Pick any subjects, and name specific chapters or topics if you can.",
      bn: "যেকোনো বিষয় বেছে নাও, পারলে নির্দিষ্ট অধ্যায় বা টপিকের নামও লেখো।",
    },
    extra: {
      id: "strugglingTopics",
      label: { en: "Specific topics", bn: "নির্দিষ্ট টপিক" },
      placeholder: {
        en: "e.g. Trigonometry, Newton's laws, balancing equations",
        bn: "যেমন: ত্রিকোণমিতি, নিউটনের সূত্র, সমীকরণ সমতাকরণ",
      },
    },
  },
  {
    id: "confident",
    stage: stages.situation,
    type: "subjects",
    planList: "strongSubjects",
    optional: true,
    title: {
      en: "Which subjects do you feel most confident in, and why?",
      bn: "কোন বিষয়গুলোতে তুমি সবচেয়ে আত্মবিশ্বাসী, এবং কেন?",
    },
    why: {
      en: "Knowing what already works for you helps me repeat it elsewhere.",
      bn: "যা তোমার জন্য কাজ করছে তা জানলে আমি অন্য বিষয়েও সেটা কাজে লাগাতে পারব।",
    },
    extra: {
      id: "confidentReason",
      label: { en: "What makes those easier for you?", bn: "ওগুলো তোমার জন্য সহজ কেন?" },
      placeholder: {
        en: "e.g. the teacher explains well, I practise it more, it feels logical",
        bn: "যেমন: শিক্ষক ভালো বোঝান, বেশি অনুশীলন করি, যুক্তিসঙ্গত মনে হয়",
      },
    },
  },
  {
    id: "difficultyCause",
    stage: stages.learning,
    type: "single",
    title: {
      en: "When you don't understand a topic, what usually causes the problem?",
      bn: "কোনো টপিক না বুঝলে সাধারণত সমস্যাটা কোথায় হয়?",
    },
    options: [
      { value: "concept", label: { en: "The concept is confusing", bn: "ধারণাটাই গোলমেলে লাগে" } },
      { value: "forget", label: { en: "I forget what I learned", bn: "যা শিখি ভুলে যাই" } },
      { value: "formulas", label: { en: "I struggle with formulas", bn: "সূত্র নিয়ে সমস্যা হয়" } },
      { value: "apply", label: { en: "I struggle to apply concepts", bn: "ধারণা প্রয়োগ করতে পারি না" } },
      { value: "careless", label: { en: "I make careless mistakes", bn: "অসাবধানতায় ভুল করি" } },
      { value: "start", label: { en: "I don't know where to start", bn: "কোথা থেকে শুরু করব বুঝি না" } },
      otherOption,
    ],
  },
  {
    id: "learningStyle",
    stage: stages.learning,
    type: "single",
    title: { en: "How do you learn best?", bn: "তুমি কীভাবে সবচেয়ে ভালো শেখো?" },
    options: [
      { value: "visual", label: { en: "Visual explanations", bn: "ছবি বা চিত্রে ব্যাখ্যা" } },
      { value: "step-by-step", label: { en: "Step-by-step explanations", bn: "ধাপে ধাপে ব্যাখ্যা" } },
      { value: "examples-first", label: { en: "Examples first", bn: "আগে উদাহরণ" } },
      { value: "practice", label: { en: "Practice questions", bn: "অনুশীলন প্রশ্ন" } },
      { value: "summaries", label: { en: "Short summaries", bn: "সংক্ষিপ্ত সারাংশ" } },
      { value: "deep", label: { en: "Deep explanations", bn: "গভীর ব্যাখ্যা" } },
      { value: "combination", label: { en: "A combination", bn: "মিশ্রভাবে" } },
    ],
  },
  {
    id: "detailLevel",
    stage: stages.learning,
    type: "single",
    title: {
      en: "When I explain something, how detailed should it be?",
      bn: "আমি কিছু ব্যাখ্যা করলে তা কতটা বিস্তারিত হওয়া উচিত?",
    },
    options: [
      { value: "quick", label: { en: "Quick & simple", bn: "দ্রুত ও সহজ" } },
      { value: "balanced", label: { en: "Balanced", bn: "মাঝামাঝি" } },
      { value: "detailed", label: { en: "Detailed", bn: "বিস্তারিত" } },
      { value: "textbook", label: { en: "Deep / textbook-level", bn: "গভীর / পাঠ্যবই-স্তরের" } },
    ],
  },
  {
    id: "consistencyBlocker",
    stage: stages.habits,
    type: "single",
    title: {
      en: "What usually stops you from studying consistently?",
      bn: "নিয়মিত পড়া থেকে সাধারণত কী তোমাকে আটকায়?",
    },
    why: {
      en: "An honest answer is more useful here than a perfect one.",
      bn: "এখানে নিখুঁত উত্তরের চেয়ে সৎ উত্তরই বেশি কাজের।",
    },
    options: [
      { value: "motivation", label: { en: "Lack of motivation", bn: "আগ্রহের অভাব" } },
      { value: "concentration", label: { en: "Difficulty concentrating", bn: "মন বসাতে অসুবিধা" } },
      { value: "phone", label: { en: "Phone / social media", bn: "ফোন / সোশ্যাল মিডিয়া" } },
      { value: "what-to-study", label: { en: "Not knowing what to study", bn: "কী পড়ব তা না জানা" } },
      { value: "overwhelmed", label: { en: "Feeling overwhelmed", bn: "চাপে হাঁপিয়ে যাওয়া" } },
      { value: "time", label: { en: "Poor time management", bn: "সময় ব্যবস্থাপনার দুর্বলতা" } },
      otherOption,
    ],
  },
  {
    id: "academicGoal",
    stage: stages.goals,
    type: "single",
    title: {
      en: "What is your biggest academic goal right now?",
      bn: "এখন তোমার সবচেয়ে বড় একাডেমিক লক্ষ্য কী?",
    },
    options: [
      { value: "exam-result", label: { en: "A specific exam result", bn: "নির্দিষ্ট পরীক্ষার ফলাফল" } },
      { value: "weak-subjects", label: { en: "Mastering weak subjects", bn: "দুর্বল বিষয়গুলো আয়ত্ত করা" } },
      { value: "syllabus", label: { en: "Completing the syllabus", bn: "সিলেবাস শেষ করা" } },
      { value: "problem-solving", label: { en: "Improving problem-solving", bn: "সমস্যা সমাধানে উন্নতি" } },
      { value: "fundamentals", label: { en: "Building strong fundamentals", bn: "মজবুত ভিত্তি তৈরি করা" } },
      otherOption,
    ],
  },
  {
    id: "mistakeResponse",
    stage: stages.teaching,
    type: "single",
    title: {
      en: "When you make a mistake, how should I respond?",
      bn: "তুমি ভুল করলে আমি কীভাবে সাড়া দেব?",
    },
    options: [
      { value: "point-out", label: { en: "Directly point out the mistake", bn: "সরাসরি ভুলটা ধরিয়ে দাও" } },
      { value: "explain-why", label: { en: "Explain why it is wrong", bn: "কেন ভুল তা ব্যাখ্যা করো" } },
      { value: "hints", label: { en: "Guide me with hints first", bn: "আগে ইঙ্গিত দিয়ে পথ দেখাও" } },
      { value: "retry", label: { en: "Make me try again before showing the answer", bn: "উত্তর দেখানোর আগে আবার চেষ্টা করাও" } },
    ],
  },
  {
    id: "challengeStyle",
    stage: stages.teaching,
    type: "single",
    title: { en: "How should I challenge you?", bn: "আমি তোমাকে কীভাবে চ্যালেঞ্জ করব?" },
    options: [
      { value: "easy-until-ready", label: { en: "Keep things easy until I understand", bn: "না বোঝা পর্যন্ত সহজ রাখো" } },
      { value: "gradual", label: { en: "Gradually increase difficulty", bn: "ধীরে ধীরে কঠিন করো" } },
      { value: "aggressive", label: { en: "Challenge me aggressively", bn: "কঠিনভাবে চ্যালেঞ্জ করো" } },
      { value: "adaptive", label: { en: "Adapt automatically based on my performance", bn: "আমার ফলাফল বুঝে নিজেই বদলে নাও" } },
    ],
  },
  {
    id: "improveOneThing",
    stage: stages.reflection,
    type: "text",
    optional: true,
    title: {
      en: "If I could help you improve ONE thing about your studying, what would you choose?",
      bn: "তোমার পড়াশোনার একটিমাত্র দিক আমি উন্নত করতে পারলে, তুমি কোনটা বেছে নিতে?",
    },
    why: {
      en: "Say it in your own words — this is the one I'll keep coming back to.",
      bn: "নিজের ভাষায় লেখো — এটাই আমি বারবার মনে রাখব।",
    },
    placeholder: {
      en: "e.g. I want to stop panicking when I see an unfamiliar question",
      bn: "যেমন: অপরিচিত প্রশ্ন দেখলে ঘাবড়ে যাওয়া বন্ধ করতে চাই",
    },
  },
];

export const TOTAL_QUESTIONS = onboardingQuestions.length;

export function getQuestion(id: string): DeepQuestion | undefined {
  return onboardingQuestions.find((q) => q.id === id);
}

/** Human-readable answer for a question, or "" if unanswered. "subjects"
 * questions resolve from the StudyPlan, so the caller supplies those. */
export function formatAnswer(q: DeepQuestion, answers: OnboardingAnswers, lang: "en" | "bn"): string {
  if (q.type === "subjects") return "";
  const value = answers[q.id];
  if (q.type === "text") return typeof value === "string" ? value.trim() : "";
  if (typeof value !== "string" || !value) return "";
  if (value === OTHER_VALUE) {
    const other = answers[otherKey(q.id)];
    return typeof other === "string" ? other.trim() : "";
  }
  return q.options?.find((o) => o.value === value)?.label[lang] ?? "";
}

export function getExtraText(id: string, answers: OnboardingAnswers): string {
  const value = answers[id];
  return typeof value === "string" ? value.trim() : "";
}
