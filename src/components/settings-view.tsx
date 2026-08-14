"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Lock, Download, Trash2, type LucideIcon } from "lucide-react";
import { Modal } from "@/components/modal";
import { ToastStack, type ToastItem } from "@/components/toast";
import { strings, type Lang } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { ChatLanguage } from "@/lib/chat-language";

const LANGUAGE_OPTIONS: { value: Lang; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
];

const CHAT_LANGUAGE_OPTIONS: { value: ChatLanguage; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
];

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

export function SettingsView({
  lang,
  onSetLang,
  themePreference,
  onSetThemePreference,
  chatLanguage,
  onChangeChatLanguage,
}: {
  lang: Lang;
  onSetLang: (value: Lang) => void;
  themePreference: ThemePreference;
  onSetThemePreference: (value: ThemePreference) => void;
  chatLanguage: ChatLanguage;
  onChangeChatLanguage: (value: ChatLanguage) => void;
}) {
  const appearanceOptions: { value: ThemePreference; label: string }[] = [
    { value: "dark", label: strings.appearanceDark[lang] },
    { value: "light", label: strings.appearanceLight[lang] },
    { value: "system", label: strings.appearanceSystem[lang] },
  ];

  const [notifications, setNotifications] = useState({
    studyReminders: true,
    examReminders: true,
    aiRecommendations: true,
    systemNotifications: false,
  });
  const [confirming, setConfirming] = useState<"deleteHistory" | "deleteAccount" | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (title: string, description: string, icon: LucideIcon) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const notifyComingSoon = () => pushToast(strings.comingSoonToastTitle[lang], strings.comingSoonToastDesc[lang], Lock);
  const notifyExport = () => pushToast(strings.exportStartedToastTitle[lang], strings.exportStartedToastDesc[lang], Download);

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.settingsPageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.settingsPageSubtitle[lang]}</p>
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
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionNotifications[lang]}>
          <SettingsRow label={strings.settingsStudyRemindersLabel[lang]} description={strings.settingsStudyRemindersDesc[lang]}>
            <Toggle
              checked={notifications.studyReminders}
              onChange={(v) => setNotifications((prev) => ({ ...prev, studyReminders: v }))}
            />
          </SettingsRow>
          <SettingsRow label={strings.settingsExamRemindersLabel[lang]} description={strings.settingsExamRemindersDesc[lang]}>
            <Toggle
              checked={notifications.examReminders}
              onChange={(v) => setNotifications((prev) => ({ ...prev, examReminders: v }))}
            />
          </SettingsRow>
          <SettingsRow
            label={strings.settingsAiRecommendationsLabel[lang]}
            description={strings.settingsAiRecommendationsDesc[lang]}
          >
            <Toggle
              checked={notifications.aiRecommendations}
              onChange={(v) => setNotifications((prev) => ({ ...prev, aiRecommendations: v }))}
            />
          </SettingsRow>
          <SettingsRow
            label={strings.settingsSystemNotificationsLabel[lang]}
            description={strings.settingsSystemNotificationsDesc[lang]}
          >
            <Toggle
              checked={notifications.systemNotifications}
              onChange={(v) => setNotifications((prev) => ({ ...prev, systemNotifications: v }))}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title={strings.settingsSectionPrivacy[lang]}>
          <SettingsRow label={strings.settingsChangePasswordBtn[lang]} description={strings.settingsPasswordDesc[lang]}>
            <OutlineButton onClick={notifyComingSoon}>{strings.settingsChangePasswordBtn[lang]}</OutlineButton>
          </SettingsRow>
          <SettingsRow
            label={strings.settingsActiveSessionsLabel[lang]}
            description={strings.settingsActiveSessionsDesc[lang]}
          >
            <OutlineButton onClick={notifyComingSoon}>{strings.settingsManageSessionsBtn[lang]}</OutlineButton>
          </SettingsRow>
          <SettingsRow label={strings.settingsTwoFactorLabel[lang]} description={strings.settingsTwoFactorDesc[lang]}>
            <OutlineButton onClick={notifyComingSoon}>{strings.settingsEnableBtn[lang]}</OutlineButton>
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
            <DangerButton onClick={() => setConfirming("deleteHistory")}>
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
            <DangerButton onClick={() => setConfirming("deleteAccount")}>
              <span className="flex items-center gap-1.5">
                <Trash2 size={12} strokeWidth={1.75} />
                {strings.settingsDeleteAccountBtn[lang]}
              </span>
            </DangerButton>
          </SettingsRow>
        </SettingsSection>
      </div>

      <AnimatePresence>
        {confirming && (
          <Modal
            title={
              confirming === "deleteHistory"
                ? strings.settingsDeleteHistoryConfirmTitle[lang]
                : strings.settingsDeleteAccountConfirmTitle[lang]
            }
            onClose={() => setConfirming(null)}
          >
            <p className="text-sm text-foreground-muted">
              {confirming === "deleteHistory"
                ? strings.settingsDeleteHistoryConfirmDesc[lang]
                : strings.settingsDeleteAccountConfirmDesc[lang]}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.cancelBtn[lang]}
              </button>
              <button
                onClick={() => {
                  if (confirming === "deleteHistory") {
                    pushToast(strings.deletedHistoryToastTitle[lang], strings.deletedHistoryToastDesc[lang], Trash2);
                  } else {
                    pushToast(strings.deletedAccountToastTitle[lang], strings.deletedAccountToastDesc[lang], Trash2);
                  }
                  setConfirming(null);
                }}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
              >
                {strings.confirmBtn[lang]}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} />
    </div>
  );
}
