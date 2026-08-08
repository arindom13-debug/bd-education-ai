"use client";

import { motion } from "framer-motion";
import { History, ArrowRight } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { chatHistory, type ConversationContext } from "@/lib/chat-data";
import { subjects } from "@/lib/curriculum-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const CONTEXT_LABEL_KEY: Record<ConversationContext, keyof typeof strings> = {
  learning: "contextLearning",
  revision: "contextRevision",
  practice: "contextPractice",
};

const GROUPS: { key: "today" | "yesterday"; labelKey: keyof typeof strings }[] = [
  { key: "today", labelKey: "today" },
  { key: "yesterday", labelKey: "yesterday" },
];

export function RecentChatsSection({
  lang,
  onOpenChat,
}: {
  lang: Lang;
  onOpenChat: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-4 sm:p-5"
    >
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        <History size={13} strokeWidth={1.75} />
        {strings.recentChatsLabel[lang]}
      </p>
      <div className="flex flex-col gap-3">
        {GROUPS.map((group) => {
          const threads = chatHistory.filter((t) => t.group === group.key);
          if (threads.length === 0) return null;
          return (
            <div key={group.key}>
              <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings[group.labelKey][lang]}
              </p>
              <div className="flex flex-col">
                {threads.map((thread) => {
                  const subject = subjects.find((s) => s.id === thread.subjectId);
                  const contextLabel = strings[CONTEXT_LABEL_KEY[thread.context]][lang];
                  return (
                    <button
                      key={thread.id}
                      onClick={() => onOpenChat(thread.id)}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-surface-muted"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{thread.title[lang]}</p>
                        <p className="mt-0.5 truncate text-xs text-foreground-muted">
                          {subject ? `${subject.name[lang]} · ` : ""}
                          {contextLabel} · {thread.relativeTime[lang]}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        {strings.resumeBtn[lang]}
                        <ArrowRight size={12} strokeWidth={2} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
