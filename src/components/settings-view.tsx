"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Trash2,
  Laptop,
  History,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { ToastStack, type ToastItem } from "@/components/toast";
import { strings, type Lang } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { ChatLanguage } from "@/lib/chat-language";
import type { NotificationPreferences } from "@/lib/notifications-data";
import {
  type AccountPreferences,
  type AiResponseStyle,
  type StudyAssistancePreferences,
  type ChatBehaviorPreferences,
  type StudyReminderPreferences,
  type ReminderDurationMinutes,
  type ReminderFrequency,
  type SessionTimeoutMinutes,
  defaultAccountPreferences,
} from "@/lib/preferences-data";
import { toBengaliDigits } from "@/lib/curriculum-data";
import { legalDocuments, seedSessions, loginActivity, type LegalDocId, type MockSession } from "@/lib/account-safety-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const LANGUAGE_OPTIONS: { value: Lang; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
];

const CHAT_LANGUAGE_OPTIONS: { value: ChatLanguage; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
];

const LEGAL_DOC_IDS: LegalDocId[] = ["terms", "privacy", "cookies", "aiGuidelines"];
function isLegalDocId(value: string): value is LegalDocId {
  return (LEGAL_DOC_IDS as string[]).includes(value);
}

type ActiveModal =
  | "deleteHistory"
  | "deleteAccount"
  | "changePassword"
  | "activeSessions"
  | "loginActivity"
  | "twoFactor"
  | "resetPreferences"
  | LegalDocId
  | null;

type ExportKind = "chats" | "notes" | "studyHistory";
type ExportFormat = "json" | "csv" | "pdf";
type ExportState = "selecting" | "exporting" | "success" | "error";

const EXPORT_TITLE_KEY: Record<ExportKind, keyof typeof strings> = {
  chats: "settingsExportChatsBtn",
  notes: "settingsExportNotesBtn",
  studyHistory: "settingsExportStudyHistoryBtn",
};

const EXPORT_FORMATS: ExportFormat[] = ["json", "csv", "pdf"];
const EXPORT_FORMAT_LABEL_KEY: Record<ExportFormat, keyof typeof strings> = {
  json: "settingsExportFormatJson",
  csv: "settingsExportFormatCsv",
  pdf: "settingsExportFormatPdf",
};

// Mock only — no file is ever produced, just a demonstrable failure path.
const EXPORT_ERROR_RATE = 1 / 8;
const SAVE_ERROR_RATE = 1 / 10;

const AI_RESPONSE_STYLE_OPTIONS: AiResponseStyle[] = ["concise", "balanced", "detailed"];
const AI_RESPONSE_STYLE_LABEL_KEY: Record<AiResponseStyle, keyof typeof strings> = {
  concise: "prefAiStyleConcise",
  balanced: "prefAiStyleBalanced",
  detailed: "prefAiStyleDetailed",
};

const REMINDER_DURATION_OPTIONS: ReminderDurationMinutes[] = ["10", "15", "30", "60"];

const REMINDER_FREQUENCY_OPTIONS: ReminderFrequency[] = ["daily", "weekdays", "weekly", "off"];
const REMINDER_FREQUENCY_LABEL_KEY: Record<ReminderFrequency, keyof typeof strings> = {
  daily: "prefFrequencyDaily",
  weekdays: "prefFrequencyWeekdays",
  weekly: "prefFrequencyWeekly",
  off: "prefFrequencyOff",
};

const SESSION_TIMEOUT_OPTIONS: SessionTimeoutMinutes[] = ["never", "15", "30", "60"];
const SESSION_TIMEOUT_LABEL_KEY: Record<SessionTimeoutMinutes, keyof typeof strings> = {
  never: "sessionTimeoutNever",
  "15": "sessionTimeout15",
  "30": "sessionTimeout30",
  "60": "sessionTimeout60",
};

function segmentedButtonClass(active: boolean): string {
  return `rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 ${
    active ? "bg-accent-soft text-accent" : "text-foreground-muted hover:text-foreground"
  }`;
}

// Shared arrow-key handler for the segmented "radiogroup" button rows below —
// moves focus between options the same way native radio buttons do.
function handleSegmentedKeyDown(e: React.KeyboardEvent, refs: (HTMLButtonElement | null)[]) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  e.preventDefault();
  const available = refs.filter(Boolean) as HTMLButtonElement[];
  if (available.length === 0) return;
  const currentIndex = available.findIndex((el) => el === document.activeElement);
  const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + dir + available.length) % available.length;
  available[nextIndex]?.focus();
}

// Fixed, decorative 6x6 grid standing in for a real 2FA QR code.
const MOCK_QR_PATTERN = [
  1, 1, 1, 0, 1, 1,
  1, 0, 1, 1, 0, 1,
  1, 1, 0, 1, 1, 0,
  0, 1, 1, 0, 1, 1,
  1, 0, 1, 1, 1, 0,
  1, 1, 0, 1, 0, 1,
] as const;

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">{title}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-b-0 last:pb-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-foreground-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function DangerButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
    >
      {children}
    </button>
  );
}

function ShortcutRow({ combo, label }: { combo: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm text-foreground-muted">{label}</span>
      <kbd className="rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-foreground-muted">
        {combo}
      </kbd>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-4 accent-accent"
    />
  );
}

function fieldClass(hasError?: boolean): string {
  return `w-full rounded-lg border ${
    hasError ? "border-danger" : "border-border"
  } bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint`;
}

function FieldError({ show, message, id }: { show?: boolean; message: string; id?: string }) {
  if (!show) return null;
  return (
    <p id={id} role="alert" className="text-xs text-danger">
      {message}
    </p>
  );
}

function PasswordField({
  lang,
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  hasError,
  errorMessage,
  autoComplete,
}: {
  lang: Lang;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  hasError?: boolean;
  errorMessage: string;
  autoComplete: "current-password" | "new-password";
}) {
  const errorId = useId();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground-muted">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`${fieldClass(hasError)} pr-9`}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={visible ? strings.hidePasswordLabel[lang] : strings.showPasswordLabel[lang]}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          {visible ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
        </button>
      </div>
      <FieldError show={hasError} message={errorMessage} id={errorId} />
    </label>
  );
}

function SuccessBlock({
  title,
  desc,
  doneLabel,
  onDone,
}: {
  title: string;
  desc: string;
  doneLabel: string;
  onDone: () => void;
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 size={24} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-foreground-muted">{desc}</p>
      </div>
      <button onClick={onDone} className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        {doneLabel}
      </button>
    </div>
  );
}

export function SettingsView({
  lang,
  onSetLang,
  themePreference,
  onSetThemePreference,
  chatLanguage,
  onChangeChatLanguage,
  notificationPreferences,
  onChangeNotificationPreference,
  accountPreferences,
  onChangeAccountPreferences,
}: {
  lang: Lang;
  onSetLang: (value: Lang) => void;
  themePreference: ThemePreference;
  onSetThemePreference: (value: ThemePreference) => void;
  chatLanguage: ChatLanguage;
  onChangeChatLanguage: (value: ChatLanguage) => void;
  notificationPreferences: NotificationPreferences;
  onChangeNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
  accountPreferences: AccountPreferences;
  onChangeAccountPreferences: (updater: (prev: AccountPreferences) => AccountPreferences) => void;
}) {
  const appearanceOptions: { value: ThemePreference; label: string }[] = [
    { value: "dark", label: strings.appearanceDark[lang] },
    { value: "light", label: strings.appearanceLight[lang] },
    { value: "system", label: strings.appearanceSystem[lang] },
  ];

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [deleteAccountSubmitted, setDeleteAccountSubmitted] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState("");
  const [deleteHistorySubmitted, setDeleteHistorySubmitted] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exportState, setExportState] = useState<ExportState>("selecting");
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<{ current?: boolean; next?: boolean; confirm?: boolean }>({});
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false });
  const [sessions, setSessions] = useState<MockSession[]>(() => seedSessions());
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<"enableSetup" | "enableSuccess" | "confirmDisable" | "disableSuccess">(
    "enableSetup"
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorCodeError, setTwoFactorCodeError] = useState(false);
  const twoFactorCodeErrorId = useId();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resetPreferencesSubmitted, setResetPreferencesSubmitted] = useState(false);
  const langRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const themeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const chatLangRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const aiStyleRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const durationRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const frequencyRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sessionTimeoutRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const pushToast = (title: string, description: string, icon: LucideIcon) => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, title, description, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const flashSaved = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("saving");
    saveTimerRef.current = setTimeout(() => {
      // The preference itself is already applied locally either way — this
      // only simulates the save confirmation failing to reach the server.
      setSaveState(Math.random() < SAVE_ERROR_RATE ? "error" : "saved");
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    }, 400);
  };

  const handleNotificationPreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    onChangeNotificationPreference(key, value);
    flashSaved();
  };

  const setAiResponseStyle = (value: AiResponseStyle) => {
    onChangeAccountPreferences((prev) => ({ ...prev, aiResponseStyle: value }));
    flashSaved();
  };
  const setStudyAssistance = (key: keyof StudyAssistancePreferences, value: boolean) => {
    onChangeAccountPreferences((prev) => ({ ...prev, studyAssistance: { ...prev.studyAssistance, [key]: value } }));
    flashSaved();
  };
  const setChatBehavior = (key: keyof ChatBehaviorPreferences, value: boolean) => {
    onChangeAccountPreferences((prev) => ({ ...prev, chatBehavior: { ...prev.chatBehavior, [key]: value } }));
    flashSaved();
  };
  const setStudyReminder = <K extends keyof StudyReminderPreferences>(key: K, value: StudyReminderPreferences[K]) => {
    onChangeAccountPreferences((prev) => ({ ...prev, studyReminders: { ...prev.studyReminders, [key]: value } }));
    flashSaved();
  };
  const setSessionTimeout = (value: SessionTimeoutMinutes) => {
    onChangeAccountPreferences((prev) => ({ ...prev, sessionTimeoutMinutes: value }));
    flashSaved();
  };
  const confirmResetPreferences = () => {
    onChangeAccountPreferences(() => defaultAccountPreferences);
    setResetPreferencesSubmitted(true);
  };

  const openModal = (modal: ActiveModal) => {
    if (modal === "deleteAccount") {
      setDeleteAccountSubmitted(false);
      setDeleteAccountConfirmText("");
    }
    if (modal === "deleteHistory") setDeleteHistorySubmitted(false);
    if (modal === "changePassword") {
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordErrors({});
      setPasswordSubmitted(false);
      setShowPassword({ current: false, next: false, confirm: false });
    }
    if (modal === "activeSessions") {
      setSessions(seedSessions());
      setConfirmSignOutAll(false);
    }
    if (modal === "resetPreferences") setResetPreferencesSubmitted(false);
    setActiveModal(modal);
  };

  const openExport = (kind: ExportKind) => {
    setExportKind(kind);
    setExportFormat("json");
    setExportState("selecting");
  };

  const runExport = () => {
    setExportState("exporting");
    setTimeout(() => {
      setExportState(Math.random() < EXPORT_ERROR_RATE ? "error" : "success");
    }, 900);
  };

  const submitPasswordChange = () => {
    const errors = {
      current: passwordForm.current.trim() === "",
      next: passwordForm.next.trim().length < 6,
      confirm: passwordForm.confirm.trim() === "" || passwordForm.confirm !== passwordForm.next,
    };
    setPasswordErrors(errors);
    if (errors.current || errors.next || errors.confirm) return;
    setPasswordSubmitted(true);
    setPasswordForm({ current: "", next: "", confirm: "" });
  };

  const signOutSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    pushToast(strings.accountSafetySignedOutToastTitle[lang], strings.accountSafetySignedOutToastDesc[lang], LogOut);
  };

  const signOutAllOthers = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    pushToast(strings.accountSafetySignedOutAllToastTitle[lang], "", LogOut);
  };

  const toggleTwoFactor = () => {
    setTwoFactorStep(twoFactorEnabled ? "confirmDisable" : "enableSetup");
    setTwoFactorCode("");
    setTwoFactorCodeError(false);
    setActiveModal("twoFactor");
  };

  const confirmEnableTwoFactor = () => {
    const invalid = twoFactorCode.trim().length !== 6;
    setTwoFactorCodeError(invalid);
    if (invalid) return;
    setTwoFactorEnabled(true);
    setTwoFactorStep("enableSuccess");
  };

  const confirmDisableTwoFactor = () => {
    setTwoFactorEnabled(false);
    setTwoFactorStep("disableSuccess");
  };

  const sessionsDesc =
    lang === "en"
      ? `${sessions.length} active session${sessions.length === 1 ? "" : "s"}`
      : `${toBengaliDigits(sessions.length)}টি সক্রিয় সেশন`;

  const activeLegalDoc = activeModal && isLegalDocId(activeModal) ? legalDocuments[activeModal] : null;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.settingsPageTitle[lang]}</h1>
            <p className="mt-1 text-sm text-foreground-muted">{strings.settingsPageSubtitle[lang]}</p>
          </div>
          <AnimatePresence mode="wait">
            {saveState !== "idle" && (
              <motion.span
                key={saveState}
                role={saveState === "error" ? "alert" : "status"}
                aria-live="polite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: EASE }}
                className={`mt-1 shrink-0 text-[11px] ${saveState === "error" ? "text-danger" : "text-foreground-faint"}`}
              >
                {saveState === "saving"
                  ? strings.noteSaving[lang]
                  : saveState === "error"
                  ? strings.settingsSaveFailedLabel[lang]
                  : strings.noteSaved[lang]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <SettingsSection title={strings.settingsSectionGeneral[lang]}>
          <SettingsRow label={strings.languageLabel[lang]}>
            <div role="radiogroup" aria-label={strings.languageLabel[lang]} className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
              {LANGUAGE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  ref={(el) => {
                    langRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={lang === opt.value}
                  tabIndex={lang === opt.value ? 0 : -1}
                  onClick={() => onSetLang(opt.value)}
                  onKeyDown={(e) => handleSegmentedKeyDown(e, langRefs.current)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 ${
                    lang === opt.value
                      ? "bg-accent-soft text-accent"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow label={strings.settingsAppearanceLabel[lang]} description={strings.settingsAppearanceDesc[lang]}>
            <div role="radiogroup" aria-label={strings.settingsAppearanceLabel[lang]} className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
              {appearanceOptions.map((opt, i) => (
                <button
                  key={opt.value}
                  ref={(el) => {
                    themeRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={themePreference === opt.value}
                  tabIndex={themePreference === opt.value ? 0 : -1}
                  onClick={() => onSetThemePreference(opt.value)}
                  onKeyDown={(e) => handleSegmentedKeyDown(e, themeRefs.current)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 ${
                    themePreference === opt.value
                      ? "bg-accent-soft text-accent"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingsRow>
          <SettingsRow
            label={strings.settingsChatPreferencesLabel[lang]}
            description={strings.settingsChatPreferencesDesc[lang]}
          >
            <div role="radiogroup" aria-label={strings.settingsChatPreferencesLabel[lang]} className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
              {CHAT_LANGUAGE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.value}
                  ref={(el) => {
                    chatLangRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={chatLanguage === opt.value}
                  tabIndex={chatLanguage === opt.value ? 0 : -1}
                  onClick={() => onChangeChatLanguage(opt.value)}
                  onKeyDown={(e) => handleSegmentedKeyDown(e, chatLangRefs.current)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150 ${
                    chatLanguage === opt.value
                      ? "bg-accent-soft text-accent"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingsRow>
          <div className="pt-3.5">
            <p className="text-sm font-medium">{strings.settingsKeyboardShortcutsLabel[lang]}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{strings.settingsKeyboardShortcutsDesc[lang]}</p>
            <div className="mt-2.5 flex flex-col">
              <ShortcutRow combo="Ctrl / Cmd + K" label={strings.shortcutOpenSearch[lang]} />
              <ShortcutRow combo="Ctrl / Cmd + N" label={strings.shortcutNewChat[lang]} />
              <ShortcutRow combo="Ctrl / Cmd + Shift + N" label={strings.shortcutNewNote[lang]} />
              <ShortcutRow combo="Ctrl / Cmd + Enter" label={strings.shortcutSendMessage[lang]} />
              <ShortcutRow combo="Esc" label={strings.shortcutCloseModal[lang]} />
              <ShortcutRow combo="Ctrl / Cmd + /" label={strings.shortcutShowShortcuts[lang]} />
            </div>
          </div>

          <div className="pt-3.5">
            <p className="text-sm font-medium">{strings.prefSectionLabel[lang]}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{strings.prefSectionDesc[lang]}</p>

            <div className="mt-2.5 flex flex-col">
              <p className="pb-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.prefGroupAiStyle[lang]}
              </p>
              <SettingsRow label={strings.prefAiResponseStyleLabel[lang]}>
                <div role="radiogroup" aria-label={strings.prefAiResponseStyleLabel[lang]} className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
                  {AI_RESPONSE_STYLE_OPTIONS.map((opt, i) => (
                    <button
                      key={opt}
                      ref={(el) => {
                        aiStyleRefs.current[i] = el;
                      }}
                      role="radio"
                      aria-checked={accountPreferences.aiResponseStyle === opt}
                      tabIndex={accountPreferences.aiResponseStyle === opt ? 0 : -1}
                      onClick={() => setAiResponseStyle(opt)}
                      onKeyDown={(e) => handleSegmentedKeyDown(e, aiStyleRefs.current)}
                      className={segmentedButtonClass(accountPreferences.aiResponseStyle === opt)}
                    >
                      {strings[AI_RESPONSE_STYLE_LABEL_KEY[opt]][lang]}
                    </button>
                  ))}
                </div>
              </SettingsRow>

              <p className="pb-1 pt-3 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.prefGroupStudyAssistance[lang]}
              </p>
              <SettingsRow label={strings.prefAutoExplainLabel[lang]}>
                <Toggle
                  checked={accountPreferences.studyAssistance.autoExplainConcepts}
                  onChange={(v) => setStudyAssistance("autoExplainConcepts", v)}
                />
              </SettingsRow>
              <SettingsRow label={strings.prefGiveExamplesLabel[lang]}>
                <Toggle
                  checked={accountPreferences.studyAssistance.giveExamples}
                  onChange={(v) => setStudyAssistance("giveExamples", v)}
                />
              </SettingsRow>
              <SettingsRow label={strings.prefStepByStepLabel[lang]}>
                <Toggle
                  checked={accountPreferences.studyAssistance.stepByStepSolutions}
                  onChange={(v) => setStudyAssistance("stepByStepSolutions", v)}
                />
              </SettingsRow>
              <SettingsRow label={strings.prefAskBeforeAnswersLabel[lang]}>
                <Toggle
                  checked={accountPreferences.studyAssistance.askBeforeRevealingAnswers}
                  onChange={(v) => setStudyAssistance("askBeforeRevealingAnswers", v)}
                />
              </SettingsRow>

              <p className="pb-1 pt-3 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.prefGroupChatBehavior[lang]}
              </p>
              <SettingsRow label={strings.prefAutoScrollLabel[lang]}>
                <Toggle
                  checked={accountPreferences.chatBehavior.autoScroll}
                  onChange={(v) => setChatBehavior("autoScroll", v)}
                />
              </SettingsRow>
              <SettingsRow label={strings.prefEnterToSendLabel[lang]}>
                <Toggle
                  checked={accountPreferences.chatBehavior.enterToSend}
                  onChange={(v) => setChatBehavior("enterToSend", v)}
                />
              </SettingsRow>
              <SettingsRow label={strings.prefShowTimestampsLabel[lang]}>
                <Toggle
                  checked={accountPreferences.chatBehavior.showTimestamps}
                  onChange={(v) => setChatBehavior("showTimestamps", v)}
                />
              </SettingsRow>
              <SettingsRow label={strings.prefSaveChatHistoryLabel[lang]}>
                <Toggle
                  checked={accountPreferences.chatBehavior.saveChatHistory}
                  onChange={(v) => setChatBehavior("saveChatHistory", v)}
                />
              </SettingsRow>

              <p className="pb-1 pt-3 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.prefGroupStudyReminders[lang]}
              </p>
              <SettingsRow label={strings.prefReminderDurationLabel[lang]}>
                <div role="radiogroup" aria-label={strings.prefReminderDurationLabel[lang]} className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1 sm:grid-cols-4">
                  {REMINDER_DURATION_OPTIONS.map((opt, i) => (
                    <button
                      key={opt}
                      ref={(el) => {
                        durationRefs.current[i] = el;
                      }}
                      role="radio"
                      aria-checked={accountPreferences.studyReminders.defaultDurationMinutes === opt}
                      tabIndex={accountPreferences.studyReminders.defaultDurationMinutes === opt ? 0 : -1}
                      onClick={() => setStudyReminder("defaultDurationMinutes", opt)}
                      onKeyDown={(e) => handleSegmentedKeyDown(e, durationRefs.current)}
                      className={segmentedButtonClass(accountPreferences.studyReminders.defaultDurationMinutes === opt)}
                    >
                      {lang === "en" ? opt : toBengaliDigits(Number(opt))} {strings.minutesShort[lang]}
                    </button>
                  ))}
                </div>
              </SettingsRow>
              <SettingsRow label={strings.prefReminderTimeLabel[lang]}>
                <input
                  type="time"
                  value={accountPreferences.studyReminders.preferredTime}
                  onChange={(e) => setStudyReminder("preferredTime", e.target.value)}
                  className="rounded-lg border border-border bg-control px-2.5 py-1.5 text-sm outline-none transition-colors duration-150 focus:border-foreground-faint"
                />
              </SettingsRow>
              <SettingsRow label={strings.prefReminderFrequencyLabel[lang]}>
                <div role="radiogroup" aria-label={strings.prefReminderFrequencyLabel[lang]} className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1 sm:grid-cols-4">
                  {REMINDER_FREQUENCY_OPTIONS.map((opt, i) => (
                    <button
                      key={opt}
                      ref={(el) => {
                        frequencyRefs.current[i] = el;
                      }}
                      role="radio"
                      aria-checked={accountPreferences.studyReminders.frequency === opt}
                      tabIndex={accountPreferences.studyReminders.frequency === opt ? 0 : -1}
                      onClick={() => setStudyReminder("frequency", opt)}
                      onKeyDown={(e) => handleSegmentedKeyDown(e, frequencyRefs.current)}
                      className={segmentedButtonClass(accountPreferences.studyReminders.frequency === opt)}
                    >
                      {strings[REMINDER_FREQUENCY_LABEL_KEY[opt]][lang]}
                    </button>
                  ))}
                </div>
              </SettingsRow>
            </div>

            <div className="mt-3.5 flex items-center justify-between gap-4 border-t border-border pt-3.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{strings.prefResetLabel[lang]}</p>
                <p className="mt-0.5 text-xs text-foreground-muted">{strings.prefResetDesc[lang]}</p>
              </div>
              <OutlineButton onClick={() => openModal("resetPreferences")}>{strings.prefResetBtn[lang]}</OutlineButton>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionNotifications[lang]}>
          <SettingsRow label={strings.settingsStudyRemindersLabel[lang]} description={strings.settingsStudyRemindersDesc[lang]}>
            <Toggle
              checked={notificationPreferences.studyReminders}
              onChange={(v) => handleNotificationPreferenceChange("studyReminders", v)}
            />
          </SettingsRow>
          <SettingsRow label={strings.settingsExamRemindersLabel[lang]} description={strings.settingsExamRemindersDesc[lang]}>
            <Toggle
              checked={notificationPreferences.examReminders}
              onChange={(v) => handleNotificationPreferenceChange("examReminders", v)}
            />
          </SettingsRow>
          <SettingsRow
            label={strings.settingsAiRecommendationsLabel[lang]}
            description={strings.settingsAiRecommendationsDesc[lang]}
          >
            <Toggle
              checked={notificationPreferences.aiRecommendations}
              onChange={(v) => handleNotificationPreferenceChange("aiRecommendations", v)}
            />
          </SettingsRow>
          <SettingsRow
            label={strings.settingsScheduleRemindersLabel[lang]}
            description={strings.settingsScheduleRemindersDesc[lang]}
          >
            <Toggle
              checked={notificationPreferences.scheduleReminders}
              onChange={(v) => handleNotificationPreferenceChange("scheduleReminders", v)}
            />
          </SettingsRow>
          <SettingsRow
            label={strings.settingsSystemNotificationsLabel[lang]}
            description={strings.settingsSystemNotificationsDesc[lang]}
          >
            <Toggle
              checked={notificationPreferences.systemNotifications}
              onChange={(v) => handleNotificationPreferenceChange("systemNotifications", v)}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionPrivacy[lang]}>
          <SettingsRow label={strings.settingsChangePasswordBtn[lang]} description={strings.settingsPasswordDesc[lang]}>
            <OutlineButton onClick={() => openModal("changePassword")}>{strings.settingsChangePasswordBtn[lang]}</OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsActiveSessionsLabel[lang]} description={sessionsDesc}>
            <OutlineButton onClick={() => openModal("activeSessions")}>{strings.settingsManageSessionsBtn[lang]}</OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsLoginActivityLabel[lang]} description={strings.settingsLoginActivityDesc[lang]}>
            <OutlineButton onClick={() => openModal("loginActivity")}>{strings.settingsViewBtn[lang]}</OutlineButton>
          </SettingsRow>
          <SettingsRow
            label={strings.settingsTwoFactorLabel[lang]}
            description={twoFactorEnabled ? strings.accountSafetyTwoFactorEnabledDesc[lang] : strings.settingsTwoFactorDesc[lang]}
          >
            <OutlineButton onClick={toggleTwoFactor}>
              {twoFactorEnabled ? strings.settingsDisableBtn[lang] : strings.settingsEnableBtn[lang]}
            </OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsSessionTimeoutLabel[lang]} description={strings.settingsSessionTimeoutDesc[lang]}>
            <div
              role="radiogroup"
              aria-label={strings.settingsSessionTimeoutLabel[lang]}
              className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1 sm:grid-cols-4"
            >
              {SESSION_TIMEOUT_OPTIONS.map((opt, i) => (
                <button
                  key={opt}
                  ref={(el) => {
                    sessionTimeoutRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={accountPreferences.sessionTimeoutMinutes === opt}
                  tabIndex={accountPreferences.sessionTimeoutMinutes === opt ? 0 : -1}
                  onClick={() => setSessionTimeout(opt)}
                  onKeyDown={(e) => handleSegmentedKeyDown(e, sessionTimeoutRefs.current)}
                  className={segmentedButtonClass(accountPreferences.sessionTimeoutMinutes === opt)}
                >
                  {strings[SESSION_TIMEOUT_LABEL_KEY[opt]][lang]}
                </button>
              ))}
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionData[lang]}>
          <SettingsRow label={strings.settingsExportChatsBtn[lang]}>
            <OutlineButton onClick={() => openExport("chats")}>
              <span className="flex items-center gap-1.5">
                <Download size={12} strokeWidth={1.75} />
                {strings.settingsExportChatsBtn[lang]}
              </span>
            </OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsExportNotesBtn[lang]}>
            <OutlineButton onClick={() => openExport("notes")}>
              <span className="flex items-center gap-1.5">
                <Download size={12} strokeWidth={1.75} />
                {strings.settingsExportNotesBtn[lang]}
              </span>
            </OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsExportStudyHistoryBtn[lang]}>
            <OutlineButton onClick={() => openExport("studyHistory")}>
              <span className="flex items-center gap-1.5">
                <Download size={12} strokeWidth={1.75} />
                {strings.settingsExportStudyHistoryBtn[lang]}
              </span>
            </OutlineButton>
          </SettingsRow>
          <SettingsRow
            label={strings.settingsDeleteHistoryLabel[lang]}
            description={strings.settingsDeleteHistoryDesc[lang]}
          >
            <DangerButton onClick={() => openModal("deleteHistory")}>
              <span className="flex items-center gap-1.5">
                <Trash2 size={12} strokeWidth={1.75} />
                {strings.settingsDeleteHistoryBtn[lang]}
              </span>
            </DangerButton>
          </SettingsRow>
          <SettingsRow
            label={strings.settingsDeleteAccountLabel[lang]}
            description={strings.settingsDeleteAccountDesc[lang]}
          >
            <DangerButton onClick={() => openModal("deleteAccount")}>
              <span className="flex items-center gap-1.5">
                <Trash2 size={12} strokeWidth={1.75} />
                {strings.settingsDeleteAccountBtn[lang]}
              </span>
            </DangerButton>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionLegal[lang]}>
          {LEGAL_DOC_IDS.map((id) => (
            <SettingsRow key={id} label={legalDocuments[id].title[lang]}>
              <OutlineButton onClick={() => openModal(id)}>{strings.helpOpenBtn[lang]}</OutlineButton>
            </SettingsRow>
          ))}
        </SettingsSection>
      </div>

      <AnimatePresence>
        {activeModal === "deleteHistory" && (
          <Modal title={strings.settingsDeleteHistoryConfirmTitle[lang]} onClose={() => setActiveModal(null)}>
            {deleteHistorySubmitted ? (
              <SuccessBlock
                title={strings.deletedHistoryToastTitle[lang]}
                desc={strings.deletedHistoryToastDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.settingsDeleteHistoryConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={() => setDeleteHistorySubmitted(true)}
                    className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
                  >
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {activeModal === "deleteAccount" && (
          <Modal title={strings.settingsDeleteAccountConfirmTitle[lang]} onClose={() => setActiveModal(null)}>
            {deleteAccountSubmitted ? (
              <SuccessBlock
                title={strings.deletedAccountToastTitle[lang]}
                desc={strings.deletedAccountToastDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.settingsDeleteAccountConfirmDesc[lang]}</p>
                <label className="mt-4 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.settingsDeleteAccountTypeLabel[lang]}
                  </span>
                  <input
                    value={deleteAccountConfirmText}
                    onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className={fieldClass(false)}
                  />
                </label>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={() => setDeleteAccountSubmitted(true)}
                    disabled={deleteAccountConfirmText !== "DELETE"}
                    className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                  >
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {exportKind && (
          <Modal title={strings[EXPORT_TITLE_KEY[exportKind]][lang]} onClose={() => setExportKind(null)}>
            {exportState === "success" ? (
              <SuccessBlock
                title={strings.settingsExportSuccessTitle[lang]}
                desc={strings.settingsExportSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setExportKind(null)}
              />
            ) : exportState === "error" ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
                  <AlertCircle size={24} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{strings.settingsExportErrorTitle[lang]}</p>
                  <p className="mt-1 text-xs text-foreground-muted">{strings.settingsExportErrorDesc[lang]}</p>
                </div>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => setExportKind(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={runExport}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                  >
                    {strings.retryBtn[lang]}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {strings.settingsExportFormatLabel[lang]}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {EXPORT_FORMATS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportFormat(f)}
                      disabled={exportState === "exporting"}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 disabled:opacity-40 ${
                        exportFormat === f
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-border text-foreground-muted hover:border-accent hover:text-foreground"
                      }`}
                    >
                      {strings[EXPORT_FORMAT_LABEL_KEY[f]][lang]}
                    </button>
                  ))}
                </div>
                {exportState === "exporting" ? (
                  <div className="mt-4 flex items-center justify-center gap-2 py-2 text-xs text-foreground-muted">
                    <span className="size-1.5 animate-pulse rounded-full bg-foreground-faint" />
                    {strings.settingsExportingLabel[lang]}
                  </div>
                ) : (
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setExportKind(null)}
                      className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      {strings.cancelBtn[lang]}
                    </button>
                    <button
                      onClick={runExport}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                    >
                      <Download size={13} strokeWidth={1.75} />
                      {strings.settingsExportBtn[lang]}
                    </button>
                  </div>
                )}
              </>
            )}
          </Modal>
        )}

        {activeModal === "resetPreferences" && (
          <Modal title={strings.prefResetConfirmTitle[lang]} onClose={() => setActiveModal(null)}>
            {resetPreferencesSubmitted ? (
              <SuccessBlock
                title={strings.prefResetSuccessTitle[lang]}
                desc={strings.prefResetSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.prefResetConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={confirmResetPreferences}
                    className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
                  >
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {activeModal === "changePassword" && (
          <Modal title={strings.settingsChangePasswordBtn[lang]} onClose={() => setActiveModal(null)}>
            {passwordSubmitted ? (
              <SuccessBlock
                title={strings.accountSafetyPasswordUpdatedTitle[lang]}
                desc={strings.accountSafetyPasswordUpdatedDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <PasswordField
                  lang={lang}
                  label={strings.accountSafetyCurrentPasswordLabel[lang]}
                  value={passwordForm.current}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, current: v }))}
                  visible={showPassword.current}
                  onToggleVisible={() => setShowPassword((s) => ({ ...s, current: !s.current }))}
                  hasError={passwordErrors.current}
                  errorMessage={strings.helpFieldRequiredError[lang]}
                  autoComplete="current-password"
                />
                <PasswordField
                  lang={lang}
                  label={strings.accountSafetyNewPasswordLabel[lang]}
                  value={passwordForm.next}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, next: v }))}
                  visible={showPassword.next}
                  onToggleVisible={() => setShowPassword((s) => ({ ...s, next: !s.next }))}
                  hasError={passwordErrors.next}
                  errorMessage={strings.accountSafetyPasswordTooShortError[lang]}
                  autoComplete="new-password"
                />
                <PasswordField
                  lang={lang}
                  label={strings.accountSafetyConfirmPasswordLabel[lang]}
                  value={passwordForm.confirm}
                  onChange={(v) => setPasswordForm((f) => ({ ...f, confirm: v }))}
                  visible={showPassword.confirm}
                  onToggleVisible={() => setShowPassword((s) => ({ ...s, confirm: !s.confirm }))}
                  hasError={passwordErrors.confirm}
                  errorMessage={strings.accountSafetyPasswordMismatchError[lang]}
                  autoComplete="new-password"
                />
                <button
                  onClick={submitPasswordChange}
                  className="mt-1 self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                >
                  {strings.saveBtn[lang]}
                </button>
              </div>
            )}
          </Modal>
        )}

        {activeModal === "activeSessions" && (
          <Modal title={strings.settingsActiveSessionsLabel[lang]} onClose={() => setActiveModal(null)}>
            {confirmSignOutAll ? (
              <>
                <p className="text-sm text-foreground-muted">{strings.accountSafetySignOutAllConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmSignOutAll(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={() => {
                      signOutAllOthers();
                      setConfirmSignOutAll(false);
                    }}
                    className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
                  >
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
                          <Laptop size={14} strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {s.isCurrent ? strings.accountSafetyCurrentSessionLabel[lang] : `${s.device} · ${s.browser}`}
                          </p>
                          <p className="truncate text-xs text-foreground-muted">
                            {s.isCurrent
                              ? `${s.device} · ${s.browser} · ${s.location}`
                              : `${s.location} · ${s.lastActive[lang]}`}
                          </p>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => signOutSession(s.id)}
                          className="shrink-0 text-xs font-medium text-danger transition-opacity duration-150 hover:opacity-75"
                        >
                          {strings.accountSafetySignOutBtn[lang]}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {sessions.length > 1 ? (
                  <button
                    onClick={() => setConfirmSignOutAll(true)}
                    className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.accountSafetySignOutAllOthersBtn[lang]}
                  </button>
                ) : (
                  <p className="mt-4 text-center text-xs text-foreground-muted">{strings.accountSafetyNoOtherSessionsDesc[lang]}</p>
                )}
              </>
            )}
          </Modal>
        )}

        {activeModal === "loginActivity" && (
          <Modal title={strings.settingsLoginActivityLabel[lang]} onClose={() => setActiveModal(null)}>
            <div className="flex flex-col">
              {loginActivity.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0 last:pb-0">
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      ev.status === "failed" ? "bg-danger/15 text-danger" : "bg-surface-muted text-foreground-muted"
                    }`}
                  >
                    <History size={14} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ev.status === "failed" ? strings.accountSafetyLoginFailedLabel[lang] : strings.accountSafetyLoginSuccessLabel[lang]}
                      {" · "}
                      {ev.device} · {ev.browser}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-foreground-muted">
                      {ev.location} · {ev.time[lang]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {activeModal === "twoFactor" && (
          <Modal title={strings.settingsTwoFactorLabel[lang]} onClose={() => setActiveModal(null)}>
            {twoFactorStep === "enableSetup" && (
              <>
                <p className="text-sm text-foreground-muted">{strings.accountSafetyTwoFactorModalDesc[lang]}</p>
                <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-muted p-5">
                  <div className="grid grid-cols-6 gap-1 rounded-lg bg-surface p-3">
                    {MOCK_QR_PATTERN.map((filled, i) => (
                      <span key={i} className={`size-3 rounded-xs ${filled ? "bg-foreground-strong" : "bg-transparent"}`} />
                    ))}
                  </div>
                  <p className="text-center text-xs text-foreground-muted">{strings.accountSafetyTwoFactorScanLabel[lang]}</p>
                </div>
                <label className="mt-4 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.accountSafetyTwoFactorCodeLabel[lang]}</span>
                  <input
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    aria-invalid={twoFactorCodeError || undefined}
                    aria-describedby={twoFactorCodeError ? twoFactorCodeErrorId : undefined}
                    className={fieldClass(twoFactorCodeError)}
                  />
                  <FieldError
                    show={twoFactorCodeError}
                    message={strings.accountSafetyTwoFactorCodeError[lang]}
                    id={twoFactorCodeErrorId}
                  />
                </label>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={confirmEnableTwoFactor}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                  >
                    {strings.accountSafetyTwoFactorVerifyBtn[lang]}
                  </button>
                </div>
              </>
            )}
            {twoFactorStep === "enableSuccess" && (
              <SuccessBlock
                title={strings.accountSafetyTwoFactorEnabledToastTitle[lang]}
                desc={strings.accountSafetyTwoFactorEnabledDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            )}
            {twoFactorStep === "confirmDisable" && (
              <>
                <p className="text-sm text-foreground-muted">{strings.accountSafetyTwoFactorDisableConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={confirmDisableTwoFactor}
                    className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
                  >
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
            {twoFactorStep === "disableSuccess" && (
              <SuccessBlock
                title={strings.accountSafetyTwoFactorDisabledToastTitle[lang]}
                desc={strings.accountSafetyTwoFactorDisabledDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            )}
          </Modal>
        )}

        {activeLegalDoc && (
          <Modal title={activeLegalDoc.title[lang]} onClose={() => setActiveModal(null)}>
            <p className="mb-4 text-xs text-foreground-faint">
              {strings.legalLastUpdatedLabel[lang]}: {activeLegalDoc.lastUpdated[lang]}
            </p>
            <div className="flex flex-col gap-4">
              {activeLegalDoc.sections.map((s) => (
                <div key={s.heading[lang]}>
                  <p className="text-sm font-semibold">{s.heading[lang]}</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{s.body[lang]}</p>
                </div>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} />
    </div>
  );
}
