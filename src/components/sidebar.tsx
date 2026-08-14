"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Gauge,
  BookOpen,
  Compass,
  Wrench,
  Plus,
  PanelLeftClose,
  ChevronsUpDown,
  GraduationCap,
  Zap,
  CalendarClock,
  Timer as TimerIcon,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { chatHistory } from "@/lib/chat-data";
import { ProfilePanel } from "@/components/profile-panel";
import { Tooltip } from "@/components/tooltip";
import { MainCountdownStrip } from "@/components/main-countdown-strip";
import { useTimerNow } from "@/components/study-timer-controls";
import { formatClock, getRemainingMs, type TimerState } from "@/lib/study-timer";
import { findChapter, findSubject } from "@/lib/study-schedule";
import type { Subject } from "@/lib/curriculum-data";
import type { StudyPlan } from "@/lib/study-plan";
import type { ChatLanguage } from "@/lib/chat-language";
import type { Countdown } from "@/lib/countdowns";
import type { Theme } from "@/lib/theme";

export type CanvasView =
  | "chat"
  | "progress"
  | "study"
  | "schedule"
  | "setup"
  | "tools"
  | "examMode"
  | "panicRevision";

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
  trailing,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  layoutGroup: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors duration-150 ${
        active ? "font-medium text-foreground-strong" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      {active && (
        <motion.span
          layoutId={`sidebar-active-indicator-${layoutGroup}`}
          transition={{ duration: 0.25, ease: EASE }}
          className="absolute inset-0 -z-10 rounded-md border border-border bg-accent-soft"
        />
      )}
      <Icon size={16} strokeWidth={1.75} />
      <span className="flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}

/** Live study-session strip: the clock plus what's actually being studied, so
 * the sidebar answers "what am I meant to be doing" at a glance. Clicking it
 * jumps to the schedule, where the full session controls live. */
function ActiveSessionStrip({
  lang,
  timer,
  subjects,
  onOpen,
}: {
  lang: Lang;
  timer: TimerState;
  subjects: Subject[];
  onOpen: () => void;
}) {
  const now = useTimerNow(timer.status);
  if (timer.status !== "running" && timer.status !== "paused") return null;

  const subject = timer.context ? findSubject(subjects, timer.context.subjectId) : null;
  const chapter = timer.context ? findChapter(subjects, timer.context.subjectId, timer.context.chapterId) : null;

  return (
    <button
      onClick={onOpen}
      className="mx-3 mb-1.5 flex w-[calc(100%-1.5rem)] flex-col items-start gap-0.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left transition-colors duration-150 hover:bg-surface-muted"
    >
      <span className="flex items-center gap-1.5 text-xs tabular-nums text-foreground">
        <TimerIcon size={12} strokeWidth={1.75} className="text-foreground-muted" />
        {formatClock(getRemainingMs(timer, now))}
        {timer.status === "paused" && (
          <span className="text-[10px] text-foreground-faint">{strings.timerPausedLabel[lang]}</span>
        )}
      </span>
      {subject && (
        <span className="w-full truncate text-[11px] text-foreground-muted">
          {subject.name[lang]}
          {chapter && ` · ${chapter.name[lang]}`}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
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
  timer,
  subjects,
}: {
  lang: Lang;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  view: CanvasView;
  activeChatId: string | null;
  onSelectView: (view: CanvasView) => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  timer: TimerState;
  subjects: Subject[];
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
    <div className="flex h-full flex-col overflow-hidden bg-sidebar">
      {/* TOP FIXED — header + countdown only, never scrolls */}
      <div className="shrink-0">
        {!hideHeader && (
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <BrandMark />
              <span className="text-[15px] font-semibold tracking-tight">{strings.appName[lang]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tooltip label={theme === "dark" ? strings.switchToLightModeLabel[lang] : strings.switchToDarkModeLabel[lang]}>
                <button
                  onClick={onToggleTheme}
                  aria-label={theme === "dark" ? strings.switchToLightModeLabel[lang] : strings.switchToDarkModeLabel[lang]}
                  className="rounded-md border border-border p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
                >
                  {theme === "dark" ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
                </button>
              </Tooltip>
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

        <MainCountdownStrip
          lang={lang}
          countdown={mainCountdown}
          variant="sidebar"
          onOpenDetails={() => onSelectView("tools")}
        />
      </div>

      {/* MIDDLE SCROLLABLE — New Chat, navigation, Exam/Panic, and all chat history scroll together as one area */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        <div className="flex flex-col gap-0.5 px-3 pb-1 pt-1.5">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-surface-muted active:scale-[0.99]"
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
            active={view === "schedule"}
            icon={CalendarClock}
            label={strings.scheduleNav[lang]}
            onClick={() => onSelectView("schedule")}
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
            label={strings.learningProfile[lang]}
            onClick={() => onSelectView("setup")}
            layoutGroup={layoutGroup}
          />
        </div>

        <div className="flex gap-1.5 px-3 pb-1.5">
          <button
            onClick={() => onSelectView("examMode")}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors active:scale-95 ${
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
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors active:scale-95 ${
              view === "panicRevision"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-accent/30 bg-accent-soft text-accent"
            }`}
          >
            <Zap size={14} strokeWidth={1.75} />
            {strings.panicBtn[lang]}
          </button>
        </div>

        <ActiveSessionStrip
          lang={lang}
          timer={timer}
          subjects={subjects}
          onOpen={() => onSelectView("schedule")}
        />

        <div className="px-3 pb-2">
          {groups.map((group) => {
            const threads = chatHistory.filter((t) => t.group === group.key);
            if (threads.length === 0) return null;
            return (
              <div key={group.key} className="mb-1.5">
                <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => onSelectChat(thread.id)}
                      className={`truncate rounded-md px-2.5 py-1 text-left text-sm transition-colors duration-150 ${
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
      </div>

      {/* BOTTOM FIXED — student profile only, never scrolls */}
      <div className="shrink-0">
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
    </div>
  );
}
