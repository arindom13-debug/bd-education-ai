"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";
import { getAiRecommendation } from "@/lib/ai-recommendation";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AiRecommendationStrip({
  lang,
  subjects,
  streakDays,
  onAction,
}: {
  lang: Lang;
  subjects: Subject[];
  streakDays: number;
  onAction: () => void;
}) {
  const { message, actionLabel } = getAiRecommendation(lang, subjects, streakDays);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <Sparkles size={16} strokeWidth={1.75} />
        </motion.div>
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onClick={onAction}
        className="flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground sm:self-auto"
      >
        {actionLabel}
        <ArrowRight size={14} strokeWidth={2} />
      </motion.button>
    </motion.div>
  );
}
