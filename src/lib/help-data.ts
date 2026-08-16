export type HelpCategory = "gettingStarted" | "usingAi" | "studyTools" | "accountBilling";

export const helpCategories: HelpCategory[] = ["gettingStarted", "usingAi", "studyTools", "accountBilling"];

export type HelpArticle = {
  id: string;
  category: HelpCategory;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
};

export const helpArticles: HelpArticle[] = [
  {
    id: "art-profile",
    category: "gettingStarted",
    title: { en: "Setting up your Learning Profile", bn: "তোমার শেখার প্রোফাইল সেটআপ করা" },
    description: {
      en: "Tell us your class, curriculum, exam target, and goals so answers and plans fit you.",
      bn: "তোমার ক্লাস, কারিকুলাম, পরীক্ষার লক্ষ্য ও উদ্দেশ্য জানাও, যাতে উত্তর ও পরিকল্পনা তোমার জন্য মানানসই হয়।",
    },
  },
  {
    id: "art-language",
    category: "gettingStarted",
    title: { en: "Switching between English and বাংলা", bn: "ইংরেজি ও বাংলার মধ্যে পরিবর্তন" },
    description: {
      en: "Change the interface language anytime from Settings → General → Language.",
      bn: "সেটিংস → সাধারণ → ভাষা থেকে যেকোনো সময় ইন্টারফেসের ভাষা বদলাতে পারো।",
    },
  },
  {
    id: "art-accurate-answers",
    category: "usingAi",
    title: { en: "Getting the most accurate AI answers", bn: "সবচেয়ে সঠিক এআই উত্তর পাওয়া" },
    description: {
      en: "Ask about a specific chapter or topic — answers traced to your textbook are marked with a source.",
      bn: "নির্দিষ্ট কোনো অধ্যায় বা টপিক নিয়ে জিজ্ঞাসা করো — পাঠ্যবই থেকে যাচাই করা উত্তরে উৎস উল্লেখ থাকে।",
    },
  },
  {
    id: "art-voice-attach",
    category: "usingAi",
    title: { en: "Using Voice Input and Attachments", bn: "ভয়েস ইনপুট ও সংযুক্তি ব্যবহার করা" },
    description: {
      en: "Tap the mic to speak your question, or attach a PDF, image, DOC, or TXT file to a chat.",
      bn: "প্রশ্ন বলতে মাইকে ট্যাপ করো, অথবা চ্যাটে PDF, ছবি, DOC বা TXT ফাইল সংযুক্ত করো।",
    },
  },
  {
    id: "art-timer-notebook",
    category: "studyTools",
    title: { en: "Using the Study Timer and Notebook", bn: "স্টাডি টাইমার ও নোটবুক ব্যবহার করা" },
    description: {
      en: "Run focus sessions from Study Tools, and jot down notes that auto-save as you type.",
      bn: "স্টাডি টুলস থেকে ফোকাস সেশন চালাও, এবং লেখার সাথে সাথে স্বয়ংক্রিয়ভাবে সংরক্ষিত নোট লেখো।",
    },
  },
  {
    id: "art-plan-week",
    category: "studyTools",
    title: { en: "Planning your week with Plan My Week", bn: "প্ল্যান মাই উইক দিয়ে সপ্তাহ সাজানো" },
    description: {
      en: "Generate a weekly schedule from your availability, then edit any session freely.",
      bn: "তোমার সময়ের ভিত্তিতে সাপ্তাহিক সময়সূচি তৈরি করো, তারপর যেকোনো সেশন স্বাধীনভাবে সম্পাদনা করো।",
    },
  },
  {
    id: "art-subscription",
    category: "accountBilling",
    title: { en: "Managing your subscription", bn: "তোমার সাবস্ক্রিপশন পরিচালনা করা" },
    description: {
      en: "Upgrade, downgrade, or cancel anytime from Billing — changes shown there are instant.",
      bn: "বিলিং থেকে যেকোনো সময় আপগ্রেড, ডাউনগ্রেড বা বাতিল করো — সেখানকার পরিবর্তন তাৎক্ষণিক দেখানো হয়।",
    },
  },
  {
    id: "art-payment-method",
    category: "accountBilling",
    title: { en: "Adding or removing a payment method", bn: "পেমেন্ট মেথড যোগ বা সরানো" },
    description: {
      en: "Manage saved cards from Billing → Payment Methods, and set which one is the default.",
      bn: "বিলিং → পেমেন্ট মেথড থেকে সংরক্ষিত কার্ড পরিচালনা করো, এবং কোনটি ডিফল্ট তা নির্ধারণ করো।",
    },
  },
];

export type ServiceStatusLevel = "operational" | "limited" | "maintenance";

export type SystemService = {
  id: string;
  labelKey: "helpStatusAiAssistant" | "helpStatusStudyTools" | "helpStatusChat" | "helpStatusFileAttachments" | "helpStatusVoiceInput" | "helpStatusSchedule";
  status: ServiceStatusLevel;
};

export const systemServices: SystemService[] = [
  { id: "ai-assistant", labelKey: "helpStatusAiAssistant", status: "operational" },
  { id: "study-tools", labelKey: "helpStatusStudyTools", status: "operational" },
  { id: "chat", labelKey: "helpStatusChat", status: "operational" },
  { id: "file-attachments", labelKey: "helpStatusFileAttachments", status: "operational" },
  { id: "voice-input", labelKey: "helpStatusVoiceInput", status: "limited" },
  { id: "schedule", labelKey: "helpStatusSchedule", status: "operational" },
];

export type FaqEntry = {
  id: string;
  category: HelpCategory;
  question: { en: string; bn: string };
  answer: { en: string; bn: string };
};

export const faqEntries: FaqEntry[] = [
  {
    id: "faq-class-change",
    category: "gettingStarted",
    question: { en: "Can I change my class or curriculum later?", bn: "পরে কি ক্লাস বা কারিকুলাম বদলাতে পারব?" },
    answer: {
      en: "Yes — open Learning Profile from the sidebar any time to update your class, curriculum, exam target, or goals.",
      bn: "হ্যাঁ — যেকোনো সময় সাইডবার থেকে শেখার প্রোফাইল খুলে ক্লাস, কারিকুলাম, পরীক্ষার লক্ষ্য বা উদ্দেশ্য হালনাগাদ করতে পারো।",
    },
  },
  {
    id: "faq-delete-data",
    category: "gettingStarted",
    question: { en: "How do I delete my data?", bn: "আমি কীভাবে আমার ডেটা মুছে ফেলব?" },
    answer: {
      en: "Go to Settings → Data, where you can export or delete your conversation history, or delete your account entirely.",
      bn: "সেটিংস → ডেটাতে যাও, সেখান থেকে তোমার কথোপকথনের ইতিহাস এক্সপোর্ট বা মুছে ফেলতে পারো, অথবা সম্পূর্ণ অ্যাকাউন্ট মুছে ফেলতে পারো।",
    },
  },
  {
    id: "faq-textbook-source",
    category: "usingAi",
    question: { en: "Are the answers based on my actual textbooks?", bn: "উত্তরগুলো কি আমার আসল পাঠ্যবই অনুযায়ী?" },
    answer: {
      en: "Wherever possible, answers are traced back to your NCTB textbook. If a source isn't yet verified, the answer is clearly marked as a general AI answer.",
      bn: "যেখানে সম্ভব, উত্তর তোমার এনসিটিবি পাঠ্যবই থেকে যাচাই করা হয়। উৎস যাচাই না হলে, উত্তরটি সাধারণ এআই উত্তর হিসেবে স্পষ্টভাবে চিহ্নিত থাকে।",
    },
  },
  {
    id: "faq-voice-language",
    category: "usingAi",
    question: { en: "What language can I use for voice input?", bn: "ভয়েস ইনপুটের জন্য কোন ভাষা ব্যবহার করতে পারি?" },
    answer: {
      en: "Voice input transcribes into whichever interface language you're currently using, English or বাংলা.",
      bn: "তুমি বর্তমানে যে ইন্টারফেস ভাষা ব্যবহার করছ — ইংরেজি বা বাংলা — ভয়েস ইনপুট সেই ভাষাতেই লেখায় রূপান্তরিত হয়।",
    },
  },
  {
    id: "faq-free-plan",
    category: "accountBilling",
    question: { en: "Is Arindom's AI free to use?", bn: "অরিন্দমস এআই কি বিনামূল্যে ব্যবহার করা যায়?" },
    answer: {
      en: "Yes — the Free plan gives you a generous monthly allowance of AI messages and study plan generations. See Billing for the Premium plan with higher limits.",
      bn: "হ্যাঁ — ফ্রি প্ল্যানে মাসিক পর্যাপ্ত এআই বার্তা ও পড়ার পরিকল্পনা তৈরির সুযোগ আছে। বেশি সীমার প্রিমিয়াম প্ল্যানের জন্য বিলিং দেখো।",
    },
  },
  {
    id: "faq-cancel-anytime",
    category: "accountBilling",
    question: { en: "Can I cancel my subscription anytime?", bn: "আমি কি যেকোনো সময় সাবস্ক্রিপশন বাতিল করতে পারি?" },
    answer: {
      en: "Yes — cancel from Billing → Current Plan whenever you like. You'll move back to the Free plan immediately.",
      bn: "হ্যাঁ — বিলিং → বর্তমান প্ল্যান থেকে যেকোনো সময় বাতিল করতে পারো। তুমি সাথে সাথে ফ্রি প্ল্যানে ফিরে যাবে।",
    },
  },
  {
    id: "faq-timer-background",
    category: "studyTools",
    question: { en: "Does the Study Timer keep running if I switch pages?", bn: "পৃষ্ঠা পরিবর্তন করলে কি স্টাডি টাইমার চলতে থাকে?" },
    answer: {
      en: "Yes — the timer keeps running in the background and stays visible no matter which page you're on.",
      bn: "হ্যাঁ — টাইমার পেছনে চলতে থাকে এবং তুমি যে পৃষ্ঠাতেই থাকো না কেন দৃশ্যমান থাকে।",
    },
  },
  {
    id: "faq-notebook-autosave",
    category: "studyTools",
    question: { en: "Do I need to manually save my notes?", bn: "নোট কি নিজে থেকে সংরক্ষণ করতে হবে?" },
    answer: {
      en: "No — the Notebook auto-saves a moment after you stop typing, shown by the Saving… / Saved indicator.",
      bn: "না — লেখা থামানোর মুহূর্ত পরেই নোটবুক স্বয়ংক্রিয়ভাবে সংরক্ষণ করে, যা সংরক্ষণ হচ্ছে… / সংরক্ষিত সূচক দেখায়।",
    },
  },
];
