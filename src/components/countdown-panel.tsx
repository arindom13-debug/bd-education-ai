"use client";

import { useState } from "react";
import { Plus, Star, Trash2, GripVertical, CalendarClock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { strings, type Lang } from "@/lib/i18n";
import { useCountdown, type Countdown, type RemainingTime } from "@/lib/countdowns";

type CountdownDraft = { name: string; targetDate: string; description?: string };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDetailed(r: RemainingTime, lang: Lang): string {
  if (r.state === "completed") return strings.countdownCompletedLabel[lang];
  if (r.state === "today") return strings.countdownExamDayLabel[lang];
  return `${r.days}d ${pad(r.hours)}h ${pad(r.minutes)}m ${pad(r.seconds)}s`;
}

function CountdownForm({
  lang,
  initial,
  onSubmit,
  onCancel,
}: {
  lang: Lang;
  initial?: Countdown;
  onSubmit: (draft: CountdownDraft) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.targetDate ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const submit = () => {
    if (!name.trim() || !date) return;
    onSubmit({ name: name.trim(), targetDate: date, description: description.trim() || undefined });
  };

  const inputClasses =
    "w-full rounded-md border border-border bg-control px-2.5 py-1.5 text-sm outline-none focus:border-accent";

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-background p-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground-muted">{strings.countdownNameLabel[lang]}</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={strings.countdownNamePlaceholder[lang]}
          className={inputClasses}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground-muted">{strings.countdownDateLabel[lang]}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClasses} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground-muted">{strings.countdownDescLabel[lang]}</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={strings.countdownDescPlaceholder[lang]}
          className={inputClasses}
        />
      </div>
      <div className="mt-1 flex gap-2">
        <button
          onClick={submit}
          disabled={!name.trim() || !date}
          className="flex-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground disabled:opacity-40"
        >
          {initial ? strings.saveBtn[lang] : strings.createCountdownBtn[lang]}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground"
        >
          {strings.cancelBtn[lang]}
        </button>
      </div>
    </div>
  );
}

function CountdownCard({
  lang,
  countdown,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onSetMain,
  onSave,
  onDelete,
}: {
  lang: Lang;
  countdown: Countdown;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onSetMain: () => void;
  onSave: (draft: CountdownDraft) => void;
  onDelete: () => void;
}) {
  const remaining = useCountdown(countdown.targetDate, 1000);
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CountdownForm
        lang={lang}
        initial={countdown}
        onSubmit={(draft) => {
          onSave(draft);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative rounded-xl border bg-surface p-3.5 transition-[border-color,opacity] duration-180 ${
        countdown.isMain ? "border-foreground-faint" : "border-border"
      } ${isDragging ? "opacity-60" : ""} ${isDragOver ? "ring-1 ring-accent/50" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 cursor-grab touch-none text-foreground-muted active:cursor-grabbing" aria-hidden>
          <GripVertical size={14} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{countdown.name}</p>
            {countdown.isMain && (
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-foreground-muted">
                <Star size={8} strokeWidth={2} />
                {strings.mainCountdownLabel[lang]}
              </span>
            )}
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground-strong">
            {formatDetailed(remaining, lang)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-foreground-muted">
            <CalendarClock size={11} strokeWidth={1.75} />
            {countdown.targetDate}
          </p>
          {countdown.description && (
            <p className="mt-1 truncate text-xs text-foreground-muted">{countdown.description}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        {!countdown.isMain && (
          <button
            onClick={onSetMain}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground-muted hover:text-foreground"
          >
            {strings.setAsMainBtn[lang]}
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground-muted hover:text-foreground"
        >
          {strings.editBtn[lang]}
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete countdown"
          className="ml-auto rounded-md p-1.5 text-foreground-muted hover:text-danger"
        >
          <Trash2 size={13} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

export function CountdownPanel({
  lang,
  countdowns,
  onAdd,
  onUpdate,
  onDelete,
  onSetMain,
  onReorder,
}: {
  lang: Lang;
  countdowns: Countdown[];
  onAdd: (draft: CountdownDraft) => void;
  onUpdate: (id: string, draft: CountdownDraft) => void;
  onDelete: (id: string) => void;
  onSetMain: (id: string) => void;
  onReorder: (countdowns: Countdown[]) => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    setDragOverId(null);
    const from = draggedId;
    setDraggedId(null);
    if (!from || from === targetId) return;
    const fromIndex = countdowns.findIndex((c) => c.id === from);
    const toIndex = countdowns.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...countdowns];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorder(reordered);
  };

  return (
    <div className="flex flex-col gap-3">
      {formOpen ? (
        <CountdownForm
          lang={lang}
          onSubmit={(draft) => {
            onAdd(draft);
            setFormOpen(false);
          }}
          onCancel={() => setFormOpen(false)}
        />
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="flex w-fit items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-medium text-foreground-muted transition-colors duration-150 hover:text-accent"
        >
          <Plus size={14} strokeWidth={1.75} />
          {strings.addCountdownBtn[lang]}
        </button>
      )}

      {countdowns.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={strings.noCountdownsYet[lang]}
          description={strings.noCountdownsDesc[lang]}
          ctaLabel={strings.addCountdownBtn[lang]}
          onCtaClick={() => setFormOpen(true)}
          compact
        />
      ) : (
        <div className="flex flex-col gap-2">
          {countdowns.map((c) => (
            <CountdownCard
              key={c.id}
              lang={lang}
              countdown={c}
              isDragging={draggedId === c.id}
              isDragOver={dragOverId === c.id && draggedId !== c.id}
              onDragStart={() => setDraggedId(c.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(c.id);
              }}
              onDragLeave={() => setDragOverId((id) => (id === c.id ? null : id))}
              onDrop={() => handleDrop(c.id)}
              onSetMain={() => onSetMain(c.id)}
              onSave={(draft) => onUpdate(c.id, draft)}
              onDelete={() => onDelete(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
