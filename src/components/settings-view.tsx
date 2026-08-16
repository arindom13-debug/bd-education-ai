"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Trash2,
  Laptop,
  History,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { ToastStack, type ToastItem } from "@/components/toast";
import { strings, type Lang } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { ChatLanguage } from "@/lib/chat-language";
import type { NotificationPreferences } from "@/lib/notifications-data";
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
  | LegalDocId
  | null;

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
      className="whitespace-nowrap rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function DangerButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
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

function FieldError({ show, message }: { show?: boolean; message: string }) {
  if (!show) return null;
  return <p className="text-xs text-danger">{message}</p>;
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
    <div className="flex flex-col items-center gap-3 py-4 text-center">
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
}: {
  lang: Lang;
  onSetLang: (value: Lang) => void;
  themePreference: ThemePreference;
  onSetThemePreference: (value: ThemePreference) => void;
  chatLanguage: ChatLanguage;
  onChangeChatLanguage: (value: ChatLanguage) => void;
  notificationPreferences: NotificationPreferences;
  onChangeNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
}) {
  const appearanceOptions: { value: ThemePreference; label: string }[] = [
    { value: "dark", label: strings.appearanceDark[lang] },
    { value: "light", label: strings.appearanceLight[lang] },
    { value: "system", label: strings.appearanceSystem[lang] },
  ];

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [deleteAccountSubmitted, setDeleteAccountSubmitted] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<{ current?: boolean; next?: boolean; confirm?: boolean }>({});
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [sessions, setSessions] = useState<MockSession[]>(() => seedSessions());
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushToast = (title: string, description: string, icon: LucideIcon) => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, title, description, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const flashSaved = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState("saving");
    saveTimerRef.current = setTimeout(() => {
      setSaveState("saved");
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 1500);
    }, 400);
  };

  const handleNotificationPreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    onChangeNotificationPreference(key, value);
    flashSaved();
  };

  const notifyExport = () => pushToast(strings.exportStartedToastTitle[lang], strings.exportStartedToastDesc[lang], Download);

  const openModal = (modal: ActiveModal) => {
    if (modal === "deleteAccount") setDeleteAccountSubmitted(false);
    if (modal === "changePassword") {
      setPasswordForm({ current: "", next: "", confirm: "" });
      setPasswordErrors({});
      setPasswordSubmitted(false);
    }
    if (modal === "activeSessions") setSessions(seedSessions());
    setActiveModal(modal);
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
    if (twoFactorEnabled) {
      setTwoFactorEnabled(false);
      pushToast(strings.accountSafetyTwoFactorDisabledToastTitle[lang], "", ShieldCheck);
      return;
    }
    setActiveModal("twoFactor");
  };

  const confirmEnableTwoFactor = () => {
    setTwoFactorEnabled(true);
    setActiveModal(null);
    pushToast(strings.accountSafetyTwoFactorEnabledToastTitle[lang], "", ShieldCheck);
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="mt-1 shrink-0 text-[11px] text-foreground-faint"
              >
                {saveState === "saving" ? strings.noteSaving[lang] : strings.noteSaved[lang]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <SettingsSection title={strings.settingsSectionGeneral[lang]}>
          <SettingsRow label={strings.languageLabel[lang]}>
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSetLang(opt.value)}
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
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
              {appearanceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSetThemePreference(opt.value)}
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
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-border p-1">
              {CHAT_LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChangeChatLanguage(opt.value)}
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
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionData[lang]}>
          <SettingsRow label={strings.settingsExportChatsBtn[lang]}>
            <OutlineButton onClick={notifyExport}>
              <span className="flex items-center gap-1.5">
                <Download size={12} strokeWidth={1.75} />
                {strings.settingsExportChatsBtn[lang]}
              </span>
            </OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsExportNotesBtn[lang]}>
            <OutlineButton onClick={notifyExport}>
              <span className="flex items-center gap-1.5">
                <Download size={12} strokeWidth={1.75} />
                {strings.settingsExportNotesBtn[lang]}
              </span>
            </OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsExportStudyHistoryBtn[lang]}>
            <OutlineButton onClick={notifyExport}>
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
        {(activeModal === "deleteHistory" || activeModal === "deleteAccount") && (
          <Modal
            title={
              activeModal === "deleteHistory"
                ? strings.settingsDeleteHistoryConfirmTitle[lang]
                : strings.settingsDeleteAccountConfirmTitle[lang]
            }
            onClose={() => setActiveModal(null)}
          >
            {activeModal === "deleteAccount" && deleteAccountSubmitted ? (
              <SuccessBlock
                title={strings.deletedAccountToastTitle[lang]}
                desc={strings.deletedAccountToastDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">
                  {activeModal === "deleteHistory"
                    ? strings.settingsDeleteHistoryConfirmDesc[lang]
                    : strings.settingsDeleteAccountConfirmDesc[lang]}
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={() => {
                      if (activeModal === "deleteHistory") {
                        pushToast(strings.deletedHistoryToastTitle[lang], strings.deletedHistoryToastDesc[lang], Trash2);
                        setActiveModal(null);
                      } else {
                        setDeleteAccountSubmitted(true);
                      }
                    }}
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
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.accountSafetyCurrentPasswordLabel[lang]}</span>
                  <input
                    type="password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))}
                    className={fieldClass(passwordErrors.current)}
                  />
                  <FieldError show={passwordErrors.current} message={strings.helpFieldRequiredError[lang]} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.accountSafetyNewPasswordLabel[lang]}</span>
                  <input
                    type="password"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                    className={fieldClass(passwordErrors.next)}
                  />
                  <FieldError show={passwordErrors.next} message={strings.accountSafetyPasswordTooShortError[lang]} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.accountSafetyConfirmPasswordLabel[lang]}</span>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                    className={fieldClass(passwordErrors.confirm)}
                  />
                  <FieldError show={passwordErrors.confirm} message={strings.accountSafetyPasswordMismatchError[lang]} />
                </label>
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
                        {s.isCurrent ? `${s.device} · ${s.browser}` : s.lastActive[lang]}
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
                onClick={signOutAllOthers}
                className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.accountSafetySignOutAllOthersBtn[lang]}
              </button>
            ) : (
              <p className="mt-4 text-center text-xs text-foreground-muted">{strings.accountSafetyNoOtherSessionsDesc[lang]}</p>
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
            <p className="text-sm text-foreground-muted">{strings.accountSafetyTwoFactorModalDesc[lang]}</p>
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
                {strings.settingsEnableBtn[lang]}
              </button>
            </div>
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
