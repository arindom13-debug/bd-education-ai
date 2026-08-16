export type ChangelogTag = "new" | "improved" | "fixed";

export type ChangelogEntry = {
  id: string;
  date: { en: string; bn: string };
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  tag: ChangelogTag;
};

export const whatsNewEntries: ChangelogEntry[] = [
  {
    id: "chat-transitions",
    date: { en: "August 2026", bn: "আগস্ট ২০২৬" },
    title: { en: "Smoother chat transitions", bn: "মসৃণ চ্যাট ট্রানজিশন" },
    description: {
      en: "Starting a new chat and sending your first message now feels seamless, with polished motion throughout.",
      bn: "নতুন চ্যাট শুরু করা ও প্রথম বার্তা পাঠানো এখন আরও মসৃণ, পুরো জুড়ে পরিমার্জিত অ্যানিমেশনসহ।",
    },
    tag: "improved",
  },
  {
    id: "light-mode",
    date: { en: "August 2026", bn: "আগস্ট ২০২৬" },
    title: { en: "Light mode", bn: "লাইট মোড" },
    description: {
      en: "A brand-new white/light theme, alongside the classic dark mode. Switch anytime from the sidebar.",
      bn: "নতুন সাদা/লাইট থিম, চিরাচরিত ডার্ক মোডের পাশাপাশি। সাইডবার থেকে যেকোনো সময় বদলাতে পারো।",
    },
    tag: "new",
  },
  {
    id: "editable-week",
    date: { en: "July 2026", bn: "জুলাই ২০২৬" },
    title: { en: "Editable weekly study plans", bn: "সম্পাদনাযোগ্য সাপ্তাহিক পড়ার পরিকল্পনা" },
    description: {
      en: "Plan My Week now supports full editing — reorder, retime, or add sessions after the AI generates your week.",
      bn: "প্ল্যান মাই উইক এখন সম্পূর্ণ সম্পাদনা সমর্থন করে — এআই তোমার সপ্তাহ তৈরি করার পর সেশন পুনর্বিন্যাস, সময় পরিবর্তন বা যোগ করতে পারো।",
    },
    tag: "new",
  },
  {
    id: "notebook",
    date: { en: "July 2026", bn: "জুলাই ২০২৬" },
    title: { en: "Interactive Notebook", bn: "ইন্টারঅ্যাক্টিভ নোটবুক" },
    description: {
      en: "Create, search, pin, and auto-save your own notes right from Study Tools.",
      bn: "স্টাডি টুলস থেকে সরাসরি নিজের নোট তৈরি, খোঁজা, পিন করা ও স্বয়ংক্রিয়ভাবে সংরক্ষণ করো।",
    },
    tag: "new",
  },
  {
    id: "global-timer",
    date: { en: "June 2026", bn: "জুন ২০২৬" },
    title: { en: "Global study timer", bn: "গ্লোবাল স্টাডি টাইমার" },
    description: {
      en: "Your focus timer now keeps running and stays visible no matter which page you're on.",
      bn: "তোমার ফোকাস টাইমার এখন চলতে থাকে এবং তুমি যে পৃষ্ঠাতেই থাকো না কেন দৃশ্যমান থাকে।",
    },
    tag: "improved",
  },
];
