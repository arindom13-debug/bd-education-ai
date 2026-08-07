"use client";

import { useState } from "react";
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
  Check,
  ChevronDown,
  BookOpenCheck,
  Clock,
} from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { CircularProgress } from "@/components/circular-progress";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import {
  suggestedTopic,
  getSubjectProgress,
  getSubjectTotalChapters,
  getSubjectChaptersCompleted,
  getSubjectNextChapterLabel,
  getSubjectRemainingMinutes,
  getSubjectReadiness,
  type Subject,
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

const aiRecommendation = {
  en: "You've mastered Chemistry basics — review Chemical Reactions once more before starting Behaviour of Gases.",
  bn: "তুমি রসায়নের বেসিক আয়ত্ত করেছ — গ্যাসের আচরণ শুরু করার আগে রাসায়নিক বিক্রিয়া আরেকবার দেখে নাও।",
};

function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-accent/30 hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}

function formatTimeRemaining(minutes: number, lang: Lang): string {
  if (minutes < 60) return `${minutes} ${strings.minutesShort[lang]}`;
  const hours = Math.round(minutes / 60);
  return `${hours} ${strings.hoursShort[lang]}`;
}

function formatLastStudied(daysAgo: number, lang: Lang): string {
  if (daysAgo === 0) return strings.today[lang];
  if (daysAgo === 1) return strings.yesterday[lang];
  return `${daysAgo} ${strings.daysAgo[lang]}`;
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

  const overallProgress =
    subjects.length === 0
      ? 0
      : Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length);
  const remaining = daysUntil(plan.examDate);
  const weakSubjects = subjects.filter((s) => plan.weakSubjects.includes(s.id));
  const recentThreads = chatHistory.slice(0, 4);
  const maxMinutes = Math.max(...weeklyMinutes, 60);
  const streakDays = streakDaysActive.filter(Boolean).length;
  const displayName = plan.name.trim() ? `, ${plan.name.trim()}` : "";

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {strings.dashboardGreeting[lang]}
            {displayName}
          </h1>
          <div className="flex flex-col items-center gap-1">
            <CircularProgress value={overallProgress} size={52} strokeWidth={5} />
            <span className="text-[10px] text-foreground-muted">{strings.overallCompletion[lang]}</span>
          </div>
        </div>

        {/* Hero: Continue Learning */}
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-6">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/15 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <CircularProgress value={suggestedTopic.progress} size={72} strokeWidth={6} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent">
                  <PlayCircle size={14} strokeWidth={1.75} />
                  {strings.continueLearning[lang]}
                </p>
                <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {suggestedTopic.subjectName[lang]}
                </p>
                <p className="truncate text-lg font-semibold tracking-tight">
                  {suggestedTopic.chapterName[lang]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:shrink-0">
              <span className="flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
                <Flame size={13} strokeWidth={1.75} />
                {streakDays} {strings.streak[lang]}
              </span>
              <button
                onClick={() => onNavigate("chat")}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.02] active:scale-95"
              >
                {strings.continueStudying[lang]}
              </button>
            </div>
          </div>
        </div>

        {/* Medium priority row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <button
                    onClick={() => onNavigate("chat")}
                    className="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning transition-transform active:scale-95"
                  >
                    {strings.startCrashMode[lang]}
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.noExamDateYet[lang]}</p>
                <button
                  onClick={() => onNavigate("setup")}
                  className="mt-3 text-xs font-medium text-accent hover:underline"
                >
                  {strings.setExamDateCta[lang]}
                </button>
              </>
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
                    <div
                      title={`${weekdayShort[i][lang]}: ${minutes} ${strings.minutesShort[lang]}`}
                      className="w-full rounded-t-md bg-linear-to-t from-accent/80 to-accent transition-[height] duration-500 ease-out"
                      style={{ height: `${maxMinutes ? (minutes / maxMinutes) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-foreground-muted">{weekdayShort[i][lang]}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* AI Recommendation */}
        <div className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles size={16} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {strings.aiRecommendationTitle[lang]}
            </p>
            <p className="mt-1 text-sm text-foreground">{aiRecommendation[lang]}</p>
          </div>
        </div>

        {/* Subject Progress — gradient cards */}
        <div>
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
              const hasChapters = subject.chapters.length > 0;
              const completedChapters = getSubjectChaptersCompleted(subject);
              const totalChapters = getSubjectTotalChapters(subject);
              const nextChapterLabel = getSubjectNextChapterLabel(subject, lang);
              const isWeak = plan.weakSubjects.includes(subject.id);
              const readiness = getSubjectReadiness(subject, isWeak);
              const remainingMinutes = getSubjectRemainingMinutes(subject);
              const hue = (i * 47) % 360;

              return (
                <div
                  key={subject.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:border-accent/40 hover:shadow-md"
                >
                  <button
                    onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                    className="relative w-full p-4 text-left"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/20 via-accent/5 to-transparent"
                      style={{ filter: `hue-rotate(${hue}deg)` }}
                    />
                    <div className="relative flex items-center gap-3">
                      <CircularProgress value={progress} size={48} strokeWidth={5} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium">{subject.name[lang]}</p>
                          {isCompleted && (
                            <span className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                              <Trophy size={9} strokeWidth={2} />
                              {strings.completedBadge[lang]}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground-muted">
                          <span className="flex items-center gap-1">
                            <BookOpenCheck size={10} strokeWidth={1.75} />
                            {completedChapters}/{totalChapters} {strings.chaptersLabel[lang]}
                          </span>
                          <span className="flex items-center gap-1">
                            <History size={10} strokeWidth={1.75} />
                            {formatLastStudied(subject.lastStudiedDaysAgo, lang)}
                          </span>
                        </div>
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
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                      isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-border p-4">
                        <AnimatedProgressBar value={progress} className="mb-3" />

                        <div className="mb-3 grid grid-cols-2 gap-2.5">
                          <div className="rounded-lg bg-surface-muted px-3 py-2">
                            <p className="flex items-center gap-1 text-[10px] text-foreground-muted">
                              <Clock size={10} strokeWidth={1.75} />
                              {strings.timeRemaining[lang]}
                            </p>
                            <p className="mt-0.5 text-sm font-medium">
                              {formatTimeRemaining(remainingMinutes, lang)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-muted px-3 py-2">
                            <p className="flex items-center gap-1 text-[10px] text-foreground-muted">
                              <Target size={10} strokeWidth={1.75} />
                              {strings.examReadiness[lang]}
                            </p>
                            <p className="mt-0.5 text-sm font-medium">{readiness}%</p>
                          </div>
                        </div>

                        {hasChapters && (
                          <div className="flex flex-col gap-1.5">
                            {subject.chapters.map((c) => (
                              <div key={c.id} className="flex items-center gap-2 text-xs">
                                <span
                                  className={`flex size-4 shrink-0 items-center justify-center rounded-full ${
                                    c.status === "mastered"
                                      ? "bg-success text-white"
                                      : "border border-border text-transparent"
                                  }`}
                                >
                                  <Check size={9} strokeWidth={3} />
                                </span>
                                <span
                                  className={`flex-1 truncate ${
                                    c.status === "mastered" ? "text-foreground-muted line-through" : ""
                                  }`}
                                >
                                  {c.name[lang]}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => onNavigate("study")}
                          className="mt-3 text-xs font-medium text-accent hover:underline"
                        >
                          {strings.viewInStudyPlan[lang]} →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Collapsible details */}
        <div>
          <button
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
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
              detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-3">
                <Card>
                  <CardTitle icon={TrendingDown}>{strings.weakTopics[lang]}</CardTitle>
                  {weakSubjects.length === 0 ? (
                    <>
                      <p className="text-sm text-foreground-muted">{strings.noWeakTopicsYet[lang]}</p>
                      <button
                        onClick={() => onNavigate("setup")}
                        className="mt-3 text-xs font-medium text-accent hover:underline"
                      >
                        {strings.addWeakTopicsCta[lang]}
                      </button>
                    </>
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
        </div>
      </div>
    </div>
  );
}
