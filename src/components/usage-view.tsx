"use client";

import { useRef, useState } from "react";
import {
  Sparkles,
  Clock,
  Zap,
  MessageSquare,
  BarChart3,
  History,
  Gauge,
  BookOpen,
  PenTool,
  RotateCcw,
  MoreHorizontal,
  Paperclip,
  Mic,
  type LucideIcon,
} from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { CircularProgress } from "@/components/circular-progress";
import { strings, type Lang } from "@/lib/i18n";
import type { CanvasView } from "@/components/sidebar";
import {
  usageCategories,
  usageBreakdown,
  recentUsageActivity,
  usageLimits,
  usageSummary,
  type UsageCategory,
  type UsagePeriod,
} from "@/lib/usage-data";

const CATEGORY_ICON: Record<UsageCategory, LucideIcon> = {
  aiChat: MessageSquare,
  attachments: Paperclip,
  voiceInput: Mic,
  learning: BookOpen,
  practice: PenTool,
  revision: RotateCcw,
  other: MoreHorizontal,
};

const CATEGORY_LABEL_KEY: Record<UsageCategory, keyof typeof strings> = {
  aiChat: "usageCategoryAiChat",
  attachments: "usageCategoryAttachments",
  voiceInput: "usageCategoryVoiceInput",
  learning: "usageCategoryLearning",
  practice: "usageCategoryPractice",
  revision: "usageCategoryRevision",
  other: "usageCategoryOther",
};

function formatDuration(totalMinutes: number, lang: Lang): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${strings.minutesShort[lang]}`;
  if (minutes === 0) return `${hours} ${strings.hoursShort[lang]}`;
  return `${hours}${strings.hoursShort[lang]} ${minutes}${strings.minutesShort[lang]}`;
}

function SummaryCard({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        <Icon size={13} strokeWidth={1.75} />
        {label}
      </p>
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-foreground-muted">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function MeterRow({ icon: Icon, label, used, limit }: { icon: LucideIcon; label: string; used: number; limit: number }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0 last:pb-1">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon size={15} strokeWidth={1.75} className="text-foreground-muted" />
          {label}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-foreground-muted">
          {used} / {limit}
        </span>
      </div>
      <AnimatedProgressBar value={(used / limit) * 100} height="h-1.5" />
    </div>
  );
}

function PeriodTabs({
  value,
  onChange,
  lang,
}: {
  value: UsagePeriod;
  onChange: (period: UsagePeriod) => void;
  lang: Lang;
}) {
  const options: { value: UsagePeriod; label: string }[] = [
    { value: "today", label: strings.usagePeriodToday[lang] },
    { value: "week", label: strings.usagePeriodWeek[lang] },
    { value: "month", label: strings.usagePeriodMonth[lang] },
  ];
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const available = optionRefs.current.filter(Boolean) as HTMLButtonElement[];
    if (available.length === 0) return;
    const currentIndex = available.findIndex((el) => el === document.activeElement);
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + dir + available.length) % available.length;
    available[nextIndex]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={strings.usagePeriodLabel[lang]} className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => {
            optionRefs.current[i] = el;
          }}
          role="radio"
          aria-checked={value === opt.value}
          tabIndex={value === opt.value ? 0 : -1}
          onClick={() => onChange(opt.value)}
          onKeyDown={handleKeyDown}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
            value === opt.value ? "bg-accent-soft text-accent" : "text-foreground-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function UsageView({ lang, onNavigate }: { lang: Lang; onNavigate: (view: CanvasView) => void }) {
  const [period, setPeriod] = useState<UsagePeriod>("week");

  const { aiText, attachments, voiceInput, studyMinutes, aiSessions, messages } = usageSummary;
  const breakdown = usageBreakdown[period];
  const maxCategoryMinutes = Math.max(...usageCategories.map((c) => breakdown[c]), 1);

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.usagePageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.usagePageSubtitle[lang]}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard icon={Sparkles} label={strings.usageOverviewAiTextLabel[lang]}>
            <div className="mt-4 flex items-center gap-4">
              <CircularProgress
                value={(aiText.used / aiText.limit) * 100}
                size={56}
                strokeWidth={5}
                label={`${aiText.used}/${aiText.limit}`}
              />
              <div className="flex flex-col gap-1.5 text-xs">
                <p className="text-foreground-muted">
                  {strings.usageUsedLabel[lang]}: <span className="font-medium text-foreground">{aiText.used}</span>
                </p>
                <p className="text-foreground-muted">
                  {strings.usageRemainingLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">{aiText.limit - aiText.used}</span>
                </p>
                <p className="text-foreground-muted">
                  {strings.usageLimitLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">
                    {aiText.limit} {strings.usageRequestsWord[lang]}
                  </span>
                </p>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard icon={Paperclip} label={strings.usageOverviewAttachmentsLabel[lang]}>
            <div className="mt-4 flex items-center gap-4">
              <CircularProgress
                value={(attachments.used / attachments.limit) * 100}
                size={56}
                strokeWidth={5}
                label={`${attachments.used}/${attachments.limit}`}
              />
              <div className="flex flex-col gap-1.5 text-xs">
                <p className="text-foreground-muted">
                  {strings.usageFilesProcessedLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">{attachments.used}</span>
                </p>
                <p className="text-foreground-muted">
                  {strings.usageRemainingLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">{attachments.limit - attachments.used}</span>
                </p>
                <p className="text-foreground-muted">
                  {strings.usageLimitLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">
                    {attachments.limit} {strings.usageFilesWord[lang]}
                  </span>
                </p>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard icon={Mic} label={strings.usageOverviewVoiceInputLabel[lang]}>
            <div className="mt-4 flex items-center gap-4">
              <CircularProgress
                value={(voiceInput.used / voiceInput.limit) * 100}
                size={56}
                strokeWidth={5}
                label={`${voiceInput.used}/${voiceInput.limit}`}
              />
              <div className="flex flex-col gap-1.5 text-xs">
                <p className="text-foreground-muted">
                  {strings.usageVoiceMinutesUsedLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">{voiceInput.used}</span>
                </p>
                <p className="text-foreground-muted">
                  {strings.usageRemainingLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">{voiceInput.limit - voiceInput.used}</span>
                </p>
                <p className="text-foreground-muted">
                  {strings.usageLimitLabel[lang]}:{" "}
                  <span className="font-medium text-foreground">
                    {voiceInput.limit} {strings.minutesWord[lang]}
                  </span>
                </p>
              </div>
            </div>
          </SummaryCard>

          <SummaryCard icon={Clock} label={strings.usageStudyTimeLabel[lang]}>
            <div className="mt-4 flex flex-col gap-2">
              <StatRow label={strings.usageTotalLabel[lang]} value={formatDuration(studyMinutes.total, lang)} />
              <StatRow label={strings.usageThisWeekLabel[lang]} value={formatDuration(studyMinutes.week, lang)} />
              <StatRow label={strings.usageThisMonthLabel[lang]} value={formatDuration(studyMinutes.month, lang)} />
            </div>
          </SummaryCard>

          <SummaryCard icon={Zap} label={strings.usageAiSessionsLabel[lang]}>
            <div className="mt-4 flex flex-col gap-2">
              <StatRow label={strings.usageTotalLabel[lang]} value={aiSessions.total} />
              <StatRow label={strings.usageThisWeekLabel[lang]} value={aiSessions.week} />
              <StatRow label={strings.usageThisMonthLabel[lang]} value={aiSessions.month} />
            </div>
          </SummaryCard>

          <SummaryCard icon={MessageSquare} label={strings.usageMessagesLabel[lang]}>
            <div className="mt-4 flex flex-col gap-2">
              <StatRow label={strings.usageTotalLabel[lang]} value={messages.total} />
              <StatRow label={strings.usageThisWeekLabel[lang]} value={messages.week} />
              <StatRow label={strings.usageThisMonthLabel[lang]} value={messages.month} />
            </div>
          </SummaryCard>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                <BarChart3 size={13} strokeWidth={1.75} />
                {strings.usageBreakdownTitle[lang]}
              </p>
              <p className="mt-1 text-xs text-foreground-muted">{strings.usageBreakdownSubtitle[lang]}</p>
            </div>
            <PeriodTabs value={period} onChange={setPeriod} lang={lang} />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {usageCategories.map((cat) => {
              const Icon = CATEGORY_ICON[cat];
              const minutes = breakdown[cat];
              return (
                <div key={cat} className="flex items-center gap-3">
                  <Icon size={14} strokeWidth={1.75} className="shrink-0 text-foreground-muted" />
                  <span className="w-20 shrink-0 truncate text-xs text-foreground-muted sm:w-28">
                    {strings[CATEGORY_LABEL_KEY[cat]][lang]}
                  </span>
                  <AnimatedProgressBar value={(minutes / maxCategoryMinutes) * 100} height="h-2" className="flex-1" />
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-foreground-muted">
                    {formatDuration(minutes, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <History size={13} strokeWidth={1.75} />
            {strings.usageRecentActivityTitle[lang]}
          </p>
          <div className="flex flex-col">
            {recentUsageActivity.map((item) => {
              const Icon = CATEGORY_ICON[item.type];
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate("chat")}
                  className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-surface-muted"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
                      <Icon size={14} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.subject[lang]} — {item.topic[lang]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-foreground-muted">{item.when[lang]}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-foreground-muted">{item.amount[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Gauge size={13} strokeWidth={1.75} />
            {strings.usageLimitsTitle[lang]}
          </p>
          <div>
            <MeterRow
              icon={Sparkles}
              label={strings.usageLimitAiRequestsLabel[lang]}
              used={usageLimits.aiRequests.current}
              limit={usageLimits.aiRequests.limit}
            />
            <MeterRow
              icon={BookOpen}
              label={strings.usageLimitDailyStudySessionsLabel[lang]}
              used={usageLimits.dailyStudySessions.current}
              limit={usageLimits.dailyStudySessions.limit}
            />
            <MeterRow
              icon={PenTool}
              label={strings.usageLimitPracticeSessionsLabel[lang]}
              used={usageLimits.practiceSessions.current}
              limit={usageLimits.practiceSessions.limit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
