export type MessageAttachmentKind = "pdf" | "doc" | "image" | "txt";

export type MessageAttachment = {
  name: string;
  kind: MessageAttachmentKind;
};

export type MessageFeedback = "helpful" | "unhelpful";

export type ChatMessage = {
  role: "user" | "ai";
  text: { en: string; bn: string };
  source?: { en: string; bn: string };
  attachment?: MessageAttachment;
  feedback?: MessageFeedback;
};

export type ConversationContext = "learning" | "revision" | "practice";

export type ChatThread = {
  id: string;
  title: { en: string; bn: string };
  group: "today" | "yesterday";
  subjectId: string;
  context: ConversationContext;
  relativeTime: { en: string; bn: string };
  messages: ChatMessage[];
  archived?: boolean;
};

export const onboardingThread: ChatThread = {
  id: "onboarding",
  title: { en: "Get to know you", bn: "তোমাকে জানা" },
  group: "today",
  subjectId: "",
  context: "learning",
  relativeTime: { en: "Just now", bn: "এইমাত্র" },
  messages: [
    {
      role: "ai",
      text: {
        en: "Hi! Let's personalize your study plan — a few quick questions. Which class are you in, Class 9 or 10? And which subjects do you find hardest right now?",
        bn: "হাই! তোমার পড়াশোনার পরিকল্পনা ব্যক্তিগত করতে কয়েকটা প্রশ্ন করি। তুমি কোন ক্লাসে পড়ো, ৯ নাকি ১০? আর এখন কোন বিষয়গুলো তোমার কাছে সবচেয়ে কঠিন মনে হয়?",
      },
    },
  ],
};

export const chatHistory: ChatThread[] = [
  {
    id: "chat-1",
    title: { en: "Explain chemical reactions", bn: "রাসায়নিক বিক্রিয়া বোঝাও" },
    group: "today",
    subjectId: "chemistry",
    context: "learning",
    relativeTime: { en: "8 min ago", bn: "৮ মিনিট আগে" },
    messages: [
      {
        role: "user",
        text: {
          en: "What's the difference between an exothermic and endothermic reaction?",
          bn: "তাপোৎপাদী এবং তাপগ্রাহী বিক্রিয়ার মধ্যে পার্থক্য কী?",
        },
      },
      {
        role: "ai",
        text: {
          en: "An exothermic reaction releases energy (usually as heat) to its surroundings, so the surroundings get warmer — burning fuel is an example. An endothermic reaction absorbs energy from its surroundings, so the surroundings get cooler — dissolving ammonium chloride in water is an example.",
          bn: "তাপোৎপাদী বিক্রিয়ায় শক্তি (সাধারণত তাপ হিসেবে) চারপাশে নির্গত হয়, ফলে চারপাশ উষ্ণ হয় — জ্বালানি পোড়ানো এর উদাহরণ। তাপগ্রাহী বিক্রিয়ায় চারপাশ থেকে শক্তি শোষিত হয়, ফলে চারপাশ ঠান্ডা হয় — পানিতে অ্যামোনিয়াম ক্লোরাইড দ্রবীভূত করা এর উদাহরণ।",
        },
        source: {
          en: "Source: NCTB Chemistry textbook, Ch. 4, p.56",
          bn: "উৎস: এনসিটিবি রসায়ন বই, ৪র্থ অধ্যায়, পৃ.৫৬",
        },
      },
    ],
  },
  {
    id: "chat-2",
    title: { en: "Help with quadratic equations", bn: "দ্বিঘাত সমীকরণে সাহায্য" },
    group: "today",
    subjectId: "mathematics",
    context: "practice",
    relativeTime: { en: "2 hours ago", bn: "২ ঘণ্টা আগে" },
    messages: [
      {
        role: "user",
        text: { en: "How do I solve x^2 - 5x + 6 = 0?", bn: "x^2 - 5x + 6 = 0 কীভাবে সমাধান করব?" },
      },
      {
        role: "ai",
        text: {
          en: "Factor it as (x - 2)(x - 3) = 0, so x = 2 or x = 3. You can check by expanding: (x-2)(x-3) = x^2 - 5x + 6.",
          bn: "এটিকে (x - 2)(x - 3) = 0 আকারে গুণনীয়ক করা যায়, তাই x = 2 অথবা x = 3। যাচাই করতে (x-2)(x-3) বিস্তৃত করুন।",
        },
        source: {
          en: "Source: NCTB Mathematics textbook, Ch. 3, p.41",
          bn: "উৎস: এনসিটিবি গণিত বই, ৩য় অধ্যায়, পৃ.৪১",
        },
      },
    ],
  },
  {
    id: "chat-3",
    title: { en: "SSC exam pattern for Physics", bn: "পদার্থবিজ্ঞানের এসএসসি প্রশ্নপত্র প্যাটার্ন" },
    group: "yesterday",
    subjectId: "physics",
    context: "revision",
    relativeTime: { en: "Yesterday, 7:40 PM", bn: "গতকাল, রাত ৭:৪০" },
    messages: [
      {
        role: "user",
        text: { en: "What kind of questions come from the Force chapter in SSC?", bn: "এসএসসিতে বল অধ্যায় থেকে কী ধরনের প্রশ্ন আসে?" },
      },
      {
        role: "ai",
        text: {
          en: "Board questions from this chapter usually include one conceptual short-answer question on Newton's laws and one numerical problem on momentum or friction, based on the last 5 years of board papers.",
          bn: "এই অধ্যায় থেকে সাধারণত নিউটনের সূত্র নিয়ে একটি ধারণাগত প্রশ্ন এবং ভরবেগ বা ঘর্ষণ নিয়ে একটি সংখ্যাগত সমস্যা আসে, গত ৫ বছরের বোর্ড প্রশ্নের ভিত্তিতে।",
        },
        source: {
          en: "Source: Board question pattern, 2020-2024",
          bn: "উৎস: বোর্ড প্রশ্ন প্যাটার্ন, ২০২০-২০২৪",
        },
      },
    ],
  },
];
