export type ChatLanguage = "bn" | "en";

const STORAGE_KEY = "ai-chat-language";

// Local-only persistence for now — swap for a real profile field once
// student profiles are backend-persisted.
export function loadChatLanguage(): ChatLanguage {
  if (typeof window === "undefined") return "bn";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "bn" || raw === "en") return raw;
  } catch {
    // storage unavailable — fall back to the default below
  }
  return "bn";
}

export function saveChatLanguage(value: ChatLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // storage unavailable — selection just won't persist across reloads
  }
}

/** Placeholder AI reply text in the chosen communication language. */
export function getDemoReplyText(chatLanguage: ChatLanguage): string {
  if (chatLanguage === "bn") {
    return "এটি একটি ডেমো উত্তর। তোমার পাঠ্যবইয়ের ভিত্তিতে প্রকৃত উত্তর পরবর্তী ধাপে আসবে।";
  }
  return "This is a demo reply. Real answers grounded in your textbooks are coming in a later step.";
}
