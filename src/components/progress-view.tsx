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
  Sparkles,
  BarChart3,
  Trophy,
  ChevronDown,
  BookOpenCheck,
  Clock,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { CircularProgress } from "@/components/circular-progress";
import { EmptyState } from "@/components/empty-state";
import { AchievementsSection } from "@/components/achievements-section";
import { CompletedBadge } from "@/components/completion-celebration";
import { AiRecommendationStrip } from "@/components/ai-recommendation-strip";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import {
  getSubjectProgress,
  getSubjectTotalChapters,
  getSubjectChaptersCompleted,
  getSubjectNextChapterLabel,
  getSubjectRemainingMinutes,
  getActiveChapter,
  getNextRecommendedChapter,
  type Subject,
} from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";
import {
  availableMinutesOn,
  formatDuration,
  minutesStudiedOn,
  recommendForToday,
  todayKey,
  addDays,
  weeklyMinutesByDay,
  type ChapterCandidate,
  type ScheduleState,
} from "@/lib/study-schedule";
import type { TimerContext } from "@/lib/study-timer";

const upcomingExams = [
  { subject: { en: "Chemistry Test", bn: "রসায়ন পরীক্ষা" }, date: { en: "Aug 12", bn: "১২ আগস্ট" } },
  { subject: { en: "Math Class Test", bn: "গণিত ক্লাস টেস্ট" }, date: { en: "Aug 20", bn: "২০ আগস্ট" } },
  { subject: { en: "Half-yearly Exam", bn: "অর্ধবার্ষিক পরীক্ষা" }, date: { en: "Sep 1", bn: "১ সেপ্টেম্বর" } },
];

// Sunday-first, matching weeklyMinutesByDay()'s indexing.
const weekdayShort = [
  { en: "Sun", bn: "রবি" },
  { en: "Mon", bn: "সোম" },
  { en: "Tue", bn: "মঙ্গল" },
  { en: "Wed", bn: "বুধ" },
  { en: "Thu", bn: "বৃহঃ" },
  { en: "Fri", bn: "শুক্র" },
  { en: "Sat", bn: "শনি" },
];

function reasonLabel(reason: ChapterCandidate["reason"], lang: Lang): string {
  switch (reason) {
    case "highPriority":
      return strings.scheduleReasonHighPriority[lang];
    case "practiceNeeded":
      return strings.scheduleReasonPracticeNeeded[lang];
    case "continueChapter":
      return strings.scheduleReasonContinue[lang];
    case "revision":
      return strings.scheduleReasonRevision[lang];
    default:
      return strings.scheduleReasonGetStarted[lang];
  }
}

function getGreeting(lang: Lang, name: string): string {
  const hour = new Date().getHours();
  const namePart = name ? (lang === "en" ? `, ${name}` : ` ${name}`) : "";
  if (hour < 12) return lang === "en" ? `Good morning${namePart}.` : `শুভ সকাল${namePart}।`;
  if (hour < 17) return lang === "en" ? `Good afternoon${namePart}.` : `শুভ বিকেল${namePart}।`;
  if (hour < 21) return lang === "en" ? `Good evening${namePart}.` : `শুভ সন্ধ্যা${namePart}।`;
  return lang === "en" ? `Welcome back${namePart}.` : `আবার স্বাগতম${namePart}।`;
}

/** "Finish X" when X is genuinely in progress, "Start X" otherwise — so this
 * reads as a distinct instruction rather than repeating the chapter name. */
function getRecommendationSentence(lang: Lang, chapterName: string, isCurrent: boolean): string {
  if (lang === "en") return `${isCurrent ? "Finish" : "Start"} ${chapterName}.`;
  return `${chapterName} ${isCurrent ? "শেষ করো" : "শুরু করো"}।`;
}

/** A meaningful action for the day, not a restatement of the current
 * chapter's name — keeps Daily Mission distinct from every other card that
 * already names the current chapter. */
function getDailyMissionText(lang: Lang, minutes: number): string {
  if (lang === "en") return `Complete today's ${minutes}-minute session`;
  return `আজকের ${minutes} মিনিটের সেশন সম্পন্ন করো`;
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

/** Groups the hub into "Today → Progress → Needs Attention → Upcoming →
 * Activity" so each block answers one question rather than one long feed. */
function GroupHeading({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.p
      custom={index}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="-mb-4 text-xs font-medium uppercase tracking-wide text-foreground-muted"
    >
      {children}
    </motion.p>
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
  schedule,
  sessionMinutes,
  onStartSession,
}: {
  lang: Lang;
  plan: StudyPlan;
  onNavigate: (view: CanvasView) => void;
  subjects: Subject[];
  schedule: ScheduleState;
  sessionMinutes: number;
  onStartSession: (context: TimerContext, minutes: number) => void;
}) {
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null);
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
  // Weak Topics is fully automatic: any chapter flagged "needs-revision" (by
  // the AI or a manual status change) surfaces here on its own — no manual
  // selection, no navigation elsewhere.
  const weakChapterEntries = subjects.flatMap((s) =>
    s.chapters.filter((c) => c.status === "needs-revision").map((c) => ({ subject: s, chapter: c }))
  );
  // Every figure below reads from real completed sessions rather than a
  // parallel hardcoded array, so the hub can't disagree with the schedule.
  const today = todayKey();
  const weeklyMinutes = weeklyMinutesByDay(schedule.sessions, today);
  const maxMinutes = Math.max(...weeklyMinutes, 60);
  const weeklyMinutesTotal = weeklyMinutes.reduce((sum, m) => sum + m, 0);
  const streakDays = weeklyMinutes.filter((m) => m > 0).length;
  const availableToday = availableMinutesOn(schedule.availability, schedule.sessions, today);
  const todaysRecommendations = recommendForToday(subjects, plan, schedule, sessionMinutes, today);
  // The one thing the student is genuinely mid-way through, if anything —
  // "Pick Up Where You Left Off" only appears when this is real.
  const active = getActiveChapter(subjects);
  const activeRemainingMinutes = active ? getSubjectRemainingMinutes(active.subject) : 0;

  const greeting = getGreeting(lang, plan.name.trim());
  const yesterdayMinutes = minutesStudiedOn(schedule.sessions, addDays(today, -1));
  const briefingRecommended = getNextRecommendedChapter(subjects);
  const recommendationSentence = briefingRecommended
    ? getRecommendationSentence(lang, briefingRecommended.chapter.name[lang], !!active)
    : null;
  const dailyMissionText = getDailyMissionText(lang, active?.chapter.estimatedMinutes ?? 30);

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
              <GroupHeading index={0}>{strings.hubToday[lang]}</GroupHeading>

              {/* Daily AI Briefing */}
              <Section
                index={0}
                className="rounded-3xl border border-border bg-surface p-6 sm:p-7"
              >
                <div className="flex flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                        <Sparkles size={13} strokeWidth={1.75} />
                        {strings.dailyBriefingLabel[lang]}
                      </p>
                      <h1 className="mt-1.5 truncate text-2xl font-semibold tracking-tight text-foreground-strong">{greeting}</h1>
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
                        <Clock3 size={14} strokeWidth={1.75} className="text-foreground-muted" />
                        {strings.studiedLabel[lang]} {yesterdayMinutes} {strings.minutesShort[lang]}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-muted px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.currentStreakLabel[lang]}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <Flame size={14} strokeWidth={1.75} className="text-foreground-muted" />
                        {streakDays} {strings.streak[lang]}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-muted px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.examLabel[lang]}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                        <CalendarClock size={14} strokeWidth={1.75} className="text-foreground-muted" />
                        {remaining !== null ? `${Math.max(remaining, 0)} ${strings.daysLeft[lang]}` : strings.notSetYet[lang]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-highlight p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-accent">
                        {strings.todaysRecommendationLabel[lang]}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium">
                        {recommendationSentence ?? strings.allCaughtUp[lang]}
                      </p>
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

              {/* Hero: Continue Learning — only shown when a session is genuinely unfinished */}
              {active && (
                <Section
                  index={1}
                  className="rounded-3xl border border-accent/30 bg-surface p-6 sm:p-7"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <CircularProgress value={active.chapter.progress} size={80} strokeWidth={7} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                            <PlayCircle size={14} strokeWidth={1.75} />
                            {strings.pickUpWhereLeftOff[lang]}
                          </p>
                          <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                            {active.subject.name[lang]}
                          </p>
                          <p className="truncate text-xl font-semibold tracking-tight">
                            {active.chapter.name[lang]}
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
                          {formatTimeRemaining(activeRemainingMinutes, lang)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                          <Target size={11} strokeWidth={1.75} />
                          {strings.todaysGoalLabel[lang]}
                        </span>
                        <span className="truncate text-sm font-semibold">{dailyMissionText}</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                          <Flame size={11} strokeWidth={1.75} className="text-foreground-muted" />
                          {strings.streak[lang]}
                        </span>
                        <span className="text-sm font-semibold">{streakDays}</span>
                      </div>
                    </div>
                  </div>
                </Section>
              )}

              {/* Today's Study Plan — ranked from real syllabus progress, weak
                  subjects, exam proximity, and this week's targets. */}
              {todaysRecommendations.length > 0 && (
                <Section index={2}>
                  <Card>
                    <CardTitle icon={CalendarDays}>{strings.scheduleTodaysPlanTitle[lang]}</CardTitle>
                    <p className="text-sm text-foreground-muted">
                      {strings.scheduleYouHave[lang]}{" "}
                      <span className="font-medium text-foreground">{formatDuration(availableToday, lang)}</span>{" "}
                      {strings.scheduleAvailableToday[lang]}.
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      {todaysRecommendations.map(({ candidate, minutes }, i) => (
                        <div
                          key={candidate.chapter.id}
                          className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted px-3 py-2.5"
                        >
                          <span className="w-4 shrink-0 text-xs tabular-nums text-foreground-faint">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground-strong">
                              {candidate.subject.name[lang]}
                              <span className="font-normal text-foreground-muted">
                                {" "}
                                — {candidate.chapter.name[lang]}
                              </span>
                            </p>
                            <p className="text-[11px] text-foreground-faint">
                              {formatDuration(minutes, lang)} · {reasonLabel(candidate.reason, lang)}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              onStartSession(
                                { subjectId: candidate.subject.id, chapterId: candidate.chapter.id },
                                minutes
                              )
                            }
                            className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                          >
                            {strings.scheduleStartBtn[lang]}
                          </button>
                        </div>
                      ))}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        const first = todaysRecommendations[0];
                        onStartSession(
                          { subjectId: first.candidate.subject.id, chapterId: first.candidate.chapter.id },
                          first.minutes
                        );
                      }}
                      className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                    >
                      {strings.scheduleStartTodaysPlanBtn[lang]}
                      <ArrowRight size={14} strokeWidth={2} />
                    </motion.button>
                  </Card>
                </Section>
              )}

              {/* Daily Mission — an action for the day, distinct from the chapter name shown above */}
              <Section index={2}>
                <Card>
                  <CardTitle icon={Target}>{strings.dailyMission[lang]}</CardTitle>
                  <p className="text-sm font-medium">{dailyMissionText}</p>
                  <p className="mt-3 text-xs text-foreground-muted">{strings.dailyMissionSubtext[lang]}</p>
                </Card>
              </Section>

              <GroupHeading index={3}>{strings.hubProgress[lang]}</GroupHeading>

              {/* Weekly Progress */}
              <Section index={3}>
                <Card>
                  <CardTitle icon={BarChart3}>{strings.weeklyProgress[lang]}</CardTitle>
                  <div className="flex items-end justify-between gap-1.5">
                    {weeklyMinutes.map((minutes, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2.5">
                        <div className="flex h-32 w-full items-end rounded-xl bg-surface-muted">
                          <motion.div
                            title={`${weekdayShort[i][lang]}: ${minutes} ${strings.minutesShort[lang]}`}
                            className="w-full rounded-t-xl bg-accent"
                            initial={{ height: 0 }}
                            animate={{ height: `${maxMinutes ? (minutes / maxMinutes) * 100 : 0}%` }}
                            transition={{ duration: 0.4, delay: 0.15 + i * 0.03, ease: EASE }}
                          />
                        </div>
                        <span className="text-sm text-foreground-muted">{weekdayShort[i][lang]}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>

              {/* Subject Progress */}
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

              <GroupHeading index={6}>{strings.hubNeedsAttention[lang]}</GroupHeading>

              {/* AI Recommendations */}
              <Section index={6}>
                <AiRecommendationStrip
                  lang={lang}
                  subjects={subjects}
                  streakDays={streakDays}
                  onAction={() => onNavigate("chat")}
                />
              </Section>

              {/* Weak Topics */}
              <Section index={7}>
                <Card>
                  <CardTitle icon={TrendingDown}>{strings.weakTopics[lang]}</CardTitle>
                  {weakChapterEntries.length === 0 ? (
                    <div className="flex flex-col items-center gap-1.5 py-1 text-center">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <TrendingDown size={16} strokeWidth={1.75} />
                      </div>
                      <p className="text-xs font-medium">{strings.noWeakTopicsAutoTitle[lang]}</p>
                      <p className="max-w-[240px] text-[11px] text-foreground-muted">
                        {strings.noWeakTopicsAutoDesc[lang]}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {weakChapterEntries.map(({ subject, chapter }) => (
                        <div key={chapter.id} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="inline-block rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">
                              {subject.name[lang]}
                            </span>
                            <p className="mt-1.5 truncate text-sm font-medium">{chapter.name[lang]}</p>
                          </div>
                          <span className="shrink-0 text-xs text-foreground-faint">
                            {strings.statusNeedsRevision[lang]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Section>

              <GroupHeading index={8}>{strings.hubUpcoming[lang]}</GroupHeading>

              {/* Exam countdown + upcoming exams */}
              <Section index={8} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                  <CardTitle icon={CalendarClock}>{strings.examCountdown[lang]}</CardTitle>
                  {remaining !== null ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold tracking-tight text-foreground-strong">
                          {Math.max(remaining, 0)}
                        </span>
                        <span className="text-sm text-foreground-muted">{strings.daysLeft[lang]}</span>
                      </div>
                      {remaining >= 0 && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onNavigate("panicRevision")}
                          className="mt-3 self-start rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
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
              </Section>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
