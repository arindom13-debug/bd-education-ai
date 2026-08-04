"use client";

import { strings, type Lang } from "@/lib/i18n";
import { streakDays } from "@/lib/curriculum-data";
import { chatHistory } from "@/lib/chat-data";

export type CanvasView = "chat" | "progress" | "study" | "setup";

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${
        active ? "bg-accent-soft text-accent" : "hover:bg-surface-muted"
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

export function Sidebar({
  lang,
  onToggleLang,
  view,
  activeChatId,
  onSelectView,
  onSelectChat,
  onNewChat,
  hideHeader = false,
}: {
  lang: Lang;
  onToggleLang: () => void;
  view: CanvasView;
  activeChatId: string | null;
  onSelectView: (view: CanvasView) => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  hideHeader?: boolean;
}) {
  const groups: { key: "today" | "yesterday"; label: string }[] = [
    { key: "today", label: strings.today[lang] },
    { key: "yesterday", label: strings.yesterday[lang] },
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-sm font-semibold tracking-tight">{strings.appName[lang]}</span>
          <button
            onClick={onToggleLang}
            className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1 p-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 rounded-md border border-border px-2.5 py-2 text-left text-sm font-medium hover:bg-surface-muted"
        >
          <span className="text-base leading-none">+</span>
          {strings.newChat[lang]}
        </button>
        <NavButton
          active={view === "progress"}
          icon="◔"
          label={strings.progress[lang]}
          onClick={() => onSelectView("progress")}
        />
        <NavButton
          active={view === "study"}
          icon="▤"
          label={strings.studyPlan[lang]}
          onClick={() => onSelectView("study")}
        />
        <NavButton
          active={view === "setup"}
          icon="⚙"
          label={strings.setup[lang]}
          onClick={() => onSelectView("setup")}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {groups.map((group) => {
          const threads = chatHistory.filter((t) => t.group === group.key);
          if (threads.length === 0) return null;
          return (
            <div key={group.key} className="mb-3">
              <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => onSelectChat(thread.id)}
                    className={`truncate rounded-md px-2.5 py-1.5 text-left text-sm ${
                      view === "chat" && activeChatId === thread.id
                        ? "bg-accent-soft text-accent"
                        : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                    }`}
                  >
                    {thread.title[lang]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span>🔥</span>
          <span className="font-medium">{streakDays}</span>
          <span className="text-foreground-muted">{strings.streak[lang]}</span>
        </div>
      </div>
    </div>
  );
}
