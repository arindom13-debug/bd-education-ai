"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  PlayCircle,
  Target,
  CalendarClock,
  TrendingDown,
  CalendarDays,
  History,
  Sparkles,
  BarChart3,
  Trophy,
  ChevronDown,
  BookOpenCheck,
  Clock,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { CircularProgress } from "@/components/circular-progress";
import { EmptyState } from "@/components/empty-state";
import { AchievementsSection } from "@/components/achievements-section";
import { CompletedBadge } from "@/components/completion-celebration";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import {
  suggestedTopic,
  getSubjectProgress,
  getSubjectTotalChapters,
  getSubjectChaptersCompleted,
  getSubjectNextChapterLabel,
  getSubjectRemainingMinutes,
  getNextRecommendedChapter,
  type Subject,
  type ChapterStatus,
} from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";
import { chatHistory } from "@/lib/chat-data";

const dailyMission = {
  title: { en: "Finish 1 chapter", bn: "১টি অধ্যায় শেষ করো" },
  subtitle: { en: "Chemistry: Behaviour of Gases", bn: "রসায়ন: গ্যাসের আচরণ" },
};

const upcomingExams = [
  { subject: { en: "Chemistry Test", bn: "রসায়ন পরীক্ষা" }, date: { en: "Aug 12", bn: "১২ আগস্ট" } },
  { subject: { en: "Math Class Test", bn: "গণিত ক্লাস টেস্ট" }, date: { en: "Aug 20", bn: "২০ আগস্ট" } },
  { subject: { en: "Half-yearly Exam", bn: "অর্ধবার্ষিক পরীক্ষা" }, date: { en: "Sep 1", bn: "১ সেপ্টেম্বর" } },
];

const weekdayShort = [
  { en: "Sat", bn: "শনি" },
  { en: "Sun", bn: "রবি" },
  { en: "Mon", bn: "সোম" },
  { en: "Tue", bn: "মঙ্গল" },
  { en: "Wed", bn: "বুধ" },
  { en: "Thu", bn: "বৃহঃ" },
  { en: "Fri", bn: "শুক্র" },
];
const weeklyMinutes = [45, 60, 30, 90, 0, 75, 20];
const streakDaysActive = [true, true, false, true, true, true, true];

function getGreeting(lang: Lang, name: string): string {
  const hour = new Date().getHours();
  const namePart = name ? (lang === "en" ? `, ${name}` : ` ${name}`) : "";
  if (hour < 12) return lang === "en" ? `Good morning${namePart}.` : `শুভ সকাল${namePart}।`;
  if (hour < 17) return lang === "en" ? `Good afternoon${namePart}.` : `শুভ বিকেল${namePart}।`;
  if (hour < 21) return lang === "en" ? `Good evening${namePart}.` : `শুভ সন্ধ্যা${namePart}।`;
  return lang === "en" ? `Welcome back${namePart}.` : `আবার স্বাগতম${namePart}।`;
}

function getRecommendationSentence(lang: Lang, chapterName: string, status: ChapterStatus): string {
  const isInProgress = status === "in-progress";
  if (lang === "en") return `${isInProgress ? "Finish" : "Start"} ${chapterName}.`;
  return `${chapterName} ${isInProgress ? "শেষ করো" : "শুরু করো"}।`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: i * 0.03, ease: EASE },
  }),
};

function Section({
  className = "",
  index,
  children,
}: {
  className?: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      custom={index}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 14px 32px -14px var(--color-accent)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 hover:border-accent/30 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-muted ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="size-13 rounded-full" />
      </div>
      <SkeletonBlock className="h-36 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonBlock className="h-32 rounded-2xl" />
        <SkeletonBlock className="h-32 rounded-2xl" />
        <SkeletonBlock className="h-32 rounded-2xl" />
      </div>
      <SkeletonBlock className="h-20 rounded-2xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <SkeletonBlock className="h-12 rounded-xl" />
    </div>
  );
}

function formatTimeRemaining(minutes: number, lang: Lang): string {
  if (minutes < 60) return `${minutes} ${strings.minutesShort[lang]}`;
  const hours = Math.round(minutes / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

function CardTitle({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
      <Icon size={14} strokeWidth={1.75} />
      {children}
    </p>
  );
}

export function ProgressView({
  lang,
  plan,
  onNavigate,
  subjects,
  onOpenChat,
}: {
  lang: Lang;
  plan: StudyPlan;
  onNavigate: (view: CanvasView) => void;
  subjects: Subject[];
  onOpenChat: (id: string) => void;
}) {
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const overallProgress =
    subjects.length === 0
      ? 0
      : Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length);
  const remaining = daysUntil(plan.examDate);
  const weakSubjects = subjects.filter((s) => plan.weakSubjects.includes(s.id));
  const recentThreads = chatHistory.slice(0, 4);
  const maxMinutes = Math.max(...weeklyMinutes, 60);
  const weeklyMinutesTotal = weeklyMinutes.reduce((sum, m) => sum + m, 0);
  const streakDays = streakDaysActive.filter(Boolean).length;
  const suggestedSubject = subjects.find((s) => s.id === suggestedTopic.subjectId);
  const suggestedRemainingMinutes = suggestedSubject ? getSubjectRemainingMinutes(suggestedSubject) : 0;
  const lastChat = chatHistory[0] ?? null;
  const lastChatSubject = lastChat ? subjects.find((s) => s.id === lastChat.subjectId) : undefined;
  const lastChatRemainingMinutes = lastChatSubject ? getSubjectRemainingMinutes(lastChatSubject) : 0;

  const greeting = getGreeting(lang, plan.name.trim());
  const jsDay = new Date().getDay();
  const todayIndex = jsDay === 6 ? 0 : jsDay + 1;
  const yesterdayIndex = (todayIndex + 6) % 7;
  const yesterdayMinutes = weeklyMinutes[yesterdayIndex];
  const briefingRecommended = getNextRecommendedChapter(subjects);
  const briefingChapterName = briefingRecommended?.chapter.name[lang] ?? suggestedTopic.chapterName[lang];
  const briefingChapterStatus: ChapterStatus = briefingRecommended?.chapter.status ?? "in-progress";
  const recommendationSentence = getRecommendationSentence(lang, briefingChapterName, briefingChapterStatus);

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <AnimatePresence mode="wait">
          {!isLoaded ? (
            <motion.div key="skeleton" exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <DashboardSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              className="flex flex-col gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {/* Daily AI Briefing */}
              <Section
                index={0}
                className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-7"
              >
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/8 via-transparent to-transparent" />
                <div className="relative flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                        <Sparkles size={13} strokeWidth={1.75} />
                        {strings.dailyBriefingLabel[lang]}
                      </p>
                      <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight">{greeting}</h1>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <CircularProgress value={overallProgress} size={52} strokeWidth={5} />
                      <span className="text-[10px] text-foreground-muted">
                        {strings.overallCompletion[lang]}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <div className="rounded-xl bg-surface-muted px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.yesterdayLabel[lang]}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <CheckCircle2 size={14} strokeWidth={1.75} className="text-success" />
                        {strings.studiedLabel[lang]} {yesterdayMinutes} {strings.minutesShort[lang]}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-muted px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.currentStreakLabel[lang]}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <Flame size={14} strokeWidth={1.75} className="text-warning" />
                        {streakDays} {strings.streak[lang]}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-muted px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.examLabel[lang]}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <CalendarClock size={14} strokeWidth={1.75} className="text-accent" />
                        {remaining !== null ? `${Math.max(remaining, 0)} ${strings.daysLeft[lang]}` : strings.notSetYet[lang]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-accent/25 bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-accent">
                        {strings.todaysRecommendationLabel[lang]}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium">{recommendationSentence}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => onNavigate("chat")}
                      className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
                    >
                      {strings.startStudyingBtn[lang]}
                      <ArrowRight size={15} strokeWidth={2} />
                    </motion.button>
                  </div>
                </div>
              </Section>

              {/* Hero: Continue Learning */}
              <Section
                index={1}
                className="relative overflow-hidden rounded-3xl border border-accent/30 bg-surface p-6 sm:p-7"
              >
                <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/25 via-accent/8 to-transparent" />
                <div
                  className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full blur-3xl"
                  style={{ backgroundColor: "var(--color-accent)", opacity: 0.18 }}
                />
                <div className="relative flex flex-col gap-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <CircularProgress value={suggestedTopic.progress} size={80} strokeWidth={7} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                          <PlayCircle size={14} strokeWidth={1.75} />
                          {strings.pickUpWhereLeftOff[lang]}
                        </p>
                        <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                          {suggestedTopic.subjectName[lang]}
                        </p>
                        <p className="truncate text-xl font-semibold tracking-tight">
                          {suggestedTopic.chapterName[lang]}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03, boxShadow: "0 18px 40px -14px var(--color-accent)" }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => onNavigate("chat")}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-[0_10px_28px_-14px_var(--color-accent)] sm:self-auto"
                    >
                      {strings.continueLearning[lang]}
                      <ArrowRight size={16} strokeWidth={2} />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-accent/20 rounded-2xl border border-accent/20 bg-surface/70">
                    <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        <Clock size={11} strokeWidth={1.75} />
                        {strings.timeRemaining[lang]}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatTimeRemaining(suggestedRemainingMinutes, lang)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        <Target size={11} strokeWidth={1.75} />
                        {strings.todaysGoalLabel[lang]}
                      </span>
                      <span className="truncate text-sm font-semibold">{dailyMission.title[lang]}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        <Flame size={11} strokeWidth={1.75} className="text-warning" />
                        {strings.streak[lang]}
                      </span>
                      <span className="text-sm font-semibold">{streakDays}</span>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Continue Last Conversation */}
              {lastChat && (
                <Section index={2}>
                  <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <MessageSquare size={18} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                          {strings.continueLastConversation[lang]}
                        </p>
                        <p className="mt-1 truncate text-base font-semibold tracking-tight">
                          {lastChat.title[lang]}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <History size={11} strokeWidth={1.75} />
                            {lastChat.group === "today" ? strings.today[lang] : strings.yesterday[lang]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} strokeWidth={1.75} />
                            {formatTimeRemaining(lastChatRemainingMinutes, lang)} {strings.timeLeftSuffix[lang]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => onOpenChat(lastChat.id)}
                      className="flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground sm:self-auto"
                    >
                      {strings.resumeBtn[lang]}
                      <ArrowRight size={14} strokeWidth={2} />
                    </motion.button>
                  </Card>
                </Section>
              )}

              {/* Medium priority row */}
              <Section index={3} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardTitle icon={CalendarClock}>{strings.examCountdown[lang]}</CardTitle>
                  {remaining !== null ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold tracking-tight text-accent">
                          {Math.max(remaining, 0)}
                        </span>
                        <span className="text-sm text-foreground-muted">{strings.daysLeft[lang]}</span>
                      </div>
                      {remaining >= 0 && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onNavigate("chat")}
                          className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning"
                        >
                          {strings.startCrashMode[lang]}
                        </motion.button>
                      )}
                    </>
                  ) : (
                    <EmptyState
                      icon={CalendarClock}
                      title={strings.noExamDateYet[lang]}
                      description={strings.examDateEmptyDesc[lang]}
                      ctaLabel={strings.setExamDateBtn[lang]}
                      onCtaClick={() => onNavigate("setup")}
                      compact
                    />
                  )}
                </Card>

                <Card>
                  <CardTitle icon={Target}>{strings.dailyMission[lang]}</CardTitle>
                  <p className="text-sm font-medium">{dailyMission.title[lang]}</p>
                  <p className="mt-1 text-xs text-foreground-muted">{dailyMission.subtitle[lang]}</p>
                  <p className="mt-3 text-xs text-foreground-muted">{strings.dailyMissionSubtext[lang]}</p>
                </Card>

                <Card>
                  <CardTitle icon={BarChart3}>{strings.weeklyProgress[lang]}</CardTitle>
                  <div className="flex h-16 items-end justify-between gap-1.5">
                    {weeklyMinutes.map((minutes, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="flex h-12 w-full items-end rounded-md bg-surface-muted">
                          <motion.div
                            title={`${weekdayShort[i][lang]}: ${minutes} ${strings.minutesShort[lang]}`}
                            className="w-full rounded-t-md bg-linear-to-t from-accent/80 to-accent"
                            initial={{ height: 0 }}
                            animate={{ height: `${maxMinutes ? (minutes / maxMinutes) * 100 : 0}%` }}
                            transition={{ duration: 0.4, delay: 0.15 + i * 0.03, ease: EASE }}
                          />
                        </div>
                        <span className="text-[10px] text-foreground-muted">{weekdayShort[i][lang]}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>

              {/* Subject Progress — gradient cards */}
              <Section index={4}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.subjectProgress[lang]}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map((subject, i) => {
                    const progress = getSubjectProgress(subject);
                    const isCompleted = progress === 100;
                    const isExpanded = expandedSubjectId === subject.id;
                    const completedChapters = getSubjectChaptersCompleted(subject);
                    const totalChapters = getSubjectTotalChapters(subject);
                    const nextChapterLabel = getSubjectNextChapterLabel(subject, lang);
                    const remainingMinutes = getSubjectRemainingMinutes(subject);

                    return (
                      <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.1 + i * 0.03, ease: EASE }}
                        whileHover={{
                          y: -2,
                          boxShadow: "0 12px 28px -16px var(--color-accent)",
                          transition: { duration: 0.25, ease: "easeOut" },
                        }}
                        className="overflow-hidden rounded-2xl border border-border bg-surface transition-colors duration-200 hover:border-accent/40"
                      >
                        <motion.button
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                          className="relative w-full p-4 text-left"
                        >
                          <div className="relative flex items-center gap-3">
                            <CircularProgress value={progress} size={48} strokeWidth={5} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-medium">{subject.name[lang]}</p>
                                {isCompleted && (
                                  <CompletedBadge>
                                    <Trophy size={9} strokeWidth={2} />
                                    {strings.completedBadge[lang]}
                                  </CompletedBadge>
                                )}
                              </div>
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-foreground-muted">
                                <BookOpenCheck size={10} strokeWidth={1.75} />
                                {completedChapters}/{totalChapters} {strings.chaptersLabel[lang]}
                              </p>
                              {nextChapterLabel && (
                                <p className="mt-1 truncate text-xs text-foreground-muted">
                                  {strings.nextLesson[lang]}: {nextChapterLabel}
                                </p>
                              )}
                            </div>
                            <ChevronDown
                              size={16}
                              strokeWidth={1.75}
                              className={`shrink-0 text-foreground-muted transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </motion.button>

                        <div
                          className={`grid transition-[grid-template-rows] duration-300 ${
                            isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                        >
                          <div className="overflow-hidden">
                            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                              <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                                <Clock size={12} strokeWidth={1.75} />
                                {strings.timeRemaining[lang]}
                              </span>
                              <span className="text-sm font-medium">
                                {formatTimeRemaining(remainingMinutes, lang)}
                              </span>
                            </div>
                            <div className="border-t border-border px-4 py-2.5">
                              <button
                                onClick={() => onNavigate("study")}
                                className="text-xs font-medium text-accent hover:underline"
                              >
                                {strings.viewInStudyPlan[lang]} →
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Section>

              {/* Achievements */}
              <Section index={5}>
                <AchievementsSection
                  lang={lang}
                  subjects={subjects}
                  streakDays={streakDays}
                  weeklyMinutesTotal={weeklyMinutesTotal}
                />
              </Section>

              {/* Collapsible details */}
              <Section index={6}>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDetailsOpen((o) => !o)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-muted"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.moreDetails[lang]}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.75}
                    className={`text-foreground-muted transition-transform duration-200 ${
                      detailsOpen ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                      <Card>
                        <CardTitle icon={TrendingDown}>{strings.weakTopics[lang]}</CardTitle>
                        {weakSubjects.length === 0 ? (
                          <EmptyState
                            icon={TrendingDown}
                            title={strings.noWeakTopicsYet[lang]}
                            description={strings.weakTopicsEmptyDesc[lang]}
                            ctaLabel={strings.addWeakTopicsBtn[lang]}
                            onCtaClick={() => onNavigate("setup")}
                            compact
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {weakSubjects.map((s) => (
                              <span
                                key={s.id}
                                className="rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs text-warning"
                              >
                                {s.name[lang]}
                              </span>
                            ))}
                          </div>
                        )}
                      </Card>

                      <Card>
                        <CardTitle icon={CalendarDays}>{strings.upcomingExams[lang]}</CardTitle>
                        <div className="flex flex-col gap-2.5">
                          {upcomingExams.map((exam, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate">{exam.subject[lang]}</span>
                              <span className="shrink-0 text-xs text-foreground-muted">{exam.date[lang]}</span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card>
                        <CardTitle icon={History}>{strings.recentActivity[lang]}</CardTitle>
                        <div className="flex flex-col gap-2.5">
                          {recentThreads.map((thread) => (
                            <button
                              key={thread.id}
                              onClick={() => onOpenChat(thread.id)}
                              className="flex items-center justify-between gap-2 text-left text-sm hover:text-accent"
                            >
                              <span className="truncate">{thread.title[lang]}</span>
                              <span className="shrink-0 text-xs text-foreground-muted">
                                {thread.group === "today" ? strings.today[lang] : strings.yesterday[lang]}
                              </span>
                            </button>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
