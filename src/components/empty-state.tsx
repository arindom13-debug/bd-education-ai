"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  tone = "accent",
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
  tone?: "accent" | "warning";
  compact?: boolean;
}) {
  const iconClasses = tone === "warning" ? "bg-warning/15 text-warning" : "bg-accent-soft text-accent";
  const buttonClasses = tone === "warning" ? "bg-warning text-white" : "bg-accent text-accent-foreground";
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "gap-1.5 py-1" : "gap-2 py-2"}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${
          compact ? "size-9" : "size-11"
        } ${iconClasses}`}
      >
        <Icon size={compact ? 16 : 18} strokeWidth={1.75} />
      </div>
      <p className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{title}</p>
      <p className={`max-w-[240px] text-foreground-muted ${compact ? "text-[11px]" : "text-xs"}`}>
        {description}
      </p>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onCtaClick}
        className={`mt-1 rounded-lg px-4 py-2 text-xs font-medium transition-transform active:scale-95 ${buttonClasses}`}
      >
        {ctaLabel}
      </motion.button>
    </div>
  );
}
