"use client";

import { Modal } from "@/components/modal";
import { strings, type Lang } from "@/lib/i18n";

const SHORTCUT_GROUPS: {
  titleKey: keyof typeof strings;
  items: { combo: string; labelKey: keyof typeof strings }[];
}[] = [
  {
    titleKey: "shortcutGroupNavigation",
    items: [
      { combo: "Ctrl / Cmd + K", labelKey: "shortcutOpenSearch" },
      { combo: "Ctrl / Cmd + N", labelKey: "shortcutNewChat" },
      { combo: "Ctrl / Cmd + Shift + N", labelKey: "shortcutNewNote" },
    ],
  },
  {
    titleKey: "shortcutGroupChat",
    items: [{ combo: "Ctrl / Cmd + Enter", labelKey: "shortcutSendMessage" }],
  },
  {
    titleKey: "shortcutGroupInterface",
    items: [
      { combo: "Esc", labelKey: "shortcutCloseModal" },
      { combo: "Ctrl / Cmd + /", labelKey: "shortcutShowShortcuts" },
    ],
  },
];

export function KeyboardShortcutsModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  return (
    <Modal title={strings.shortcutsModalTitle[lang]} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.titleKey}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {strings[group.titleKey][lang]}
            </p>
            <div className="flex flex-col">
              {group.items.map((item) => (
                <div
                  key={item.combo}
                  className="flex items-center justify-between gap-4 border-b border-border py-2.5 last:border-b-0"
                >
                  <span className="text-sm">{strings[item.labelKey][lang]}</span>
                  <kbd className="rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] font-medium text-foreground-muted">
                    {item.combo}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
