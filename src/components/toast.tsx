"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
};

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-xs flex-col gap-2 sm:right-6 sm:top-6"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xl"
          >
            {t.icon && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <t.icon size={16} strokeWidth={1.75} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 truncate text-xs text-foreground-muted">{t.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
