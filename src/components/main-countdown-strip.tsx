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
}: {
  lang: Lang;
  countdown: Countdown | null;
  variant?: "sidebar" | "mobile";
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
      <div className="border-b border-border bg-sidebar px-4 py-2">
        <p className="truncate text-xs text-foreground-muted">
          <span className="font-medium text-foreground">{countdown.name}</span>
          {" · "}
          {stateLabel ?? `${remaining.days} ${strings.daysWord[lang]}`}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors duration-150">
      <p className="truncate text-xs font-medium text-foreground">{countdown.name}</p>
      <p className="mt-0.5 truncate text-[11px] tabular-nums text-foreground-muted">
        {stateLabel ??
          `${remaining.days} ${strings.daysWord[lang]} · ${pad(remaining.hours)} ${strings.hoursWord[lang]} · ${pad(
            remaining.minutes
          )} ${strings.minutesWord[lang]}`}
      </p>
    </div>
  );
}
