"use client";

import { useEffect, useRef, useState } from "react";
import {
  Flame,
  Gauge,
  BookOpen,
  Compass,
  Wrench,
  Plus,
  PanelLeftClose,
  ChevronsUpDown,
  User,
  CreditCard,
  Settings,
  CircleHelp,
  LogOut,
  GraduationCap,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { streakDays } from "@/lib/curriculum-data";
import { chatHistory } from "@/lib/chat-data";
import { ThemeToggle } from "@/components/theme-toggle";

export type CanvasView = "chat" | "progress" | "study" | "setup" | "tools" | "examMode" | "panicRevision";

const EXAM_COLOR = "#4F7CFF";
const PANIC_COLOR = "#F59E0B";

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-md bg-accent font-bold text-accent-foreground"
    >
      <span style={{ fontSize: size * 0.5 }}>A</span>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  danger = false,
}: {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface-muted ${
        danger ? "text-warning" : ""
      }`}
    >
      <Icon size={15} strokeWidth={1.75} />
      {label}
    </button>
  );
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm ${
        active ? "bg-accent-soft font-medium text-accent" : "hover:bg-surface-muted"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} />
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
  onCollapse,
  hideHeader = false,
  studentName,
  studentClassLabel,
}: {
  lang: Lang;
  onToggleLang: () => void;
  view: CanvasView;
  activeChatId: string | null;
  onSelectView: (view: CanvasView) => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onCollapse?: () => void;
  hideHeader?: boolean;
  studentName: string;
  studentClassLabel: string;
}) {
  const groups: { key: "today" | "yesterday"; label: string }[] = [
    { key: "today", label: strings.today[lang] },
    { key: "yesterday", label: strings.yesterday[lang] },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="flex h-full flex-col bg-surface">
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight">{strings.appName[lang]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={onToggleLang}
              className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
            >
              {lang === "en" ? "বাংলা" : "EN"}
            </button>
            {onCollapse && (
              <button
                onClick={onCollapse}
                aria-label="Collapse sidebar"
                className="rounded-md border border-border p-1.5 text-foreground-muted hover:text-foreground"
              >
                <PanelLeftClose size={14} strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 px-3 pb-2 pt-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-left text-sm font-medium hover:bg-surface-muted"
        >
          <Plus size={16} strokeWidth={1.75} />
          {strings.newChat[lang]}
        </button>
        <NavButton
          active={view === "progress"}
          icon={Gauge}
          label={strings.progress[lang]}
          onClick={() => onSelectView("progress")}
        />
        <NavButton
          active={view === "study"}
          icon={BookOpen}
          label={strings.studyPlan[lang]}
          onClick={() => onSelectView("study")}
        />
        <NavButton
          active={view === "tools"}
          icon={Wrench}
          label={strings.toolsNav[lang]}
          onClick={() => onSelectView("tools")}
        />
        <NavButton
          active={view === "setup"}
          icon={Compass}
          label={strings.setup[lang]}
          onClick={() => onSelectView("setup")}
        />
      </div>

      <div className="flex gap-2 px-3 pb-2">
        <button
          onClick={() => onSelectView("examMode")}
          style={{
            borderColor: EXAM_COLOR,
            backgroundColor: view === "examMode" ? EXAM_COLOR : `${EXAM_COLOR}1a`,
            color: view === "examMode" ? "#ffffff" : EXAM_COLOR,
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors active:scale-95"
        >
          <GraduationCap size={14} strokeWidth={1.75} />
          {strings.examModeBtn[lang]}
        </button>
        <button
          onClick={() => onSelectView("panicRevision")}
          style={{
            borderColor: PANIC_COLOR,
            backgroundColor: view === "panicRevision" ? PANIC_COLOR : `${PANIC_COLOR}1a`,
            color: view === "panicRevision" ? "#1f1300" : PANIC_COLOR,
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors active:scale-95"
        >
          <Zap size={14} strokeWidth={1.75} />
          {strings.panicBtn[lang]}
        </button>
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
          <Flame size={16} strokeWidth={1.75} className="text-warning" />
          <span className="font-medium">{streakDays}</span>
          <span className="text-foreground-muted">{strings.streak[lang]}</span>
        </div>
      </div>

      <div ref={menuRef} className="relative border-t border-border p-3">
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 flex flex-col gap-0.5 rounded-lg border border-border bg-surface p-1.5 shadow-lg">
            <MenuItem icon={User} label={strings.account[lang]} />
            <MenuItem icon={CreditCard} label={strings.subscription[lang]} />
            <MenuItem icon={Settings} label={strings.settingsItem[lang]} />
            <MenuItem icon={CircleHelp} label={strings.help[lang]} />
            <div className="my-1 border-t border-border" />
            <MenuItem icon={LogOut} label={strings.signOut[lang]} danger />
          </div>
        )}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-surface-muted"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{studentName}</p>
            <p className="truncate text-xs text-foreground-muted">{studentClassLabel}</p>
          </div>
          <ChevronsUpDown size={14} strokeWidth={1.75} className="shrink-0 text-foreground-muted" />
        </button>
      </div>
    </div>
  );
}
