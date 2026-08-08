"use client";

import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/** A soft two-note chime synthesized on the fly — a stand-in until real sound design lands. */
export function playSuccessChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 783.99]; // C5, G5 — a gentle, understated interval, not a game jingle
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.36);
    });
    setTimeout(() => ctx.close(), 700);
  } catch {
    // Web Audio unavailable — celebration stays purely visual.
  }
}

const CONFETTI_COLORS = ["var(--color-success)", "var(--color-foreground)", "var(--color-accent)"];

function CelebrationConfetti() {
  const pieces = Array.from({ length: 9 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {pieces.map((_, i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const distance = 28 + (i % 3) * 9;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - 8;
        const rotate = ((i * 53) % 160) - 80;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
            animate={{ opacity: 0, x, y, rotate, scale: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 size-1.5 rounded-xs"
            style={{ backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }}
          />
        );
      })}
    </div>
  );
}

/** Full celebration overlay for a card that just reached 100% — glow, confetti, nothing childish. */
export function CompletionCelebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible rounded-[inherit]">
      <motion.div
        initial={{ opacity: 0.5, scale: 0.85 }}
        animate={{ opacity: 0, scale: 1.15 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: "0 0 0 1px var(--color-success), 0 0 28px 4px var(--color-success)" }}
      />
      <CelebrationConfetti />
    </div>
  );
}

export function CompletedBadge({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
    >
      {children}
    </motion.span>
  );
}
