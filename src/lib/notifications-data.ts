export type NotificationType = "studyReminder" | "examReminder" | "aiRecommendation" | "scheduleUpdate" | "systemUpdate";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  time: { en: string; bn: string };
  read: boolean;
};

export function seedNotifications(): AppNotification[] {
  return [
    {
      id: "notif-1",
      type: "studyReminder",
      title: { en: "Time to study!", bn: "পড়ার সময় হয়েছে!" },
      description: {
        en: "You haven't studied Chemistry today yet — a quick 20-minute session keeps your streak alive.",
        bn: "আজ এখনো রসায়ন পড়োনি — একটি দ্রুত ২০-মিনিটের সেশন তোমার স্ট্রিক টিকিয়ে রাখবে।",
      },
      time: { en: "2 hours ago", bn: "২ ঘণ্টা আগে" },
      read: false,
    },
    {
      id: "notif-2",
      type: "examReminder",
      title: { en: "SSC 2027 is getting closer", bn: "এসএসসি ২০২৭ কাছে আসছে" },
      description: {
        en: "45 days left until your exam. Check your Exam Countdown for a revision plan.",
        bn: "তোমার পরীক্ষার আর ৪৫ দিন বাকি। রিভিশন পরিকল্পনার জন্য পরীক্ষার কাউন্টডাউন দেখো।",
      },
      time: { en: "5 hours ago", bn: "৫ ঘণ্টা আগে" },
      read: false,
    },
    {
      id: "notif-3",
      type: "aiRecommendation",
      title: { en: "Recommended: Quadratic Equations", bn: "প্রস্তাবিত: দ্বিঘাত সমীকরণ" },
      description: {
        en: "Based on your recent activity, practicing this chapter next could help the most.",
        bn: "তোমার সাম্প্রতিক কার্যক্রমের ভিত্তিতে, এই অধ্যায়টি এখন অনুশীলন করা সবচেয়ে বেশি কাজে দেবে।",
      },
      time: { en: "Yesterday", bn: "গতকাল" },
      read: false,
    },
    {
      id: "notif-4",
      type: "scheduleUpdate",
      title: { en: "This week's plan is ready", bn: "এই সপ্তাহের পরিকল্পনা প্রস্তুত" },
      description: {
        en: "Your Plan My Week schedule for this week has been generated.",
        bn: "এই সপ্তাহের জন্য তোমার প্ল্যান মাই উইক সময়সূচি তৈরি হয়েছে।",
      },
      time: { en: "2 days ago", bn: "২ দিন আগে" },
      read: true,
    },
    {
      id: "notif-5",
      type: "systemUpdate",
      title: { en: "New: Voice Input", bn: "নতুন: ভয়েস ইনপুট" },
      description: {
        en: "You can now speak your questions directly into the chat composer.",
        bn: "এখন তুমি সরাসরি চ্যাট কম্পোজারে কথা বলে প্রশ্ন করতে পারো।",
      },
      time: { en: "3 days ago", bn: "৩ দিন আগে" },
      read: true,
    },
    {
      id: "notif-6",
      type: "studyReminder",
      title: { en: "Great job studying yesterday!", bn: "গতকাল দারুণ পড়েছ!" },
      description: {
        en: "You completed a 35-minute Chemistry session. Keep the streak going today.",
        bn: "তুমি ৩৫ মিনিটের একটি রসায়ন সেশন সম্পন্ন করেছ। আজও স্ট্রিক ধরে রাখো।",
      },
      time: { en: "1 week ago", bn: "১ সপ্তাহ আগে" },
      read: true,
    },
  ];
}

export type NotificationPreferences = {
  studyReminders: boolean;
  examReminders: boolean;
  aiRecommendations: boolean;
  scheduleReminders: boolean;
  systemNotifications: boolean;
};

export const defaultNotificationPreferences: NotificationPreferences = {
  studyReminders: true,
  examReminders: true,
  aiRecommendations: true,
  scheduleReminders: true,
  systemNotifications: false,
};
