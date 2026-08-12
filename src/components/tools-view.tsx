"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Timer, NotebookPen, AlertTriangle, Archive, Map, CalendarClock, ArrowRight, type LucideIcon } from "lucide-react";
import { Modal } from "@/components/modal";
import { strings, type Lang } from "@/lib/i18n";
import type { ToolId } from "@/lib/tools-data";
import { notebookEntries } from "@/lib/tools-data";
import type { Countdown } from "@/lib/countdowns";
import {
  StudyTimerPanel,
  NotebookPanel,
  MistakeBookPanel,
  MyLibraryPanel,
  AiRoadmapPanel,
} from "@/components/tool-panels";
import { CountdownPanel } from "@/components/countdown-panel";

type ToolGroup = "learn" | "practice" | "reference";

const tools: {
  id: ToolId;
  group: ToolGroup;
  icon: LucideIcon;
  title: keyof typeof strings;
  desc: keyof typeof strings;
  status: { en: string; bn: string };
}[] = [
  {
    id: "notebook",
    group: "learn",
    icon: NotebookPen,
    title: "notebookTitle",
    desc: "notebookDesc",
    status: { en: "3 active notes", bn: "৩টি সক্রিয় নোট" },
  },
  {
    id: "roadmap",
    group: "learn",
    icon: Map,
    title: "roadmapTitle",
    desc: "roadmapDesc",
    status: { en: "Week 2 in progress", bn: "সপ্তাহ ২ চলমান" },
  },
  {
    id: "timer",
    group: "practice",
    icon: Timer,
    title: "timerTitle",
    desc: "timerDesc",
    status: { en: "Timer ready", bn: "টাইমার প্রস্তুত" },
  },
  {
    id: "mistakeBook",
    group: "practice",
    icon: AlertTriangle,
    title: "mistakeBookTitle",
    desc: "mistakeBookDesc",
    status: { en: "18 mistakes saved", bn: "১৮টি ভুল সংরক্ষিত" },
  },
  {
    id: "library",
    group: "reference",
    icon: Archive,
    title: "libraryTitle",
    desc: "libraryDesc",
    status: { en: "2 auto-summaries · 9 saved answers", bn: "২টি স্বয়ংক্রিয় সারাংশ · ৯টি সংরক্ষিত উত্তর" },
  },
  {
    id: "countdowns",
    group: "reference",
    icon: CalendarClock,
    title: "countdownsTitle",
    desc: "countdownsDesc",
    status: { en: "Every deadline in one place", bn: "সব সময়সীমা এক জায়গায়" },
  },
];

const toolGroups: { key: ToolGroup; label: keyof typeof strings }[] = [
  { key: "learn", label: "toolGroupLearn" },
  { key: "practice", label: "toolGroupPractice" },
  { key: "reference", label: "toolGroupReference" },
];

function ToolPanel({
  id,
  lang,
  countdowns,
  onAddCountdown,
  onUpdateCountdown,
  onDeleteCountdown,
  onSetMainCountdown,
  onReorderCountdowns,
}: {
  id: ToolId;
  lang: Lang;
  countdowns: Countdown[];
  onAddCountdown: (draft: { name: string; targetDate: string; description?: string }) => void;
  onUpdateCountdown: (id: string, draft: { name: string; targetDate: string; description?: string }) => void;
  onDeleteCountdown: (id: string) => void;
  onSetMainCountdown: (id: string) => void;
  onReorderCountdowns: (countdowns: Countdown[]) => void;
}) {
  switch (id) {
    case "timer":
      return <StudyTimerPanel lang={lang} />;
    case "notebook":
      return <NotebookPanel lang={lang} />;
    case "mistakeBook":
      return <MistakeBookPanel lang={lang} />;
    case "library":
      return <MyLibraryPanel lang={lang} />;
    case "roadmap":
      return <AiRoadmapPanel lang={lang} />;
    case "countdowns":
      return (
        <CountdownPanel
          lang={lang}
          countdowns={countdowns}
          onAdd={onAddCountdown}
          onUpdate={onUpdateCountdown}
          onDelete={onDeleteCountdown}
          onSetMain={onSetMainCountdown}
          onReorder={onReorderCountdowns}
        />
      );
  }
}

export function ToolsView({
  lang,
  countdowns,
  onAddCountdown,
  onUpdateCountdown,
  onDeleteCountdown,
  onSetMainCountdown,
  onReorderCountdowns,
}: {
  lang: Lang;
  countdowns: Countdown[];
  onAddCountdown: (draft: { name: string; targetDate: string; description?: string }) => void;
  onUpdateCountdown: (id: string, draft: { name: string; targetDate: string; description?: string }) => void;
  onDeleteCountdown: (id: string) => void;
  onSetMainCountdown: (id: string) => void;
  onReorderCountdowns: (countdowns: Countdown[]) => void;
}) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const active = tools.find((t) => t.id === activeTool);
  const continueTool = tools.find((t) => t.id === "notebook")!;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.toolsTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.toolsSubtitle[lang]}</p>
        </div>

        {/* Continue where you left off */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-foreground-strong">
                <continueTool.icon size={26} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  {strings.continueWhereLeftOff[lang]}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {strings[continueTool.title][lang]}
                </p>
                <p className="truncate text-sm text-foreground-muted">{notebookEntries[0].title[lang]}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTool(continueTool.id)}
              className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.02] active:scale-95"
            >
              {strings.resumeBtn[lang]}
            </button>
          </div>
        </div>

        {toolGroups.map((group) => {
          const groupTools = tools.filter((t) => t.group === group.key);
          if (groupTools.length === 0) return null;
          return (
            <div key={group.key} className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {strings[group.label][lang]}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {groupTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-colors duration-200 hover:bg-surface-muted"
                  >
                    <div className="relative flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-foreground transition-colors duration-200 group-hover:text-foreground-strong">
                          <tool.icon size={22} strokeWidth={1.75} />
                        </div>
                      </div>

                      <div>
                        <p className="text-base font-semibold tracking-tight">{strings[tool.title][lang]}</p>
                        <p className="mt-1 text-sm text-foreground-muted">{strings[tool.desc][lang]}</p>
                        <p className="mt-2.5 text-xs font-medium text-foreground-muted">{tool.status[lang]}</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTool(tool.id);
                        }}
                        className="mt-1 flex items-center justify-center gap-1.5 self-start rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors duration-200 group-hover:text-foreground"
                      >
                        {strings.quickLaunch[lang]}
                        <ArrowRight
                          size={13}
                          strokeWidth={2}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {active && (
          <Modal title={strings[active.title][lang]} onClose={() => setActiveTool(null)}>
            <ToolPanel
              id={active.id}
              lang={lang}
              countdowns={countdowns}
              onAddCountdown={onAddCountdown}
              onUpdateCountdown={onUpdateCountdown}
              onDeleteCountdown={onDeleteCountdown}
              onSetMainCountdown={onSetMainCountdown}
              onReorderCountdowns={onReorderCountdowns}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
