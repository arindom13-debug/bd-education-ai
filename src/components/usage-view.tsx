"use client";

import { MessageSquare, CalendarClock, Wrench, ArrowUpRight, type LucideIcon } from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { strings, type Lang } from "@/lib/i18n";
import type { CanvasView } from "@/components/sidebar";

const USAGE_METERS: {
  icon: LucideIcon;
  label: keyof typeof strings;
  used: number;
  limit: number;
}[] = [
  { icon: MessageSquare, label: "usageAiMessagesLabel", used: 37, limit: 100 },
  { icon: CalendarClock, label: "usageStudyPlanGenLabel", used: 4, limit: 10 },
  { icon: Wrench, label: "usageAiToolsLabel", used: 12, limit: 30 },
];

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

export function UsageView({ lang, onNavigate }: { lang: Lang; onNavigate: (view: CanvasView) => void }) {
  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.usagePageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.usagePageSubtitle[lang]}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-lg bg-surface-muted px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.usageCurrentPlanLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">{strings.profileFreePlanLabel[lang]}</p>
            </div>
            <div className="rounded-lg bg-surface-muted px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.usageResetDateLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">{lang === "en" ? "September 1, 2026" : "১ সেপ্টেম্বর, ২০২৬"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          {USAGE_METERS.map((meter) => (
            <MeterRow
              key={meter.label}
              icon={meter.icon}
              label={strings[meter.label][lang]}
              used={meter.used}
              limit={meter.limit}
            />
          ))}
        </div>

        <button
          onClick={() => onNavigate("billing")}
          className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.02] active:scale-95"
        >
          {strings.usageUpgradeForMoreBtn[lang]}
          <ArrowUpRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
