export type AiResponseStyle = "concise" | "balanced" | "detailed";

export type StudyAssistancePreferences = {
  autoExplainConcepts: boolean;
  giveExamples: boolean;
  stepByStepSolutions: boolean;
  askBeforeRevealingAnswers: boolean;
};

export type ChatBehaviorPreferences = {
  autoScroll: boolean;
  enterToSend: boolean;
  showTimestamps: boolean;
  saveChatHistory: boolean;
};

export type ReminderDurationMinutes = "10" | "15" | "30" | "60";
export type ReminderFrequency = "daily" | "weekdays" | "weekly" | "off";

export type StudyReminderPreferences = {
  defaultDurationMinutes: ReminderDurationMinutes;
  preferredTime: string;
  frequency: ReminderFrequency;
};

// Frontend-only mock — no real session/auth is involved. See app-shell.tsx's
// inactivity timer, which simulates the effect of this setting.
export type SessionTimeoutMinutes = "never" | "15" | "30" | "60";

export type AccountPreferences = {
  aiResponseStyle: AiResponseStyle;
  studyAssistance: StudyAssistancePreferences;
  chatBehavior: ChatBehaviorPreferences;
  studyReminders: StudyReminderPreferences;
  sessionTimeoutMinutes: SessionTimeoutMinutes;
};

export const defaultAccountPreferences: AccountPreferences = {
  aiResponseStyle: "balanced",
  studyAssistance: {
    autoExplainConcepts: true,
    giveExamples: true,
    stepByStepSolutions: true,
    askBeforeRevealingAnswers: false,
  },
  chatBehavior: {
    autoScroll: true,
    enterToSend: true,
    showTimestamps: false,
    saveChatHistory: true,
  },
  studyReminders: {
    defaultDurationMinutes: "15",
    preferredTime: "18:00",
    frequency: "daily",
  },
  sessionTimeoutMinutes: "never",
};
