"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  SearchX,
  X,
  History,
  Plus,
  NotebookPen,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  Layers,
  Compass,
  Gauge,
  Timer as TimerIcon,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { CanvasView } from "@/components/sidebar";
import { chatHistory, type ConversationContext } from "@/lib/chat-data";
import type { Subject } from "@/lib/curriculum-data";
import { loadNotes, timeAgo, type Note } from "@/lib/notebook";
import { findSubject, findChapter, type ScheduleState } from "@/lib/study-schedule";
import { examTargetOptions, curriculumTrackOptions, classLevelOptions, type StudyPlan } from "@/lib/study-plan";

const EASE = [0.16, 1, 0.3, 1] as const;
const RECENT_SEARCHES_MAX = 5;

const CONTEXT_LABEL_KEY: Record<ConversationContext, keyof typeof strings> = {
  learning: "contextLearning",
  revision: "contextRevision",
  practice: "contextPractice",
};

const STATUS_LABEL_KEY = {
  mastered: "statusCompleted",
  "in-progress": "statusInProgress",
  "needs-revision": "statusNeedsRevision",
  "not-started": "statusNotStarted",
} as const;

type SearchResultGroup = "conversations" | "notes" | "studyPlan" | "schedule" | "subjectsChapters" | "learningProfile";

type SearchResult = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: string;
  date?: string;
  onSelect: () => void;
};

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query);
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max).trimEnd()}…` : trimmed;
}

function formatSessionWhen(dateKey: string, startTime: string, lang: Lang): string {
  const date = new Date(`${dateKey}T${startTime}`);
  if (Number.isNaN(date.getTime())) return dateKey;
  const locale = lang === "en" ? "en-US" : "bn-BD";
  const datePart = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
  const timePart = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(date);
  return `${datePart} · ${timePart}`;
}

function RowButton({
  icon: Icon,
  title,
  subtitle,
  meta,
  date,
  highlighted,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  meta?: string;
  date?: string;
  highlighted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-150 ${
        highlighted ? "bg-surface-muted" : "hover:bg-surface-muted"
      }`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-foreground-muted">{subtitle}</p>}
        {(meta || date) && (
          <p className="mt-0.5 truncate text-[10px] text-foreground-faint">
            {meta}
            {meta && date ? " · " : ""}
            {date}
          </p>
        )}
      </div>
    </button>
  );
}

export function GlobalSearch({
  lang,
  open,
  onClose,
  subjects,
  scheduleState,
  plan,
  onNavigate,
  onSelectChat,
  onNewChat,
}: {
  lang: Lang;
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  scheduleState: ScheduleState;
  plan: StudyPlan;
  onNavigate: (view: CanvasView) => void;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}) {
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset-on-change adjustments, done during render (React's documented
  // pattern) rather than in an effect — reloading notes and re-homing the
  // keyboard-nav cursor are both pure reactions to open/query changing, not
  // side effects on an external system.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setNotes(loadNotes());
      setHighlightedIndex(0);
    }
  }
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlightedIndex(0);
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const runSearch = (action: () => void, savedQuery?: string) => {
    if (savedQuery && savedQuery.trim()) {
      setRecentSearches((prev) => [savedQuery, ...prev.filter((q) => q !== savedQuery)].slice(0, RECENT_SEARCHES_MAX));
    }
    action();
    onClose();
    setQuery("");
  };

  const quickActions: { id: string; icon: LucideIcon; label: string; onSelect: () => void }[] = [
    { id: "qa-new-chat", icon: Plus, label: strings.newChat[lang], onSelect: () => runSearch(onNewChat) },
    { id: "qa-new-note", icon: NotebookPen, label: strings.newNote[lang], onSelect: () => runSearch(() => onNavigate("tools")) },
    {
      id: "qa-create-session",
      icon: CalendarPlus,
      label: strings.scheduleCreateSessionTitle[lang],
      onSelect: () => runSearch(() => onNavigate("schedule")),
    },
    {
      id: "qa-open-schedule",
      icon: CalendarClock,
      label: strings.searchQuickOpenSchedule[lang],
      onSelect: () => runSearch(() => onNavigate("schedule")),
    },
    {
      id: "qa-open-hub",
      icon: Gauge,
      label: strings.searchQuickOpenStudentHub[lang],
      onSelect: () => runSearch(() => onNavigate("progress")),
    },
    {
      id: "qa-open-timer",
      icon: TimerIcon,
      label: strings.searchQuickOpenTimer[lang],
      onSelect: () => runSearch(() => onNavigate("tools")),
    },
  ];

  const q = query.trim().toLowerCase();

  const groups: { key: SearchResultGroup; label: string; results: SearchResult[] }[] = useMemo(() => {
    if (!q) return [];

    const conversations: SearchResult[] = chatHistory
      .filter((t) => matchesQuery(t.title[lang], q) || t.messages.some((m) => matchesQuery(m.text[lang], q)))
      .map((t) => {
        const subject = t.subjectId ? findSubject(subjects, t.subjectId) : null;
        const matchedMessage = t.messages.find((m) => matchesQuery(m.text[lang], q)) ?? t.messages[0];
        const contextLabel = strings[CONTEXT_LABEL_KEY[t.context]][lang];
        return {
          id: `conv-${t.id}`,
          icon: MessageSquare,
          title: t.title[lang],
          subtitle: matchedMessage ? truncate(matchedMessage.text[lang], 90) : undefined,
          meta: [subject?.name[lang], contextLabel].filter(Boolean).join(" · "),
          date: t.relativeTime[lang],
          onSelect: () => runSearch(() => onSelectChat(t.id), query),
        };
      });

    const noteResults: SearchResult[] = notes
      .filter((n) => matchesQuery(n.title, q) || matchesQuery(n.content, q))
      .map((n) => {
        const subject = n.subjectId ? findSubject(subjects, n.subjectId) : null;
        return {
          id: `note-${n.id}`,
          icon: NotebookPen,
          title: n.title.trim() || strings.noteTitlePlaceholder[lang],
          subtitle: n.content ? truncate(n.content, 90) : undefined,
          meta: subject?.name[lang],
          date: timeAgo(n.updatedAt, lang),
          onSelect: () => runSearch(() => onNavigate("tools"), query),
        };
      });

    const studyPlanResults: SearchResult[] = subjects
      .filter((s) => matchesQuery(s.name[lang], q))
      .map((s) => ({
        id: `plan-${s.id}`,
        icon: BookOpen,
        title: s.name[lang],
        subtitle: `${s.chapters.length} ${strings.chaptersLabel[lang]} · ${s.progress}%`,
        onSelect: () => runSearch(() => onNavigate("study"), query),
      }));

    const chapterResults: SearchResult[] = subjects.flatMap((s) =>
      s.chapters
        .filter((c) => matchesQuery(c.name[lang], q))
        .map((c) => ({
          id: `chapter-${s.id}-${c.id}`,
          icon: Layers,
          title: c.name[lang],
          subtitle: strings[STATUS_LABEL_KEY[c.status]][lang],
          meta: s.name[lang],
          onSelect: () => runSearch(() => onNavigate("study"), query),
        }))
    );

    const scheduleResults: SearchResult[] = scheduleState.sessions
      .filter((session) => {
        const subject = findSubject(subjects, session.subjectId);
        const chapter = findChapter(subjects, session.subjectId, session.chapterId);
        return (
          (subject && matchesQuery(subject.name[lang], q)) ||
          (chapter && matchesQuery(chapter.name[lang], q)) ||
          (session.goal && matchesQuery(session.goal, q))
        );
      })
      .map((session) => {
        const subject = findSubject(subjects, session.subjectId);
        const chapter = findChapter(subjects, session.subjectId, session.chapterId);
        return {
          id: `sched-${session.id}`,
          icon: CalendarClock,
          title: [subject?.name[lang], chapter?.name[lang]].filter(Boolean).join(" · ") || strings.scheduleTitle[lang],
          subtitle: session.goal || undefined,
          date: formatSessionWhen(session.date, session.startTime, lang),
          onSelect: () => runSearch(() => onNavigate("schedule"), query),
        };
      });

    const profileFields = [
      plan.goal,
      classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang] ?? "",
      curriculumTrackOptions.find((o) => o.value === plan.curriculumTrack)?.label[lang] ?? "",
      examTargetOptions.find((o) => o.value === plan.examTarget)?.label[lang] ?? "",
      ...plan.strongSubjects,
      ...plan.weakSubjects,
    ].filter(Boolean);
    const profileMatch = profileFields.find((f) => matchesQuery(f, q));
    const learningProfileResults: SearchResult[] = profileMatch
      ? [
          {
            id: "profile-match",
            icon: Compass,
            title: strings.learningProfile[lang],
            subtitle: truncate(profileMatch, 90),
            meta: classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang],
            onSelect: () => runSearch(() => onNavigate("setup"), query),
          },
        ]
      : [];

    return [
      { key: "conversations" as const, label: strings.searchGroupConversations[lang], results: conversations },
      { key: "notes" as const, label: strings.searchGroupNotes[lang], results: noteResults },
      { key: "studyPlan" as const, label: strings.searchGroupStudyPlan[lang], results: studyPlanResults },
      { key: "schedule" as const, label: strings.searchGroupSchedule[lang], results: scheduleResults },
      { key: "subjectsChapters" as const, label: strings.searchGroupSubjectsChapters[lang], results: chapterResults },
      { key: "learningProfile" as const, label: strings.searchGroupLearningProfile[lang], results: learningProfileResults },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, notes, subjects, scheduleState, plan, lang]);

  const totalResults = groups.reduce((sum, g) => sum + g.results.length, 0);
  const flatResults = groups.flatMap((g) => g.results);
  const flatNav = [...quickActions, ...(q ? flatResults : [])];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (flatNav.length === 0 ? 0 : (i + 1) % flatNav.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (flatNav.length === 0 ? 0 : (i - 1 + flatNav.length) % flatNav.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatNav[highlightedIndex]?.onSelect();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: EASE }}
          className="fixed inset-0 z-50 flex justify-center px-4 pt-[10vh]"
        >
          <motion.button
            aria-label="Close"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="absolute inset-0 bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: EASE }}
            onKeyDown={handleKeyDown}
            className="relative flex h-fit max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
              <Search size={16} strokeWidth={1.75} className="shrink-0 text-foreground-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={strings.searchPlaceholder[lang]}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground-faint"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label={strings.searchClearBtn[lang]}
                  className="shrink-0 rounded-md p-1 text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-3">
                <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                  {strings.searchQuickActionsLabel[lang]}
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {quickActions.map((qa) => {
                    const navIndex = flatNav.findIndex((item) => item.id === qa.id);
                    return (
                      <button
                        key={qa.id}
                        onClick={qa.onSelect}
                        className={`flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-left text-xs font-medium transition-colors duration-150 ${
                          navIndex === highlightedIndex ? "bg-surface-muted text-foreground" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        <qa.icon size={14} strokeWidth={1.75} className="shrink-0" />
                        <span className="truncate">{qa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {!q ? (
                recentSearches.length > 0 ? (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between px-1">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.searchRecentLabel[lang]}
                      </p>
                      <button
                        onClick={() => setRecentSearches([])}
                        className="text-[10px] font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                      >
                        {strings.searchClearRecentBtn[lang]}
                      </button>
                    </div>
                    <div className="flex flex-col">
                      {recentSearches.map((rq) => (
                        <button
                          key={rq}
                          onClick={() => setQuery(rq)}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
                        >
                          <History size={13} strokeWidth={1.75} className="shrink-0" />
                          <span className="truncate">{rq}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="px-1 py-4 text-center text-xs text-foreground-muted">{strings.searchStartTypingHint[lang]}</p>
                )
              ) : totalResults === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground-muted">
                    <SearchX size={18} strokeWidth={1.75} />
                  </div>
                  <p className="text-sm font-medium">{strings.searchNoResultsTitle[lang]}</p>
                  <p className="text-xs text-foreground-muted">{strings.searchNoResultsDesc[lang]}</p>
                </div>
              ) : (
                groups.map(
                  (g) =>
                    g.results.length > 0 && (
                      <div key={g.key} className="mb-3 last:mb-0">
                        <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                          {g.label}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {g.results.map((r) => {
                            const navIndex = flatNav.findIndex((item) => item.id === r.id);
                            return (
                              <RowButton
                                key={r.id}
                                icon={r.icon}
                                title={r.title}
                                subtitle={r.subtitle}
                                meta={r.meta}
                                date={r.date}
                                highlighted={navIndex === highlightedIndex}
                                onClick={r.onSelect}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
