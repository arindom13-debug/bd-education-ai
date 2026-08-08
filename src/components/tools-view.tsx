"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Timer,
  NotebookPen,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Archive,
  Map,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { strings, type Lang } from "@/lib/i18n";
import type { ToolId } from "@/lib/tools-data";
import { notebookEntries } from "@/lib/tools-data";
import {
  StudyTimerPanel,
  NotebookPanel,
  AiNotebookPanel,
  MistakeBookPanel,
  SavedAnswersPanel,
  StudyVaultPanel,
  AiRoadmapPanel,
} from "@/components/tool-panels";

const tools: {
  id: ToolId;
  icon: LucideIcon;
  title: keyof typeof strings;
  desc: keyof typeof strings;
  status: { en: string; bn: string };
  hue: number;
}[] = [
  {
    id: "timer",
    icon: Timer,
    title: "timerTitle",
    desc: "timerDesc",
    status: { en: "Timer ready", bn: "টাইমার প্রস্তুত" },
    hue: 0,
  },
  {
    id: "notebook",
    icon: NotebookPen,
    title: "notebookTitle",
    desc: "notebookDesc",
    status: { en: "3 active notes", bn: "৩টি সক্রিয় নোট" },
    hue: 50,
  },
  {
    id: "aiNotebook",
    icon: Sparkles,
    title: "aiNotebookTitle",
    desc: "aiNotebookDesc",
    status: { en: "2 auto-summaries", bn: "২টি স্বয়ংক্রিয় সারাংশ" },
    hue: 100,
  },
  {
    id: "mistakeBook",
    icon: AlertTriangle,
    title: "mistakeBookTitle",
    desc: "mistakeBookDesc",
    status: { en: "18 mistakes saved", bn: "১৮টি ভুল সংরক্ষিত" },
    hue: 150,
  },
  {
    id: "savedAnswers",
    icon: FileCheck2,
    title: "savedAnswersTitle",
    desc: "savedAnswersDesc",
    status: { en: "9 answers saved", bn: "৯টি উত্তর সংরক্ষিত" },
    hue: 200,
  },
  {
    id: "vault",
    icon: Archive,
    title: "vaultTitle",
    desc: "vaultDesc",
    status: { en: "35 items stored", bn: "৩৫টি আইটেম সংরক্ষিত" },
    hue: 250,
  },
  {
    id: "roadmap",
    icon: Map,
    title: "roadmapTitle",
    desc: "roadmapDesc",
    status: { en: "Week 2 in progress", bn: "সপ্তাহ ২ চলমান" },
    hue: 300,
  },
];

function ToolPanel({ id, lang }: { id: ToolId; lang: Lang }) {
  switch (id) {
    case "timer":
      return <StudyTimerPanel lang={lang} />;
    case "notebook":
      return <NotebookPanel lang={lang} />;
    case "aiNotebook":
      return <AiNotebookPanel lang={lang} />;
    case "mistakeBook":
      return <MistakeBookPanel lang={lang} />;
    case "savedAnswers":
      return <SavedAnswersPanel lang={lang} />;
    case "vault":
      return <StudyVaultPanel lang={lang} />;
    case "roadmap":
      return <AiRoadmapPanel lang={lang} />;
  }
}

export function ToolsView({ lang }: { lang: Lang }) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const active = tools.find((t) => t.id === activeTool);
  const continueTool = tools.find((t) => t.id === "notebook")!;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{strings.toolsTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.toolsSubtitle[lang]}</p>
        </div>

        {/* Continue where you left off */}
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface p-6">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/15 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/30">
                <continueTool.icon size={26} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-accent">
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {tools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* base subtle gradient, always visible, tinted per tool */}
              <div
                className="pointer-events-none absolute inset-0 bg-linear-to-br from-accent/15 via-accent/5 to-transparent"
                style={{ filter: `hue-rotate(${tool.hue}deg)` }}
              />
              {/* animated glow ring, appears on hover */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-accent opacity-0 shadow-[0_0_30px_-6px_var(--color-accent)] transition-opacity duration-300 group-hover:opacity-100"
                style={{ filter: `hue-rotate(${tool.hue}deg)` }}
              />

              <div className="relative flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-md shadow-accent/20 transition-transform duration-300 group-hover:scale-110"
                    style={{ filter: `hue-rotate(${tool.hue}deg)` }}
                  >
                    <tool.icon size={22} strokeWidth={1.75} />
                  </div>
                </div>

                <div>
                  <p className="text-base font-semibold tracking-tight">{strings[tool.title][lang]}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{strings[tool.desc][lang]}</p>
                  <p className="mt-2.5 text-xs font-medium text-accent">{tool.status[lang]}</p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTool(tool.id);
                  }}
                  className="mt-1 flex items-center justify-center gap-1.5 self-start rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors group-hover:border-accent/50 group-hover:text-accent"
                >
                  {strings.quickLaunch[lang]}
                  <ArrowRight
                    size={13}
                    strokeWidth={2}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <Modal title={strings[active.title][lang]} onClose={() => setActiveTool(null)}>
            <ToolPanel id={active.id} lang={lang} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
