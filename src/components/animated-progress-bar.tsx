"use client";

import { motion } from "framer-motion";

export function AnimatedProgressBar({
  value,
  className = "",
  height = "h-2",
}: {
  value: number;
  className?: string;
  height?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`relative ${height} w-full overflow-hidden rounded-full bg-surface-muted ${className}`}>
      <motion.div
        className="h-full rounded-full bg-linear-to-r from-accent/80 to-accent shadow-[0_0_8px_var(--color-accent)]"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
