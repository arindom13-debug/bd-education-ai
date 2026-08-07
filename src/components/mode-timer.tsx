"use client";

import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";

export function ModeTimer({
  lang,
  presets,
  color,
  onColor = "#ffffff",
}: {
  lang: Lang;
  presets: { minutes: number; label: { en: string; bn: string } }[];
  color: string;
  onColor?: string;
}) {
  const [presetIndex, setPresetIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(presets[0].minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const selectPreset = (i: number) => {
    setPresetIndex(i);
    setSecondsLeft(presets[i].minutes * 60);
    setRunning(false);
  };

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {presets.map((p, i) => {
          const active = presetIndex === i;
          return (
            <button
              key={p.minutes}
              onClick={() => selectPreset(i)}
              style={active ? { borderColor: color, backgroundColor: `${color}1f`, color } : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                active ? "" : "border-border text-foreground-muted"
              }`}
            >
              {p.label[lang]}
            </button>
          );
        })}
      </div>

      <div className="text-5xl font-bold tabular-nums tracking-tight" style={{ color }}>
        {minutes}:{seconds}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          style={{ backgroundColor: color, color: onColor }}
          className="flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium transition-transform active:scale-95"
        >
          {running ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
          {running ? strings.timerPause[lang] : strings.timerStart[lang]}
        </button>
        <button
          onClick={() => selectPreset(presetIndex)}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-transform hover:text-foreground active:scale-95"
        >
          <RotateCcw size={15} strokeWidth={1.75} />
          {strings.timerReset[lang]}
        </button>
      </div>
    </div>
  );
}
