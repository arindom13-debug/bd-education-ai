"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Menu, PanelLeftOpen, Sun, Moon, Search } from "lucide-react";
import { Sidebar, BrandMark, type CanvasView } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { ChatView } from "@/components/chat-view";
import { ProgressView } from "@/components/progress-view";
import { StudyView } from "@/components/study-view";
import { SetupView } from "@/components/setup-view";
import { ToolsView } from "@/components/tools-view";
import { ExamModeView } from "@/components/exam-mode-view";
import { PanicRevisionView } from "@/components/panic-revision-view";
import { StudySessionView } from "@/components/study-session-view";
import { ProfileView } from "@/components/profile-view";
import { SettingsView } from "@/components/settings-view";
import { UsageView } from "@/components/usage-view";
import { BillingView } from "@/components/billing-view";
import { HelpSupportView } from "@/components/help-support-view";
import { WhatsNewView } from "@/components/whats-new-view";
import { InviteFriendsView } from "@/components/invite-friends-view";
import { NotificationBell } from "@/components/notification-bell";
import { GlobalSearch } from "@/components/global-search";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { Tooltip } from "@/components/tooltip";
import { strings, type Lang } from "@/lib/i18n";
import { chatHistory, onboardingThread } from "@/lib/chat-data";
import { loadStudyPlan, saveStudyPlan, classLevelOptions, type StudyPlan } from "@/lib/study-plan";
import { subjects as initialSubjects, type Subject, type Chapter, type ChapterStatus } from "@/lib/curriculum-data";
import { loadChatLanguage, saveChatLanguage, type ChatLanguage } from "@/lib/chat-language";
import {
  loadTheme,
  saveTheme,
  applyTheme,
  loadThemePreference,
  saveThemePreference,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from "@/lib/theme";
import { defaultCountdowns, getMainCountdown, type Countdown } from "@/lib/countdowns";
import {
  seedNotifications,
  defaultNotificationPreferences,
  type AppNotification,
  type NotificationPreferences,
} from "@/lib/notifications-data";
import { MainCountdownStrip } from "@/components/main-countdown-strip";
import { StudyTimerPill } from "@/components/study-timer-pill";
import { StudyScheduleView } from "@/components/study-schedule-view";
import {
  loadTimerState,
  saveTimerState,
  startPhase,
  quickStart,
  startSessionPhase,
  endSession,
  elapsedMs,
  pauseTimer,
  resumeTimer,
  resetTimer,
  markCompleted,
  dismissCompletion,
  applySettings,
  applyPreset,
  nextPhaseFor,
  type TimerState,
  type TimerActions,
  type TimerContext,
} from "@/lib/study-timer";
import {
  loadScheduleState,
  saveScheduleState,
  todayKey,
  type ScheduleState,
  type StudySession,
  type TimeSlot,
} from "@/lib/study-schedule";

const EASE = [0.16, 1, 0.3, 1] as const;
const SIDEBAR_COLLAPSED_KEY = "arindoms-ai-sidebar-collapsed";
const SIDEBAR_WIDTH_KEY = "arindoms-ai-sidebar-width";
const SIDEBAR_DEFAULT_WIDTH = 288; // 18rem, the original fixed w-72
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_COLLAPSE_DRAG_THRESHOLD = 160; // release below this width while resizing -> collapse
const SIDEBAR_REVEAL_DRAG_THRESHOLD = 96; // px dragged right from the edge -> release opens
const SIDEBAR_MIN_DRAG_WIDTH = 40; // visual floor while actively dragging toward collapse

function loadSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function loadSidebarWidth(): number {
  if (typeof window === "undefined") return SIDEBAR_DEFAULT_WIDTH;
  try {
    const raw = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
    if (Number.isFinite(raw) && raw >= SIDEBAR_MIN_WIDTH && raw <= SIDEBAR_MAX_WIDTH) return raw;
  } catch {
    // storage unavailable — fall back to the default below
  }
  return SIDEBAR_DEFAULT_WIDTH;
}

export function AppShell() {
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<CanvasView>("chat");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Gates the New Chat fade/slide transition: newChat() sets it true so that
  // one chat-panel swap animates, selectChat() clears it so every other
  // chat switch (picking a past conversation) stays instant, unchanged.
  const [newChatTransition, setNewChatTransition] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => loadSidebarCollapsed());
  const setSidebarCollapsed = (collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      // storage unavailable — preference just won't persist across reloads
    }
  };
  const [sidebarWidth, setSidebarWidthState] = useState(() => loadSidebarWidth());
  const setSidebarWidth = (width: number) => {
    setSidebarWidthState(width);
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
    } catch {
      // storage unavailable — preference just won't persist across reloads
    }
  };
  // Live drag state — width/offset are tracked outside React's transition
  // system so the sidebar follows the cursor 1:1 while dragging; the normal
  // CSS transition only re-engages once the pointer is released.
  const [isResizing, setIsResizing] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealOffset, setRevealOffset] = useState(0);
  const isDraggingSidebar = isResizing || isRevealing;
  const asideWidth = isResizing && dragWidth !== null ? dragWidth : sidebarWidth;
  const [studySessionActive, setStudySessionActive] = useState(false);

  // Global study timer — a single source of truth that lives here, not on
  // any one page, so it keeps counting down (and stays accurate across
  // reloads) no matter where the student navigates. See lib/study-timer.ts
  // for why this stores an end timestamp instead of a decrementing counter.
  const [timerState, setTimerState] = useState<TimerState>(() => loadTimerState());
  const commitTimer = (next: TimerState) => {
    setTimerState(next);
    saveTimerState(next);
  };

  // Study schedule — the layer that decides *what* the timer is counting.
  // Sessions reference curriculum ids only, so schedule, Study Plan, and
  // progress can never disagree about a chapter.
  const [scheduleState, setScheduleState] = useState<ScheduleState>(() => loadScheduleState());
  const commitSchedule = (next: ScheduleState) => {
    setScheduleState(next);
    saveScheduleState(next);
  };

  /** Banks finished study time. A scheduled session is marked complete in
   * place; an ad-hoc one is appended, so history and weekly targets count
   * both kinds without a second store. */
  const recordStudiedTime = (context: TimerContext, minutes: number) => {
    if (minutes <= 0) return;
    setScheduleState((prev) => {
      const existing = context.sessionId && prev.sessions.some((s) => s.id === context.sessionId);
      const sessions: StudySession[] = existing
        ? prev.sessions.map((s) =>
            s.id === context.sessionId ? { ...s, status: "completed" as const, completedMinutes: minutes } : s
          )
        : [
            ...prev.sessions,
            {
              id: `session-${Date.now()}`,
              subjectId: context.subjectId,
              chapterId: context.chapterId,
              date: todayKey(),
              startTime: new Date().toTimeString().slice(0, 5),
              durationMinutes: minutes,
              goal: context.goal,
              status: "completed" as const,
              completedMinutes: minutes,
            },
          ];
      const next = { ...prev, sessions };
      saveScheduleState(next);
      return next;
    });
  };

  // Fires exactly when the running phase runs out, rather than polling every
  // second. loadTimerState() covers the case where it expired while away.
  useEffect(() => {
    if (timerState.status !== "running" || timerState.endAt === null) return;
    const id = setTimeout(() => {
      const finishedFocus = timerState.phase === "focus" && timerState.context;
      if (finishedFocus && timerState.context) {
        recordStudiedTime(timerState.context, Math.round(timerState.phaseDurationMs / 60_000));
      }
      const completed = { ...markCompleted(timerState), context: finishedFocus ? null : timerState.context };
      commitTimer(
        completed.settings.autoStartNext ? startPhase(completed, nextPhaseFor(completed)) : completed
      );
    }, Math.max(0, timerState.endAt - Date.now()));
    return () => clearTimeout(id);
  }, [timerState]);

  const timerActions: TimerActions = {
    start: (phase) => commitTimer(startPhase(timerState, phase)),
    quickStart: (focusMinutes, breakMinutes) => commitTimer(quickStart(timerState, focusMinutes, breakMinutes)),
    startSession: (context, minutes) => commitTimer(startSessionPhase(timerState, context, minutes)),
    endSession: () => {
      if (timerState.context) {
        recordStudiedTime(timerState.context, Math.round(elapsedMs(timerState) / 60_000));
      }
      commitTimer(endSession(timerState));
    },
    pause: () => commitTimer(pauseTimer(timerState)),
    resume: () => commitTimer(resumeTimer(timerState)),
    reset: () => commitTimer(resetTimer(timerState)),
    applyPreset: (preset) => commitTimer(applyPreset(timerState, preset)),
    updateSettings: (patch) => commitTimer(applySettings(timerState, patch)),
    dismissCompletion: () => commitTimer(dismissCompletion(timerState)),
  };

  const addScheduledSession = (draft: Omit<StudySession, "id" | "status">) =>
    commitSchedule({
      ...scheduleState,
      sessions: [...scheduleState.sessions, { ...draft, id: `session-${Date.now()}`, status: "scheduled" }],
    });
  const deleteScheduledSession = (id: string) =>
    commitSchedule({ ...scheduleState, sessions: scheduleState.sessions.filter((s) => s.id !== id) });
  /** Plan My Week replaces only the still-pending sessions — completed history
   * is never discarded by regenerating a plan. */
  const replaceUpcomingWeek = (generated: StudySession[]) =>
    commitSchedule({
      ...scheduleState,
      sessions: [...scheduleState.sessions.filter((s) => s.status !== "scheduled"), ...generated],
    });
  const updateWeeklyTargets = (weeklyTargets: Record<string, number>) =>
    commitSchedule({ ...scheduleState, weeklyTargets });
  const updateAvailability = (availability: TimeSlot[][]) => commitSchedule({ ...scheduleState, availability });

  // Init script in layout.tsx already applied this to the DOM before paint —
  // loadTheme() here just brings React's state in sync with it.
  const [theme, setThemeState] = useState<Theme>(() => loadTheme());
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => loadThemePreference());

  // "system" needs live re-resolution — dark/light are just applied once.
  useEffect(() => {
    if (themePreference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const next = resolveTheme("system");
      setThemeState(next);
      saveTheme(next);
      applyTheme(next);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [themePreference]);

  const setThemePreference = (preference: ThemePreference) => {
    setThemePreferenceState(preference);
    saveThemePreference(preference);
    if (preference === "system") return; // the effect above resolves + applies it
    setThemeState(preference);
    saveTheme(preference);
    applyTheme(preference);
  };
  // Sidebar's quick toggle only ever flips between dark/light — using it
  // pins an explicit choice, stepping out of "system" if that was active.
  const toggleTheme = () => setThemePreference(theme === "dark" ? "light" : "dark");

  const [chatLanguage, setChatLanguageState] = useState<ChatLanguage>(() => loadChatLanguage());
  const setChatLanguage = (value: ChatLanguage) => {
    setChatLanguageState(value);
    saveChatLanguage(value);
  };

  // Mock/local only — no persistence, matches the rest of the notification
  // system's frontend-only scope.
  const [notifications, setNotifications] = useState<AppNotification[]>(() => seedNotifications());
  const markNotificationRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllNotificationsRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismissNotification = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  );
  const updateNotificationPreference = (key: keyof NotificationPreferences, value: boolean) =>
    setNotificationPreferences((prev) => ({ ...prev, [key]: value }));

  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [newNoteToken, setNewNoteToken] = useState(0);

  const [plan, setPlan] = useState<StudyPlan>(() => loadStudyPlan());
  const updatePlan = (patch: Partial<StudyPlan>) =>
    setPlan((p) => {
      const next = { ...p, ...patch };
      saveStudyPlan(next);
      return next;
    });
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const addSubject = (name: string, targetChapters?: number) =>
    setSubjects((prev) => [
      ...prev,
      {
        id: `subject-${Date.now()}`,
        name: { en: name, bn: name },
        progress: 0,
        chapters: [],
        totalChapters: targetChapters && targetChapters > 0 ? targetChapters : 10,
        lastStudiedDaysAgo: 0,
      },
    ]);
  const renameSubject = (id: string, name: string) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name: { en: name, bn: name } } : s)));
  const removeSubject = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));
  const reorderSubjects = (reordered: Subject[]) => setSubjects(reordered);
  const addChapter = (subjectId: string, name: string, estimatedMinutes?: number) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: [
                ...s.chapters,
                {
                  id: `chapter-${Date.now()}`,
                  name: { en: name, bn: name },
                  status: "not-started" as const,
                  progress: 0,
                  estimatedMinutes: estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : undefined,
                  // Hand-typed via Add Chapter, so it's not part of the seeded
                  // NCTB syllabus — kept visually distinct rather than blended in.
                  source: "custom" as const,
                },
              ],
            }
          : s
      )
    );
  const removeChapter = (subjectId: string, chapterId: string) =>
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) } : s))
    );
  const renameChapter = (subjectId: string, chapterId: string, name: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, name: { en: name, bn: name } } : c)) }
          : s
      )
    );
  const setChapterMinutes = (subjectId: string, chapterId: string, minutes: number) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, estimatedMinutes: minutes } : c)) }
          : s
      )
    );
  // Every call to setChapterStatus originates from a direct student action
  // (the status control, or Reset Progress below) — there is no automated
  // path that can overwrite it, so tagging it "manual" here is always
  // accurate and, by construction, a manual choice always wins.
  const setChapterStatus = (subjectId: string, chapterId: string, status: ChapterStatus) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId
                  ? {
                      ...c,
                      status,
                      progress:
                        status === "not-started"
                          ? 0
                          : status === "mastered" || status === "needs-revision"
                          ? 100
                          : c.progress > 0 && c.progress < 100
                          ? c.progress
                          : 50,
                      progressSource: "manual" as const,
                    }
                  : c
              ),
            }
          : s
      )
    );
  const reorderChapters = (subjectId: string, reordered: Chapter[]) =>
    setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, chapters: reordered } : s)));
  const resetSubjectProgress = (subjectId: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) => ({
                ...c,
                status: "not-started" as const,
                progress: 0,
                progressSource: "manual" as const,
              })),
            }
          : s
      )
    );

  const [countdowns, setCountdowns] = useState<Countdown[]>(defaultCountdowns);
  const mainCountdown = getMainCountdown(countdowns);
  const addCountdown = (draft: { name: string; targetDate: string; description?: string }) =>
    setCountdowns((prev) => [
      ...prev,
      { id: `countdown-${Date.now()}`, isMain: prev.length === 0, ...draft },
    ]);
  const updateCountdown = (id: string, draft: { name: string; targetDate: string; description?: string }) =>
    setCountdowns((prev) => prev.map((c) => (c.id === id ? { ...c, ...draft } : c)));
  const deleteCountdown = (id: string) =>
    setCountdowns((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const removedWasMain = prev.find((c) => c.id === id)?.isMain;
      if (removedWasMain && next.length > 0 && !next.some((c) => c.isMain)) {
        next[0] = { ...next[0], isMain: true };
      }
      return next;
    });
  const setMainCountdown = (id: string) =>
    setCountdowns((prev) => prev.map((c) => ({ ...c, isMain: c.id === id })));
  const reorderCountdowns = (reordered: Countdown[]) => setCountdowns(reordered);

  const toggleLang = () => setLang((l) => (l === "en" ? "bn" : "en"));
  const studentName = plan.name.trim() || strings.defaultStudentName[lang];
  const studentClassLabel = classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang] ?? "";
  const activeChat =
    activeChatId === onboardingThread.id
      ? onboardingThread
      : chatHistory.find((c) => c.id === activeChatId) ?? null;

  const selectView = (v: CanvasView) => {
    setView(v);
    setHistoryOpen(false);
  };
  const selectChat = (id: string) => {
    setNewChatTransition(false);
    setActiveChatId(id);
    setView("chat");
    setHistoryOpen(false);
  };
  const newChat = () => {
    setNewChatTransition(true);
    setActiveChatId(null);
    setView("chat");
    setHistoryOpen(false);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (key === "n" && e.shiftKey) {
        e.preventDefault();
        selectView("tools");
        setNewNoteToken((t) => t + 1);
      } else if (key === "n") {
        e.preventDefault();
        newChat();
      } else if (e.key === "/") {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Drag the sidebar's right edge to resize it, or drag it far enough left to
  // collapse it. Width tracks the pointer directly (no transition) while the
  // drag is active; releasing snaps it via the normal CSS transition.
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    setIsResizing(true);
    const handleMove = (ev: PointerEvent) => {
      const next = startWidth + (ev.clientX - startX);
      setDragWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_DRAG_WIDTH, next)));
    };
    const handleUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const finalWidth = startWidth + (ev.clientX - startX);
      setIsResizing(false);
      setDragWidth(null);
      if (finalWidth < SIDEBAR_COLLAPSE_DRAG_THRESHOLD) {
        setSidebarCollapsed(true);
      } else {
        setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, finalWidth)));
      }
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  // Drag from the collapsed left edge toward the right to peek/reveal the
  // sidebar; release past the threshold to open it, otherwise it snaps shut.
  const startReveal = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    setIsRevealing(true);
    const handleMove = (ev: PointerEvent) => {
      setRevealOffset(Math.min(Math.max(0, ev.clientX - startX), sidebarWidth));
    };
    const handleUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      const delta = ev.clientX - startX;
      setIsRevealing(false);
      setRevealOffset(0);
      if (delta > SIDEBAR_REVEAL_DRAG_THRESHOLD) setSidebarCollapsed(false);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  };

  // Mobile drawer: Esc closes it, and the page behind it can't scroll while open.
  useEffect(() => {
    if (!historyOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHistoryOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [historyOpen]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {studySessionActive && (
          <StudySessionView
            lang={lang}
            subjects={subjects}
            onEnd={() => setStudySessionActive(false)}
            onFinish={(subjectId, chapterId) => setChapterStatus(subjectId, chapterId, "mastered")}
          />
        )}
      </AnimatePresence>
      {!studySessionActive && (
    <div className="min-h-dvh" style={{ "--sidebar-w": `${asideWidth}px` } as React.CSSProperties}>
      <div className="fixed right-4 top-4 z-30 hidden items-center gap-2 md:flex">
        <StudyTimerPill lang={lang} timer={timerState} actions={timerActions} subjects={subjects} />
        <button
          onClick={() => setSearchOpen(true)}
          aria-label={strings.searchButtonLabel[lang]}
          className="rounded-md border border-border p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <Search size={14} strokeWidth={1.75} />
        </button>
        <NotificationBell
          lang={lang}
          notifications={notifications}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
          onDismiss={dismissNotification}
        />
      </div>
      <aside
        style={{
          width: asideWidth,
          transform: sidebarCollapsed
            ? isRevealing
              ? `translateX(${revealOffset - asideWidth}px)`
              : "translateX(-100%)"
            : "translateX(0)",
        }}
        className={`fixed inset-y-0 left-0 z-10 hidden h-dvh border-r border-border bg-sidebar md:block ${
          isDraggingSidebar ? "" : "transition-[transform,width] duration-300 ease-out"
        }`}
      >
        <Sidebar
          lang={lang}
          onToggleLang={toggleLang}
          theme={theme}
          onToggleTheme={toggleTheme}
          view={view}
          activeChatId={activeChatId}
          onSelectView={selectView}
          onSelectChat={selectChat}
          onNewChat={newChat}
          onCollapse={() => setSidebarCollapsed(true)}
          studentName={studentName}
          studentClassLabel={studentClassLabel}
          plan={plan}
          mainCountdown={mainCountdown}
          timer={timerState}
          subjects={subjects}
        />
        {!sidebarCollapsed && (
          <div
            onPointerDown={startResize}
            aria-hidden
            className="absolute inset-y-0 -right-0.5 z-10 w-1.5 cursor-col-resize touch-none select-none"
          />
        )}
      </aside>

      {sidebarCollapsed && (
        <div
          onPointerDown={startReveal}
          aria-hidden
          className="fixed inset-y-0 left-0 z-10 hidden w-3 cursor-ew-resize touch-none select-none items-center justify-center md:flex"
        >
          <span className="h-16 w-1 rounded-full bg-border transition-colors duration-150 hover:bg-foreground-faint" />
        </div>
      )}

      <div
        className={`fixed left-3 top-3 z-10 hidden transition-opacity duration-300 ease-in-out md:block ${
          sidebarCollapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Tooltip label={strings.expandSidebarLabel[lang]}>
          <button
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Open sidebar"
            className="flex rounded-md border border-border bg-surface p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground active:scale-95"
          >
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center rounded-md p-1.5 text-foreground-muted transition-colors duration-150 active:scale-95"
            aria-label="Menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <BrandMark size={22} />
          <span className="text-[15px] font-semibold tracking-tight">{strings.appName[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <StudyTimerPill lang={lang} timer={timerState} actions={timerActions} subjects={subjects} />
          <button
            onClick={() => setSearchOpen(true)}
            aria-label={strings.searchButtonLabel[lang]}
            className="rounded-md border border-border p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            <Search size={14} strokeWidth={1.75} />
          </button>
          <NotificationBell
            lang={lang}
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
            onDismiss={dismissNotification}
          />
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? strings.switchToLightModeLabel[lang] : strings.switchToDarkModeLabel[lang]}
            className="rounded-md border border-border p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            {theme === "dark" ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
          </button>
          <button
            onClick={toggleLang}
            className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
      </header>

      <div className="sticky top-13.25 z-20 md:hidden">
        <MainCountdownStrip
          lang={lang}
          countdown={mainCountdown}
          variant="mobile"
          onOpenDetails={() => selectView("tools")}
        />
      </div>

      <main
        className={`pb-16 md:pb-0 ${isDraggingSidebar ? "" : "transition-[margin-left] duration-300 ease-out"} ${
          sidebarCollapsed ? "md:ml-0" : "md:ml-(--sidebar-w)"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {view === "chat" && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeChat?.id ?? "new"}
                  initial={newChatTransition ? { opacity: 0, y: 6 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    newChatTransition
                      ? { opacity: 0, y: -6, transition: { duration: 0.1, ease: EASE } }
                      : undefined
                  }
                  transition={{ duration: newChatTransition ? 0.16 : 0, ease: EASE }}
                >
                  <ChatView
                    lang={lang}
                    activeChat={activeChat}
                    plan={plan}
                    subjects={subjects}
                    chatLanguage={chatLanguage}
                    onOpenChat={selectChat}
                  />
                </motion.div>
              </AnimatePresence>
            )}
            {view === "progress" && (
              <ProgressView
                lang={lang}
                plan={plan}
                onNavigate={selectView}
                subjects={subjects}
                schedule={scheduleState}
                sessionMinutes={timerState.settings.focusMinutes}
                onStartSession={timerActions.startSession}
              />
            )}
            {view === "study" && (
              <StudyView
                lang={lang}
                subjects={subjects}
                onAddSubject={addSubject}
                onRemoveSubject={removeSubject}
                onRenameSubject={renameSubject}
                onReorderSubjects={reorderSubjects}
                onAddChapter={addChapter}
                onRemoveChapter={removeChapter}
                onRenameChapter={renameChapter}
                onSetChapterStatus={setChapterStatus}
                onSetChapterMinutes={setChapterMinutes}
                onReorderChapters={reorderChapters}
                onResetSubjectProgress={resetSubjectProgress}
                onNavigate={selectView}
                onStartSession={() => setStudySessionActive(true)}
              />
            )}
            {view === "schedule" && (
              <StudyScheduleView
                lang={lang}
                subjects={subjects}
                plan={plan}
                schedule={scheduleState}
                timer={timerState}
                onAddSession={addScheduledSession}
                onDeleteSession={deleteScheduledSession}
                onReplaceWeek={replaceUpcomingWeek}
                onUpdateTargets={updateWeeklyTargets}
                onUpdateAvailability={updateAvailability}
                onStartSession={timerActions.startSession}
              />
            )}
            {view === "setup" && (
              <SetupView
                lang={lang}
                plan={plan}
                onChange={updatePlan}
                chatLanguage={chatLanguage}
                onChangeChatLanguage={setChatLanguage}
                onNavigate={selectView}
              />
            )}
            {view === "tools" && (
              <ToolsView
                lang={lang}
                countdowns={countdowns}
                onAddCountdown={addCountdown}
                onUpdateCountdown={updateCountdown}
                onDeleteCountdown={deleteCountdown}
                onSetMainCountdown={setMainCountdown}
                onReorderCountdowns={reorderCountdowns}
                timer={timerState}
                timerActions={timerActions}
                newNoteToken={newNoteToken}
              />
            )}
            {view === "examMode" && (
              <ExamModeView lang={lang} plan={plan} subjects={subjects} onNavigate={selectView} />
            )}
            {view === "panicRevision" && (
              <PanicRevisionView lang={lang} plan={plan} subjects={subjects} onNavigate={selectView} />
            )}
            {view === "profile" && (
              <ProfileView
                lang={lang}
                studentName={studentName}
                studentClassLabel={studentClassLabel}
                plan={plan}
                onNavigate={selectView}
              />
            )}
            {view === "settings" && (
              <SettingsView
                lang={lang}
                onSetLang={setLang}
                themePreference={themePreference}
                onSetThemePreference={setThemePreference}
                chatLanguage={chatLanguage}
                onChangeChatLanguage={setChatLanguage}
                notificationPreferences={notificationPreferences}
                onChangeNotificationPreference={updateNotificationPreference}
              />
            )}
            {view === "usage" && <UsageView lang={lang} onNavigate={selectView} />}
            {view === "billing" && <BillingView lang={lang} />}
            {view === "help" && <HelpSupportView lang={lang} />}
            {view === "whatsNew" && <WhatsNewView lang={lang} />}
            {view === "invite" && <InviteFriendsView lang={lang} studentName={studentName} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="sticky bottom-0 z-20 md:hidden">
        <BottomNav lang={lang} active={view} onSelect={selectView} />
      </div>

      <div
        className={`fixed inset-0 z-50 flex md:hidden ${historyOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`h-full w-72 max-w-[80vw] overflow-hidden border-r border-border bg-sidebar transition-transform duration-300 ease-out ${
            historyOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            lang={lang}
            onToggleLang={toggleLang}
            theme={theme}
            onToggleTheme={toggleTheme}
            view={view}
            activeChatId={activeChatId}
            onSelectView={selectView}
            onSelectChat={selectChat}
            onNewChat={newChat}
            studentName={studentName}
            studentClassLabel={studentClassLabel}
            plan={plan}
            mainCountdown={mainCountdown}
            timer={timerState}
            subjects={subjects}
          />
        </div>
        <button
          className={`flex-1 bg-black/40 transition-opacity duration-300 ease-out ${
            historyOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setHistoryOpen(false)}
          aria-label="Close history"
        />
      </div>
    </div>
      )}
      <GlobalSearch
        lang={lang}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        subjects={subjects}
        scheduleState={scheduleState}
        plan={plan}
        onNavigate={selectView}
        onSelectChat={selectChat}
        onNewChat={newChat}
      />
      <AnimatePresence>
        {shortcutsOpen && (
          <KeyboardShortcutsModal lang={lang} onClose={() => setShortcutsOpen(false)} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
