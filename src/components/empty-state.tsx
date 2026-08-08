"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  accentColor,
  onAccentColor = "#ffffff",
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
  accentColor?: string;
  onAccentColor?: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "gap-1.5 py-1" : "gap-2 py-2"}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${
          compact ? "size-9" : "size-11"
        } ${accentColor ? "" : "bg-accent-soft text-accent"}`}
        style={accentColor ? { backgroundColor: `${accentColor}1f`, color: accentColor } : undefined}
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
        style={accentColor ? { backgroundColor: accentColor, color: onAccentColor } : undefined}
        className={`mt-1 rounded-lg px-4 py-2 text-xs font-medium transition-transform active:scale-95 ${
          accentColor ? "" : "bg-accent text-accent-foreground"
        }`}
      >
        {ctaLabel}
      </motion.button>
    </div>
  );
}
