"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  GraduationCap,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { streakDays } from "@/lib/curriculum-data";
import { chatHistory } from "@/lib/chat-data";
import { ProfilePanel } from "@/components/profile-panel";
import { Tooltip } from "@/components/tooltip";
import { MainCountdownStrip } from "@/components/main-countdown-strip";
import type { StudyPlan } from "@/lib/study-plan";
import type { ChatLanguage } from "@/lib/chat-language";
import type { Countdown } from "@/lib/countdowns";

export type CanvasView = "chat" | "progress" | "study" | "setup" | "tools" | "examMode" | "panicRevision";

const EASE = [0.16, 1, 0.3, 1] as const;

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

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
  layoutGroup,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  layoutGroup: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-150 ${
        active ? "font-medium text-foreground-strong" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {active && (
        <motion.span
          layoutId={`sidebar-active-indicator-${layoutGroup}`}
          transition={{ duration: 0.25, ease: EASE }}
          className="absolute inset-0 -z-10 rounded-md bg-accent-soft"
        />
      )}
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
  plan,
  chatLanguage,
  onChangeChatLanguage,
  mainCountdown,
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
  plan: StudyPlan;
  chatLanguage: ChatLanguage;
  onChangeChatLanguage: (value: ChatLanguage) => void;
  mainCountdown: Countdown | null;
}) {
  const groups: { key: "today" | "yesterday"; label: string }[] = [
    { key: "today", label: strings.today[lang] },
    { key: "yesterday", label: strings.yesterday[lang] },
  ];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const layoutGroup = onCollapse ? "desktop" : "mobile";

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
    <div className="flex min-h-full flex-col bg-sidebar">
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div className="flex items-center gap-2">
            <BrandMark />
            <span className="text-[15px] font-semibold tracking-tight">{strings.appName[lang]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleLang}
              className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              {lang === "en" ? "বাংলা" : "EN"}
            </button>
            {onCollapse && (
              <Tooltip label={strings.collapseSidebarLabel[lang]}>
                <button
                  onClick={onCollapse}
                  aria-label="Collapse sidebar"
                  className="rounded-md border border-border p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
                >
                  <PanelLeftClose size={14} strokeWidth={1.75} />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      <MainCountdownStrip lang={lang} countdown={mainCountdown} variant="sidebar" />

      <div className="flex flex-col gap-1 px-3 pb-2 pt-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150 hover:bg-surface-muted active:scale-[0.99]"
        >
          <Plus size={16} strokeWidth={1.75} />
          {strings.newChat[lang]}
        </button>
        <NavButton
          active={view === "progress"}
          icon={Gauge}
          label={strings.studentHub[lang]}
          onClick={() => onSelectView("progress")}
          layoutGroup={layoutGroup}
        />
        <NavButton
          active={view === "study"}
          icon={BookOpen}
          label={strings.studyPlan[lang]}
          onClick={() => onSelectView("study")}
          layoutGroup={layoutGroup}
        />
        <NavButton
          active={view === "tools"}
          icon={Wrench}
          label={strings.toolsNav[lang]}
          onClick={() => onSelectView("tools")}
          layoutGroup={layoutGroup}
        />
        <NavButton
          active={view === "setup"}
          icon={Compass}
          label={strings.setup[lang]}
          onClick={() => onSelectView("setup")}
          layoutGroup={layoutGroup}
        />
      </div>

      <div className="flex gap-2 px-3 pb-2">
        <button
          onClick={() => onSelectView("examMode")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors active:scale-95 ${
            view === "examMode"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-accent/30 bg-accent-soft text-accent"
          }`}
        >
          <GraduationCap size={14} strokeWidth={1.75} />
          {strings.examModeBtn[lang]}
        </button>
        <button
          onClick={() => onSelectView("panicRevision")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors active:scale-95 ${
            view === "panicRevision"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-accent/30 bg-accent-soft text-accent"
          }`}
        >
          <Zap size={14} strokeWidth={1.75} />
          {strings.panicBtn[lang]}
        </button>
      </div>

      <div className="px-3 pb-2">
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
                    className={`truncate rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
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
        <AnimatePresence>
          {menuOpen && (
            <ProfilePanel
              lang={lang}
              studentName={studentName}
              studentClassLabel={studentClassLabel}
              plan={plan}
              chatLanguage={chatLanguage}
              onChangeChatLanguage={onChangeChatLanguage}
              onOpenSettings={() => onSelectView("setup")}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </AnimatePresence>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface-muted"
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
