export type LegalDocId = "terms" | "privacy" | "cookies" | "aiGuidelines";

export type LegalSection = {
  heading: { en: string; bn: string };
  body: { en: string; bn: string };
};

export type LegalDocument = {
  id: LegalDocId;
  title: { en: string; bn: string };
  lastUpdated: { en: string; bn: string };
  sections: LegalSection[];
};

export const legalDocuments: Record<LegalDocId, LegalDocument> = {
  terms: {
    id: "terms",
    title: { en: "Terms of Service", bn: "সেবার শর্তাবলি" },
    lastUpdated: { en: "August 1, 2026", bn: "১ আগস্ট, ২০২৬" },
    sections: [
      {
        heading: { en: "1. Using Arindom's AI", bn: "১. অরিন্দমস এআই ব্যবহার" },
        body: {
          en: "Arindom's AI is a study companion for Class 9–10 students in Bangladesh. By using the app, you agree to use it for personal, non-commercial study purposes and to keep your account details accurate.",
          bn: "অরিন্দমস এআই বাংলাদেশের নবম-দশম শ্রেণির শিক্ষার্থীদের জন্য একটি পড়াশোনার সহায়ক। অ্যাপ ব্যবহার করে তুমি ব্যক্তিগত, অ-বাণিজ্যিক পড়াশোনার উদ্দেশ্যে এটি ব্যবহার করতে এবং তোমার অ্যাকাউন্টের তথ্য সঠিক রাখতে সম্মত হচ্ছ।",
        },
      },
      {
        heading: { en: "2. Your Account", bn: "২. তোমার অ্যাকাউন্ট" },
        body: {
          en: "You're responsible for keeping your account credentials safe. Let us know right away if you think someone else has access to your account.",
          bn: "তোমার অ্যাকাউন্টের তথ্য নিরাপদ রাখার দায়িত্ব তোমার। যদি মনে করো অন্য কারও তোমার অ্যাকাউন্টে প্রবেশাধিকার আছে, তাহলে দ্রুত আমাদের জানাও।",
        },
      },
      {
        heading: { en: "3. Subscriptions & Billing", bn: "৩. সাবস্ক্রিপশন ও বিলিং" },
        body: {
          en: "Paid plans renew automatically each billing cycle unless cancelled beforehand. You can upgrade, downgrade, or cancel anytime from Billing.",
          bn: "বাতিল না করা পর্যন্ত পেইড প্ল্যান প্রতিটি বিলিং চক্রে স্বয়ংক্রিয়ভাবে নবায়ন হয়। তুমি যেকোনো সময় বিলিং থেকে আপগ্রেড, ডাউনগ্রেড বা বাতিল করতে পারো।",
        },
      },
      {
        heading: { en: "4. Acceptable Use", bn: "৪. গ্রহণযোগ্য ব্যবহার" },
        body: {
          en: "Please don't use the app to cheat during actual exams, share answers in ways that violate your school's academic integrity policy, or attempt to disrupt the service.",
          bn: "অনুগ্রহ করে প্রকৃত পরীক্ষায় নকল করতে, তোমার স্কুলের একাডেমিক সততা নীতি লঙ্ঘন করে উত্তর শেয়ার করতে, বা সেবা ব্যাহত করার চেষ্টায় অ্যাপটি ব্যবহার কোরো না।",
        },
      },
      {
        heading: { en: "5. Changes to These Terms", bn: "৫. এই শর্তাবলিতে পরিবর্তন" },
        body: {
          en: "We may update these terms from time to time. Continuing to use the app after an update means you accept the revised terms.",
          bn: "আমরা মাঝে মাঝে এই শর্তাবলি হালনাগাদ করতে পারি। হালনাগাদের পরও অ্যাপ ব্যবহার চালিয়ে যাওয়া মানে তুমি সংশোধিত শর্তাবলি মেনে নিয়েছ।",
        },
      },
    ],
  },
  privacy: {
    id: "privacy",
    title: { en: "Privacy Policy", bn: "গোপনীয়তা নীতি" },
    lastUpdated: { en: "August 1, 2026", bn: "১ আগস্ট, ২০২৬" },
    sections: [
      {
        heading: { en: "1. What We Collect", bn: "১. আমরা যা সংগ্রহ করি" },
        body: {
          en: "We store your Learning Profile (class, curriculum, goals), your chats, notes, and study progress so the app can personalize your experience.",
          bn: "আমরা তোমার শেখার প্রোফাইল (ক্লাস, কারিকুলাম, লক্ষ্য), চ্যাট, নোট ও পড়ার অগ্রগতি সংরক্ষণ করি, যাতে অ্যাপটি তোমার অভিজ্ঞতা ব্যক্তিগতকৃত করতে পারে।",
        },
      },
      {
        heading: { en: "2. How We Use It", bn: "২. আমরা কীভাবে ব্যবহার করি" },
        body: {
          en: "Your data is used to generate answers, recommendations, and study plans tailored to you. We don't sell your personal data to third parties.",
          bn: "তোমার ডেটা ব্যবহার করা হয় তোমার জন্য উপযোগী উত্তর, পরামর্শ ও পড়ার পরিকল্পনা তৈরি করতে। আমরা তোমার ব্যক্তিগত ডেটা তৃতীয় পক্ষের কাছে বিক্রি করি না।",
        },
      },
      {
        heading: { en: "3. Your Controls", bn: "৩. তোমার নিয়ন্ত্রণ" },
        body: {
          en: "You can export or delete your conversation history at any time from Settings → Data, or delete your account entirely.",
          bn: "তুমি যেকোনো সময় সেটিংস → ডেটা থেকে তোমার কথোপকথনের ইতিহাস এক্সপোর্ট বা মুছে ফেলতে পারো, অথবা সম্পূর্ণ অ্যাকাউন্ট মুছে ফেলতে পারো।",
        },
      },
      {
        heading: { en: "4. Data Retention", bn: "৪. ডেটা ধরে রাখা" },
        body: {
          en: "We keep your data only as long as your account is active, plus a short grace period after deletion in case it was requested by mistake.",
          bn: "তোমার অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত এবং ভুলবশত অনুরোধ করা হলে মুছে ফেলার পর একটি সংক্ষিপ্ত সময়ের জন্য আমরা তোমার ডেটা রাখি।",
        },
      },
      {
        heading: { en: "5. Contact Us", bn: "৫. আমাদের সাথে যোগাযোগ" },
        body: {
          en: "Questions about your data can be sent through Help & Support → Contact Support.",
          bn: "তোমার ডেটা সম্পর্কে প্রশ্ন থাকলে সহায়তা → সহায়তার সাথে যোগাযোগ এর মাধ্যমে পাঠাতে পারো।",
        },
      },
    ],
  },
  cookies: {
    id: "cookies",
    title: { en: "Cookie Policy", bn: "কুকি নীতি" },
    lastUpdated: { en: "August 1, 2026", bn: "১ আগস্ট, ২০২৬" },
    sections: [
      {
        heading: { en: "1. What Cookies Do Here", bn: "১. এখানে কুকি যা করে" },
        body: {
          en: "We use local browser storage to remember things like your theme, language, and sidebar preferences between visits.",
          bn: "তোমার থিম, ভাষা ও সাইডবার পছন্দের মতো বিষয়গুলো এক ভিজিট থেকে আরেক ভিজিট পর্যন্ত মনে রাখতে আমরা স্থানীয় ব্রাউজার স্টোরেজ ব্যবহার করি।",
        },
      },
      {
        heading: { en: "2. Essential vs. Optional", bn: "২. প্রয়োজনীয় বনাম ঐচ্ছিক" },
        body: {
          en: "Some storage is essential for the app to function (like staying signed in); other preferences are optional and only improve convenience.",
          bn: "কিছু স্টোরেজ অ্যাপ চালানোর জন্য প্রয়োজনীয় (যেমন সাইন-ইন অবস্থায় থাকা); অন্যান্য পছন্দ ঐচ্ছিক এবং শুধু সুবিধা বাড়ায়।",
        },
      },
      {
        heading: { en: "3. No Third-Party Ad Tracking", bn: "৩. তৃতীয় পক্ষের বিজ্ঞাপন ট্র্যাকিং নেই" },
        body: {
          en: "We don't use third-party advertising or cross-site tracking cookies in Arindom's AI.",
          bn: "অরিন্দমস এআই-তে আমরা তৃতীয় পক্ষের বিজ্ঞাপন বা ক্রস-সাইট ট্র্যাকিং কুকি ব্যবহার করি না।",
        },
      },
      {
        heading: { en: "4. Managing Storage", bn: "৪. স্টোরেজ পরিচালনা" },
        body: {
          en: "You can clear locally stored preferences anytime through your browser's settings; the app will simply fall back to its defaults.",
          bn: "তুমি যেকোনো সময় তোমার ব্রাউজারের সেটিংস থেকে স্থানীয়ভাবে সংরক্ষিত পছন্দ মুছে ফেলতে পারো; অ্যাপটি তখন কেবল তার ডিফল্টে ফিরে যাবে।",
        },
      },
    ],
  },
  aiGuidelines: {
    id: "aiGuidelines",
    title: { en: "AI Usage Guidelines", bn: "এআই ব্যবহারের নির্দেশিকা" },
    lastUpdated: { en: "August 1, 2026", bn: "১ আগস্ট, ২০২৬" },
    sections: [
      {
        heading: { en: "1. What the AI Is For", bn: "১. এআই কীসের জন্য" },
        body: {
          en: "The AI is here to help you understand your Class 9–10 syllabus — explaining concepts, generating practice questions, and pointing you back to your textbook.",
          bn: "এআই তোমার নবম-দশম শ্রেণির সিলেবাস বুঝতে সাহায্য করার জন্য এখানে আছে — ধারণা ব্যাখ্যা করা, অনুশীলন প্রশ্ন তৈরি করা, এবং তোমাকে পাঠ্যবইয়ের দিকে ফিরিয়ে দেওয়া।",
        },
      },
      {
        heading: { en: "2. Answers Aren't Always Perfect", bn: "২. উত্তর সবসময় নিখুঁত নয়" },
        body: {
          en: "When an answer is traced back to your NCTB textbook, it's marked with a source. Answers without a source are general AI answers and should be double-checked.",
          bn: "যখন কোনো উত্তর তোমার এনসিটিবি পাঠ্যবই থেকে যাচাই করা হয়, তখন এটি উৎসসহ চিহ্নিত থাকে। উৎসবিহীন উত্তর সাধারণ এআই উত্তর এবং যাচাই করে নেওয়া উচিত।",
        },
      },
      {
        heading: { en: "3. Use It to Learn, Not to Copy", bn: "৩. শেখার জন্য ব্যবহার করো, নকলের জন্য নয়" },
        body: {
          en: "Treat the AI like a study partner, not a shortcut. Understanding an explanation is what actually helps on exam day.",
          bn: "এআইকে একটি পড়ার সঙ্গী হিসেবে বিবেচনা করো, শর্টকাট হিসেবে নয়। একটি ব্যাখ্যা বোঝাই পরীক্ষার দিন প্রকৃতপক্ষে সাহায্য করে।",
        },
      },
      {
        heading: { en: "4. Voice and Attachments", bn: "৪. ভয়েস ও সংযুক্তি" },
        body: {
          en: "Voice input is transcribed locally in your session and never used for anything beyond filling in your message. Attachments are used only to help answer your question.",
          bn: "ভয়েস ইনপুট তোমার সেশনে স্থানীয়ভাবে লেখায় রূপান্তরিত হয় এবং তোমার বার্তা পূরণ করা ছাড়া অন্য কোনো কাজে ব্যবহৃত হয় না। সংযুক্তি শুধুমাত্র তোমার প্রশ্নের উত্তর দিতে সাহায্য করতে ব্যবহৃত হয়।",
        },
      },
    ],
  },
};

export type MockSession = {
  id: string;
  device: string;
  browser: string;
  isCurrent: boolean;
  lastActive: { en: string; bn: string };
};

export function seedSessions(): MockSession[] {
  return [
    { id: "sess-1", device: "Windows", browser: "Chrome", isCurrent: true, lastActive: { en: "Active now", bn: "এখন সক্রিয়" } },
    { id: "sess-2", device: "Android", browser: "Chrome", isCurrent: false, lastActive: { en: "2 days ago", bn: "২ দিন আগে" } },
    { id: "sess-3", device: "macOS", browser: "Safari", isCurrent: false, lastActive: { en: "1 week ago", bn: "১ সপ্তাহ আগে" } },
  ];
}

export type LoginEvent = {
  id: string;
  device: string;
  browser: string;
  location: string;
  time: { en: string; bn: string };
  status: "success" | "failed";
};

export const loginActivity: LoginEvent[] = [
  {
    id: "login-1",
    device: "Windows",
    browser: "Chrome",
    location: "Dhaka, Bangladesh",
    time: { en: "Today, 10:15 AM", bn: "আজ, সকাল ১০:১৫" },
    status: "success",
  },
  {
    id: "login-2",
    device: "Android",
    browser: "Chrome",
    location: "Dhaka, Bangladesh",
    time: { en: "2 days ago", bn: "২ দিন আগে" },
    status: "success",
  },
  {
    id: "login-3",
    device: "Windows",
    browser: "Firefox",
    location: "Unknown location",
    time: { en: "2 weeks ago", bn: "২ সপ্তাহ আগে" },
    status: "failed",
  },
  {
    id: "login-4",
    device: "macOS",
    browser: "Safari",
    location: "Chattogram, Bangladesh",
    time: { en: "3 weeks ago", bn: "৩ সপ্তাহ আগে" },
    status: "success",
  },
  {
    id: "login-5",
    device: "Windows",
    browser: "Chrome",
    location: "Dhaka, Bangladesh",
    time: { en: "1 month ago", bn: "১ মাস আগে" },
    status: "success",
  },
];
