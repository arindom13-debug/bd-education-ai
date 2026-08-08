export type ToolId = "timer" | "notebook" | "mistakeBook" | "library" | "roadmap";

export const notebookEntries = [
  {
    title: { en: "Chemical reactions — key points", bn: "রাসায়নিক বিক্রিয়া — মূল বিষয়" },
    snippet: {
      en: "Exothermic releases heat, endothermic absorbs it. Watch for state changes in equations.",
      bn: "তাপোৎপাদী তাপ ছাড়ে, তাপগ্রাহী তাপ শোষণ করে। সমীকরণে অবস্থার পরিবর্তন লক্ষ্য করো।",
    },
    subject: { en: "Chemistry", bn: "রসায়ন" },
    date: { en: "2 days ago", bn: "২ দিন আগে" },
  },
  {
    title: { en: "Quadratic formula tricks", bn: "দ্বিঘাত সূত্রের কৌশল" },
    snippet: {
      en: "Always check the discriminant first — saves time on real vs. complex roots.",
      bn: "প্রথমে ডিসক্রিমিন্যান্ট দেখো — বাস্তব বনাম জটিল মূল বাঁচায় সময়।",
    },
    subject: { en: "Mathematics", bn: "গণিত" },
    date: { en: "4 days ago", bn: "৪ দিন আগে" },
  },
  {
    title: { en: "Newton's laws — quick recap", bn: "নিউটনের সূত্র — দ্রুত পুনরালোচনা" },
    snippet: {
      en: "3rd law pairs act on different objects — that's the part board questions test most.",
      bn: "৩য় সূত্রের জোড়া ভিন্ন বস্তুর উপর কাজ করে — বোর্ড প্রশ্নে এটাই বেশি আসে।",
    },
    subject: { en: "Physics", bn: "পদার্থবিজ্ঞান" },
    date: { en: "1 week ago", bn: "১ সপ্তাহ আগে" },
  },
];

export const aiNotebookEntries = [
  {
    title: { en: "Auto-summary: Chemical Reactions", bn: "স্বয়ংক্রিয় সারাংশ: রাসায়নিক বিক্রিয়া" },
    points: {
      en: ["Reactions either release or absorb energy", "Balancing equations conserves mass", "Catalysts speed up without being consumed"],
      bn: ["বিক্রিয়া শক্তি নির্গত বা শোষণ করে", "সমীকরণ সমতাকরণ ভর সংরক্ষণ করে", "প্রভাবক ব্যবহৃত না হয়ে বিক্রিয়া দ্রুত করে"],
    },
    generatedFrom: { en: "Generated from 3 chat sessions", bn: "৩টি চ্যাট সেশন থেকে তৈরি" },
  },
  {
    title: { en: "Auto-summary: Quadratic Equations", bn: "স্বয়ংক্রিয় সারাংশ: দ্বিঘাত সমীকরণ" },
    points: {
      en: ["Standard form is ax² + bx + c = 0", "Factor first, use the formula if it won't factor", "Discriminant tells you the nature of roots"],
      bn: ["আদর্শ রূপ হলো ax² + bx + c = 0", "প্রথমে গুণনীয়ক বের করো, না পারলে সূত্র ব্যবহার করো", "ডিসক্রিমিন্যান্ট মূলের প্রকৃতি বলে দেয়"],
    },
    generatedFrom: { en: "Generated from 2 chat sessions", bn: "২টি চ্যাট সেশন থেকে তৈরি" },
  },
];

export const mistakeBookEntries = [
  {
    subject: { en: "Chemistry", bn: "রসায়ন" },
    question: { en: "Is dissolving salt in water exothermic or endothermic?", bn: "লবণ পানিতে দ্রবীভূত করা কি তাপোৎপাদী নাকি তাপগ্রাহী?" },
    yourAnswer: { en: "Exothermic", bn: "তাপোৎপাদী" },
    correctAnswer: {
      en: "Endothermic — it absorbs heat from the surroundings, cooling the water slightly.",
      bn: "তাপগ্রাহী — এটি চারপাশ থেকে তাপ শোষণ করে, পানি সামান্য ঠান্ডা হয়।",
    },
  },
  {
    subject: { en: "Mathematics", bn: "গণিত" },
    question: { en: "Solve x² - 5x + 6 = 0", bn: "x² - 5x + 6 = 0 সমাধান করো" },
    yourAnswer: { en: "x = 1, 6", bn: "x = ১, ৬" },
    correctAnswer: {
      en: "x = 2, 3 — factor as (x-2)(x-3) = 0.",
      bn: "x = ২, ৩ — (x-2)(x-3) = 0 আকারে গুণনীয়ক করো।",
    },
  },
  {
    subject: { en: "Physics", bn: "পদার্থবিজ্ঞান" },
    question: { en: "What provides centripetal force in circular motion?", bn: "বৃত্তাকার গতিতে কেন্দ্রমুখী বল কে জোগায়?" },
    yourAnswer: { en: "Inertia", bn: "জড়তা" },
    correctAnswer: {
      en: "A net inward force (tension, gravity, or friction) — not inertia, which resists change in motion.",
      bn: "একটি নিট অন্তর্মুখী বল (টান, মাধ্যাকর্ষণ বা ঘর্ষণ) — জড়তা নয়, যা গতির পরিবর্তনকে বাধা দেয়।",
    },
  },
];

export const savedAnswers = [
  {
    subject: { en: "Chemistry", bn: "রসায়ন" },
    question: { en: "Difference between exothermic and endothermic reactions?", bn: "তাপোৎপাদী ও তাপগ্রাহী বিক্রিয়ার পার্থক্য?" },
    answer: {
      en: "Exothermic releases energy to surroundings; endothermic absorbs it from surroundings.",
      bn: "তাপোৎপাদী চারপাশে শক্তি ছাড়ে; তাপগ্রাহী চারপাশ থেকে শক্তি শোষণ করে।",
    },
    source: { en: "NCTB Chemistry textbook, Ch. 4, p.56", bn: "এনসিটিবি রসায়ন বই, ৪র্থ অধ্যায়, পৃ.৫৬" },
  },
  {
    subject: { en: "Mathematics", bn: "গণিত" },
    question: { en: "How to solve a quadratic by factoring?", bn: "গুণনীয়ক দ্বারা দ্বিঘাত সমীকরণ সমাধান কীভাবে?" },
    answer: {
      en: "Factor into two binomials that multiply to give the original equation, then solve each for zero.",
      bn: "দুটি দ্বিপদে গুণনীয়ক করো যা মূল সমীকরণ দেয়, তারপর প্রতিটি শূন্যের জন্য সমাধান করো।",
    },
    source: { en: "NCTB Mathematics textbook, Ch. 3, p.41", bn: "এনসিটিবি গণিত বই, ৩য় অধ্যায়, পৃ.৪১" },
  },
];

export const roadmapWeeks = [
  {
    week: { en: "Week 1", bn: "সপ্তাহ ১" },
    status: "done" as const,
    topics: { en: "Chemistry Ch. 1-3: Basics, Structure of Matter, Periodic Table", bn: "রসায়ন ১-৩ অধ্যায়: বেসিক, পদার্থের গঠন, পর্যায় সারণি" },
  },
  {
    week: { en: "Week 2", bn: "সপ্তাহ ২" },
    status: "in-progress" as const,
    topics: { en: "Chemistry Ch. 4-5: Chemical Reactions, Behaviour of Gases", bn: "রসায়ন ৪-৫ অধ্যায়: রাসায়নিক বিক্রিয়া, গ্যাসের আচরণ" },
  },
  {
    week: { en: "Week 3", bn: "সপ্তাহ ৩" },
    status: "upcoming" as const,
    topics: { en: "Physics Ch. 1-2: Motion, Force and Laws of Motion", bn: "পদার্থবিজ্ঞান ১-২ অধ্যায়: গতি, বল ও গতিসূত্র" },
  },
  {
    week: { en: "Week 4", bn: "সপ্তাহ ৪" },
    status: "upcoming" as const,
    topics: { en: "Mathematics Ch. 3: Quadratic Equations", bn: "গণিত ৩য় অধ্যায়: দ্বিঘাত সমীকরণ" },
  },
];

export const timerPresets = [
  { minutes: 25, label: { en: "Focus", bn: "ফোকাস" } },
  { minutes: 5, label: { en: "Short break", bn: "ছোট বিরতি" } },
  { minutes: 15, label: { en: "Long break", bn: "লম্বা বিরতি" } },
];

export const alarmSounds = [
  { en: "Chime", bn: "চাইম" },
  { en: "Bell", bn: "বেল" },
  { en: "Digital", bn: "ডিজিটাল" },
];

export const mostImportantQuestions = [
  {
    en: "Explain exothermic vs endothermic reactions with examples.",
    bn: "উদাহরণসহ তাপোৎপাদী ও তাপগ্রাহী বিক্রিয়া ব্যাখ্যা করো।",
  },
  {
    en: "State and explain Newton's three laws of motion.",
    bn: "নিউটনের তিনটি গতিসূত্র বর্ণনা ও ব্যাখ্যা করো।",
  },
  {
    en: "Solve a quadratic equation by factoring — show all steps.",
    bn: "গুণনীয়করণ দ্বারা দ্বিঘাত সমীকরণ সমাধান করো — সব ধাপ দেখাও।",
  },
];

export const lastMinuteFacts = [
  { en: "Catalysts speed up reactions without being consumed.", bn: "প্রভাবক ব্যবহৃত না হয়ে বিক্রিয়া দ্রুত করে।" },
  { en: "Discriminant b²-4ac tells you the nature of the roots.", bn: "ডিসক্রিমিন্যান্ট b²-4ac মূলের প্রকৃতি বলে দেয়।" },
  {
    en: "Newton's 3rd law pairs act on two different objects.",
    bn: "নিউটনের ৩য় সূত্রের জোড়া দুটি ভিন্ন বস্তুর উপর কাজ করে।",
  },
  {
    en: "Periodic table columns (groups) share similar properties.",
    bn: "পর্যায় সারণির কলাম (গ্রুপ) একই রকম ধর্ম ভাগ করে।",
  },
];
