"use client";

import { useCountdown, type Countdown } from "@/lib/countdowns";
import { strings, type Lang } from "@/lib/i18n";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function MainCountdownStrip({
  lang,
  countdown,
  variant = "sidebar",
  onOpenDetails,
}: {
  lang: Lang;
  countdown: Countdown | null;
  variant?: "sidebar" | "mobile";
  /** Opens the full countdown manager (Tools → Countdowns). */
  onOpenDetails?: () => void;
}) {
  // No seconds are shown here, so a 30s tick is plenty — avoids a
  // once-a-second re-render running for the lifetime of the app.
  const remaining = useCountdown(countdown?.targetDate, 30_000);
  if (!countdown) return null;

  const stateLabel =
    remaining.state === "completed"
      ? strings.countdownCompletedLabel[lang]
      : remaining.state === "today"
      ? strings.countdownExamDayLabel[lang]
      : null;

  if (variant === "mobile") {
    return (
      <button
        onClick={onOpenDetails}
        disabled={!onOpenDetails}
        className="block w-full border-b border-border bg-sidebar px-4 py-2 text-left"
      >
        <p className="truncate text-xs text-foreground-muted">
          <span className="font-medium text-foreground">{countdown.name}</span>
          {" · "}
          {stateLabel ?? `${remaining.days} ${strings.daysWord[lang]}`}
        </p>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenDetails}
      disabled={!onOpenDetails}
      className="mx-3 mt-2 block rounded-lg border border-border bg-surface px-2.5 py-2 text-left transition-colors duration-150 enabled:hover:bg-surface-muted"
    >
      <p className="truncate text-xs font-medium text-foreground">{countdown.name}</p>
      <p className="mt-0.5 truncate text-[11px] tabular-nums text-foreground-muted">
        {stateLabel ??
          `${remaining.days} ${strings.daysWord[lang]} · ${pad(remaining.hours)} ${strings.hoursWord[lang]} · ${pad(
            remaining.minutes
          )} ${strings.minutesWord[lang]}`}
      </p>
    </button>
  );
}
