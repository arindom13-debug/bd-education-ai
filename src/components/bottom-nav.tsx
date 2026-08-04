"use client";

import { strings, type Lang } from "@/lib/i18n";
import type { CanvasView } from "@/components/sidebar";

const tabs: { id: CanvasView; icon: string; label: Record<Lang, string> }[] = [
  { id: "chat", icon: "💬", label: strings.chat },
  { id: "study", icon: "▤", label: strings.studyPlan },
  { id: "progress", icon: "◔", label: strings.progress },
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
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs ${
            active === tab.id ? "text-accent" : "text-foreground-muted"
          }`}
        >
          <span className="text-base leading-none">{tab.icon}</span>
          {tab.label[lang]}
        </button>
      ))}
    </nav>
  );
}
