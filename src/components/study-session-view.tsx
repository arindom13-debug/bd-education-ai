"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Clock,
  Flame,
  ArrowUp,
  Sparkles,
  MessageSquare,
  NotebookText,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { CircularProgress } from "@/components/circular-progress";
import { ModeTimer } from "@/components/mode-timer";
import { NotebookPanel } from "@/components/tool-panels";
import { TypingDots } from "@/components/typing-dots";
import { strings, type Lang } from "@/lib/i18n";
import {
  getNextRecommendedChapter,
  getSubjectProgress,
  streakDays,
  suggestedTopic,
  type Subject,
} from "@/lib/curriculum-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const timerPresets = [
  { minutes: 25, label: { en: "Focus", bn: "ফোকাস" } },
  { minutes: 5, label: { en: "Short break", bn: "ছোট বিরতি" } },
  { minutes: 15, label: { en: "Long break", bn: "লম্বা বিরতি" } },
];

function formatMinutes(total: number, lang: Lang): string {
  if (total < 60) return `${total} ${strings.minutesShort[lang]}`;
  const hours = Math.round(total / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

type SessionTab = "chat" | "notebook" | "progress";

type SessionMessage = { role: "user" | "ai"; text: string };

function SessionChat({ lang, chapterLabel }: { lang: Lang; chapterLabel: string }) {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            lang === "en"
              ? "This is a demo reply. Real answers grounded in your textbooks are coming in a later step."
              : "এটি একটি ডেমো উত্তর। তোমার পাঠ্যবইয়ের ভিত্তিতে প্রকৃত উত্তর পরবর্তী ধাপে আসবে।",
        },
      ]);
    }, 700);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2.5 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles size={18} strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium">{chapterLabel}</p>
            <p className="max-w-xs text-xs text-foreground-muted">{strings.chatSubtitle[lang]}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed wrap-break-word ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground"
                      : "border border-border bg-surface-muted"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-surface-muted px-3.5 py-2">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder={strings.chatPlaceholder[lang]}
          className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-control px-3 py-2 text-sm outline-none placeholder:text-foreground-faint focus:border-accent"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label={strings.send[lang]}
          className="flex shrink-0 items-center justify-center rounded-full bg-accent p-2.5 text-accent-foreground disabled:opacity-40"
        >
          <ArrowUp size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function SessionProgress({
  lang,
  subjects,
  chapterProgress,
}: {
  lang: Lang;
  subjects: Subject[];
  chapterProgress: number;
}) {
  const overallProgress =
    subjects.length === 0
      ? 0
      : Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2">
        <CircularProgress value={overallProgress} size={88} strokeWidth={7} />
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.overallCompletion[lang]}
        </p>
      </div>
      <div className="w-full max-w-xs">
        <div className="mb-1.5 flex items-center justify-between text-xs text-foreground-muted">
          <span>{strings.currentChapterLabel[lang]}</span>
          <span className="tabular-nums">{chapterProgress}%</span>
        </div>
        <AnimatedProgressBar value={chapterProgress} />
      </div>
      <div className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
        <Flame size={13} strokeWidth={1.75} />
        {streakDays} {strings.streak[lang]}
      </div>
    </div>
  );
}

export function StudySessionView({
  lang,
  subjects,
  onEnd,
  onFinish,
}: {
  lang: Lang;
  subjects: Subject[];
  onEnd: () => void;
  onFinish?: (subjectId: string, chapterId: string) => void;
}) {
  const [tab, setTab] = useState<SessionTab>("chat");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const idBase = useId();
  const recommended = getNextRecommendedChapter(subjects);
  const subjectName = recommended?.subjectName ?? suggestedTopic.subjectName;
  const chapterName = recommended?.chapter.name ?? suggestedTopic.chapterName;
  const chapterProgress = recommended?.chapter.progress ?? suggestedTopic.progress;
  const estimatedMinutes = recommended?.chapter.estimatedMinutes ?? 20;

  const tabs: { key: SessionTab; label: string; icon: typeof MessageSquare }[] = [
    { key: "chat", label: strings.chat[lang], icon: MessageSquare },
    { key: "notebook", label: strings.notebookTitle[lang], icon: NotebookText },
    { key: "progress", label: strings.progress[lang], icon: BarChart3 },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const currentIndex = tabs.findIndex((t) => t.key === tab);
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (currentIndex + dir + tabs.length) % tabs.length;
    setTab(tabs[nextIndex].key);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="fixed inset-0 z-50 flex h-dvh flex-col bg-background"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="size-2 shrink-0 rounded-full bg-accent"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight">{strings.studySessionMode[lang]}</p>
            <p className="truncate text-xs text-foreground-muted">
              {subjectName[lang]} · {chapterName[lang]}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {recommended && onFinish && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                onFinish(recommended.subjectId, recommended.chapter.id);
                onEnd();
              }}
              className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
            >
              <CheckCircle2 size={15} strokeWidth={1.75} />
              {strings.finishSessionBtn[lang]}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15 }}
            onClick={onEnd}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:border-warning/50 hover:text-warning"
          >
            <X size={15} strokeWidth={1.75} />
            {strings.endSessionBtn[lang]}
          </motion.button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:flex-row lg:overflow-hidden">
        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          <div className="rounded-2xl border border-accent/30 bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {strings.currentChapterLabel[lang]}
            </p>
            <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {subjectName[lang]}
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{chapterName[lang]}</p>
            <AnimatedProgressBar value={chapterProgress} className="mt-3" />
            <div className="mt-2 flex items-center justify-between text-xs text-foreground-muted">
              <span>{chapterProgress}%</span>
              <span className="flex items-center gap-1">
                <Clock size={11} strokeWidth={1.75} />
                {formatMinutes(estimatedMinutes, lang)} {strings.timeLeftSuffix[lang]}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <ModeTimer lang={lang} presets={timerPresets} />
          </div>
        </div>

        <div className="flex min-h-112 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:min-h-0">
          <div role="tablist" className="flex flex-wrap gap-1 border-b border-border p-2">
            {tabs.map((t, i) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`${idBase}-tab-${t.key}`}
                  aria-selected={active}
                  aria-controls={`${idBase}-panel-${tab}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setTab(t.key)}
                  onKeyDown={handleTabKeyDown}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-accent-soft text-accent" : "text-foreground-muted hover:bg-surface-muted"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div
            className="min-h-0 flex-1"
            role="tabpanel"
            id={`${idBase}-panel-${tab}`}
            aria-labelledby={`${idBase}-tab-${tab}`}
          >
            {tab === "chat" && (
              <SessionChat lang={lang} chapterLabel={`${subjectName[lang]}: ${chapterName[lang]}`} />
            )}
            {tab === "notebook" && (
              <div className="h-full overflow-y-auto p-4">
                <NotebookPanel lang={lang} />
              </div>
            )}
            {tab === "progress" && (
              <SessionProgress lang={lang} subjects={subjects} chapterProgress={chapterProgress} />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
