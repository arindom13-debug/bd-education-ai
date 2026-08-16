"use client";

import { motion } from "framer-motion";
import { MessageSquare, BookOpen, CalendarClock, Gauge, type LucideIcon } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { CanvasView } from "@/components/sidebar";

const EASE = [0.16, 1, 0.3, 1] as const;

const tabs: { id: CanvasView; icon: LucideIcon; label: Record<Lang, string> }[] = [
  { id: "chat", icon: MessageSquare, label: strings.chat },
  { id: "study", icon: BookOpen, label: strings.studyPlan },
  { id: "schedule", icon: CalendarClock, label: strings.scheduleNav },
  { id: "progress", icon: Gauge, label: strings.studentHub },
];

export function BottomNav({
  lang,
  active,
  onSelect,
}: {
  lang: Lang;
  active: CanvasView;
  onSelect: (id: CanvasView) => void;
}) {
  return (
    <nav aria-label={strings.mainNavigationLabel[lang]} className="flex items-stretch border-t border-border bg-sidebar">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors duration-150 active:scale-95 ${
              isActive ? "font-medium text-foreground-strong" : "text-foreground-muted"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="bottom-nav-indicator"
                transition={{ duration: 0.25, ease: EASE }}
                className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
              />
            )}
            <tab.icon size={18} strokeWidth={1.75} />
            {tab.label[lang]}
          </button>
        );
      })}
    </nav>
  );
}
