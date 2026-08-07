"use client";

import { MessageSquare, BookOpen, Gauge, type LucideIcon } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { CanvasView } from "@/components/sidebar";

const tabs: { id: CanvasView; icon: LucideIcon; label: Record<Lang, string> }[] = [
  { id: "chat", icon: MessageSquare, label: strings.chat },
  { id: "study", icon: BookOpen, label: strings.studyPlan },
  { id: "progress", icon: Gauge, label: strings.progress },
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
    <nav className="flex items-stretch border-t border-border bg-surface">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
            active === tab.id ? "font-medium text-accent" : "text-foreground-muted"
          }`}
        >
          <tab.icon size={18} strokeWidth={1.75} />
          {tab.label[lang]}
        </button>
      ))}
    </nav>
  );
}
