"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Trophy,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
  BookOpenCheck,
  MoreHorizontal,
} from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { CircularProgress } from "@/components/circular-progress";
import { EmptyState } from "@/components/empty-state";
import { CompletionCelebration, CompletedBadge, playSuccessChime } from "@/components/completion-celebration";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import {
  getSubjectProgress,
  getSubjectChaptersCompleted,
  getSubjectTotalChapters,
  getNextRecommendedChapter,
  getUpNextChapter,
  getChapterRecommendation,
  isChapterComplete,
  streakDays,
  type Subject,
  type Chapter,
  type ChapterStatus,
} from "@/lib/curriculum-data";

const todaysSessionMinutes = 45;

function InlineEditableText({
  value,
  onSave,
  className,
  inputClassName,
  onEditingChange,
}: {
  value: string;
  onSave: (next: string) => void;
  className?: string;
  inputClassName?: string;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEditing = () => {
    setDraft(value);
    setEditing(true);
    onEditingChange?.(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
    onEditingChange?.(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
    onEditingChange?.(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        className={
          inputClassName ??
          "min-w-0 flex-1 rounded-md border border-accent bg-control px-1.5 py-0.5 text-sm outline-none"
        }
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
      className={`cursor-text rounded px-0.5 -mx-0.5 transition-colors duration-150 hover:bg-surface-muted ${className ?? ""}`}
    >
      {value}
    </span>
  );
}

function statusControlClasses(status: ChapterStatus): string {
  switch (status) {
    case "mastered":
      return "border-success bg-success text-white";
    case "needs-revision":
      return "border-warning bg-warning/15 text-warning";
    case "in-progress":
      return "border-foreground-strong text-foreground-strong";
    default:
      return "border-border text-transparent";
  }
}

function ChapterStatusControl({
  status,
  lang,
  onChange,
  justCompleted,
}: {
  status: ChapterStatus;
  lang: Lang;
  onChange: (status: ChapterStatus) => void;
  justCompleted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const options: { value: ChapterStatus; label: string }[] = [
    { value: "not-started", label: strings.statusNotStarted[lang] },
    { value: "in-progress", label: strings.statusInProgress[lang] },
    { value: "needs-revision", label: strings.statusNeedsRevision[lang] },
    { value: "mastered", label: strings.statusCompleted[lang] },
  ];

  return (
    <div ref={ref} className="relative mt-0.5 shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Change chapter status"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-transform duration-150 active:scale-90 ${statusControlClasses(
          status
        )} ${justCompleted ? "animate-[pop-in_450ms_ease-out]" : ""}`}
      >
        {status === "needs-revision" ? (
          <RotateCcw size={11} strokeWidth={2.5} />
        ) : status === "not-started" ? null : (
          <Check size={12} strokeWidth={3} />
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1.5 w-36 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-md">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-surface-muted ${
                opt.value === status ? "font-medium text-foreground-strong" : "text-foreground-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The small secondary line under a chapter's name — status word first,
 * "Recommended" folded in only when relevant, per-status color. Completed
 * chapters also get a subtle provenance note so the student can see why the
 * system considers it done. */
function ChapterStatusWord({
  status,
  isRecommended,
  progressSource,
  lang,
}: {
  status: ChapterStatus;
  isRecommended: boolean;
  progressSource?: "ai" | "manual";
  lang: Lang;
}) {
  const colorClass =
    status === "mastered"
      ? "text-success"
      : status === "needs-revision"
      ? "text-warning"
      : isRecommended
      ? "text-foreground-strong"
      : "text-foreground-muted group-hover/chapter:text-foreground";

  const verb =
    status === "mastered"
      ? strings.statusCompleted[lang]
      : status === "needs-revision"
      ? strings.reviseBtn[lang]
      : status === "in-progress"
      ? strings.continueBtn[lang]
      : strings.startTopicBtn[lang];

  return (
    <span className="flex flex-col items-start gap-0.5">
      <span className={`flex items-center gap-1 text-xs transition-colors duration-150 ${colorClass}`}>
        {isRecommended && status !== "mastered" && (
          <>
            <Sparkles size={9} strokeWidth={2} />
            {strings.recommendedLabel[lang]}
            <span aria-hidden>·</span>
          </>
        )}
        {verb}
        {status !== "mastered" && <ArrowRight size={10} strokeWidth={2} />}
      </span>
      {status === "mastered" && progressSource && (
        <span className="text-[10px] text-foreground-faint">
          {progressSource === "ai" ? strings.viaAiLearningLabel[lang] : strings.markedManuallyLabel[lang]}
        </span>
      )}
    </span>
  );
}

function ChapterRow({
  lang,
  chapter,
  isRecommended,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRename,
  onSetStatus,
  onSetMinutes,
  onRemove,
  onNavigateChat,
}: {
  lang: Lang;
  chapter: Chapter;
  isRecommended: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onRename: (name: string) => void;
  onSetStatus: (status: ChapterStatus) => void;
  onSetMinutes: (minutes: number) => void;
  onRemove: () => void;
  onNavigateChat: () => void;
}) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);
  const [minutesDraft, setMinutesDraft] = useState(String(chapter.estimatedMinutes ?? 20));

  const handleSetStatus = (status: ChapterStatus) => {
    if (status === "mastered" && chapter.status !== "mastered") {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 500);
    }
    onSetStatus(status);
  };

  const commitMinutes = () => {
    const n = Math.max(1, Math.round(Number(minutesDraft) || chapter.estimatedMinutes || 20));
    onSetMinutes(n);
    setEditingMinutes(false);
  };

  return (
    <div
      draggable={!isEditingText && !editingMinutes}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group/chapter flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-surface-muted ${
        isDragging ? "opacity-50" : ""
      } ${isDragOver ? "ring-1 ring-foreground-faint" : ""}`}
    >
      <span
        className="mt-0.5 shrink-0 cursor-grab touch-none text-foreground-faint opacity-0 transition-opacity duration-150 group-hover/chapter:opacity-100 active:cursor-grabbing"
        aria-hidden
      >
        <GripVertical size={13} strokeWidth={1.75} />
      </span>

      <ChapterStatusControl
        status={chapter.status}
        lang={lang}
        onChange={handleSetStatus}
        justCompleted={justCompleted}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <InlineEditableText
              value={chapter.name[lang]}
              onSave={onRename}
              onEditingChange={setIsEditingText}
              className={`truncate text-sm ${chapter.status === "mastered" ? "text-foreground-muted line-through" : ""}`}
            />
            {chapter.source === "custom" && (
              <span className="shrink-0 rounded border border-border px-1 py-px text-[9px] font-medium uppercase tracking-wide text-foreground-faint">
                {strings.customTopicLabel[lang]}
              </span>
            )}
          </div>
          {editingMinutes ? (
            <input
              autoFocus
              type="number"
              min={1}
              value={minutesDraft}
              onChange={(e) => setMinutesDraft(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitMinutes}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitMinutes();
                if (e.key === "Escape") {
                  setMinutesDraft(String(chapter.estimatedMinutes ?? 20));
                  setEditingMinutes(false);
                }
              }}
              className="w-14 shrink-0 rounded border border-accent bg-control px-1 py-0.5 text-right text-[11px] outline-none"
            />
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMinutesDraft(String(chapter.estimatedMinutes ?? 20));
                setEditingMinutes(true);
              }}
              className="shrink-0 text-xs tabular-nums text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              {chapter.estimatedMinutes ?? 20} {strings.minutesShort[lang]}
            </button>
          )}
        </div>
        <button onClick={onNavigateChat} className="group mt-0.5">
          <ChapterStatusWord
            status={chapter.status}
            isRecommended={isRecommended}
            progressSource={chapter.progressSource}
            lang={lang}
          />
        </button>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Delete chapter"
        className="mt-0.5 shrink-0 p-1 text-foreground-muted opacity-0 transition-opacity duration-150 hover:text-danger group-hover/chapter:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 size={12} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function AddChapterForm({
  lang,
  onAdd,
}: {
  lang: Lang;
  onAdd: (name: string, minutes?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), minutes ? Math.max(1, Number(minutes)) : undefined);
    setName("");
    setMinutes("");
    setOpen(false);
  };

  const cancel = () => {
    setName("");
    setMinutes("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
      >
        <Plus size={12} strokeWidth={1.75} />
        {strings.addChapter[lang]}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-2.5 sm:flex-row sm:items-center">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") cancel();
        }}
        placeholder={strings.newChapterPlaceholder[lang]}
        className="min-w-0 flex-1 rounded-md border border-border bg-control px-2 py-1.5 text-sm outline-none focus:border-accent"
      />
      <input
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") cancel();
        }}
        type="number"
        min={1}
        placeholder={strings.estimatedMinutesPlaceholder[lang]}
        className="w-full rounded-md border border-border bg-control px-2 py-1.5 text-sm outline-none focus:border-accent sm:w-24"
      />
      <div className="flex shrink-0 gap-1.5">
        <button
          onClick={submit}
          className="flex-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground sm:flex-none"
        >
          {strings.addBtn[lang]}
        </button>
        <button
          onClick={cancel}
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground sm:flex-none"
        >
          {strings.cancelBtn[lang]}
        </button>
      </div>
    </div>
  );
}

/** Subject-level "⋯" menu — consolidates Edit progress / Reset progress /
 * Remove subject into one place instead of scattering buttons across the
 * row; destructive actions require an inline confirm step before they fire. */
function SubjectMenu({
  lang,
  onEditProgress,
  onResetProgress,
  onRemoveSubject,
}: {
  lang: Lang;
  onEditProgress: () => void;
  onResetProgress: () => void;
  onRemoveSubject: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<"reset" | "remove" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const close = () => {
    setOpen(false);
    setConfirming(null);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="Subject options"
        className="rounded p-1 text-foreground-faint opacity-0 transition-opacity duration-150 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
      >
        <MoreHorizontal size={14} strokeWidth={1.75} />
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-10 mt-1.5 w-48 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-md"
        >
          {confirming ? (
            <div className="px-3 py-2.5">
              <p className="text-xs text-foreground-muted">
                {confirming === "reset" ? strings.resetProgressConfirm[lang] : strings.removeSubjectConfirm[lang]}
              </p>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => {
                    if (confirming === "reset") onResetProgress();
                    else onRemoveSubject();
                    close();
                  }}
                  className="rounded-md bg-danger px-2.5 py-1 text-[11px] font-medium text-white"
                >
                  {strings.confirmBtn[lang]}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground-muted hover:text-foreground"
                >
                  {strings.cancelBtn[lang]}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  onEditProgress();
                  close();
                }}
                className="flex w-full items-center px-3 py-1.5 text-left text-xs text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
              >
                {strings.editProgressLabel[lang]}
              </button>
              <button
                onClick={() => setConfirming("reset")}
                className="flex w-full items-center px-3 py-1.5 text-left text-xs text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
              >
                {strings.resetProgressLabel[lang]}
              </button>
              <button
                onClick={() => setConfirming("remove")}
                className="flex w-full items-center px-3 py-1.5 text-left text-xs text-danger transition-colors duration-150 hover:bg-surface-muted"
              >
                {strings.removeSubjectLabel[lang]}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SubjectRow({
  lang,
  subject,
  isExpanded,
  onToggleExpand,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRename,
  onRemove,
  onResetProgress,
  onAddChapter,
  onRemoveChapter,
  onRenameChapter,
  onSetChapterStatus,
  onSetChapterMinutes,
  onReorderChapters,
  onNavigateChat,
}: {
  lang: Lang;
  subject: Subject;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
  onResetProgress: () => void;
  onAddChapter: (name: string, minutes?: number) => void;
  onRemoveChapter: (chapterId: string) => void;
  onRenameChapter: (chapterId: string, name: string) => void;
  onSetChapterStatus: (chapterId: string, status: ChapterStatus) => void;
  onSetChapterMinutes: (chapterId: string, minutes: number) => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  onNavigateChat: () => void;
}) {
  const [isRenamingSubject, setIsRenamingSubject] = useState(false);
  const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);
  const [justCompletedSubject, setJustCompletedSubject] = useState(false);

  const progress = getSubjectProgress(subject);
  const isCompleted = progress === 100;
  const completedCount = getSubjectChaptersCompleted(subject);
  const totalCount = getSubjectTotalChapters(subject);
  const recommendedId = getChapterRecommendation(subject)?.id ?? null;

  const handleSetChapterStatus = (chapterId: string, status: ChapterStatus) => {
    if (status === "mastered") {
      const willCompleteSubject = subject.chapters.every(
        (c) => c.id === chapterId || isChapterComplete(c.status)
      );
      if (willCompleteSubject) {
        setJustCompletedSubject(true);
        playSuccessChime();
        setTimeout(() => setJustCompletedSubject(false), 1600);
      }
    }
    onSetChapterStatus(chapterId, status);
  };

  const handleChapterDrop = (targetId: string) => {
    setDragOverChapterId(null);
    const from = draggedChapterId;
    setDraggedChapterId(null);
    if (!from || from === targetId) return;
    const fromIndex = subject.chapters.findIndex((c) => c.id === from);
    const toIndex = subject.chapters.findIndex((c) => c.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...subject.chapters];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorderChapters(reordered);
  };

  return (
    <div
      draggable={!isRenamingSubject}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative border-b border-border transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 ${
        isDragOver ? "bg-surface-muted" : ""
      } ${isDragging ? "opacity-50" : ""}`}
    >
      {justCompletedSubject && <CompletionCelebration />}
      <div
        onClick={onToggleExpand}
        className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-surface-muted"
      >
        <span
          className="shrink-0 cursor-grab touch-none text-foreground-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100 active:cursor-grabbing"
          aria-hidden
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={15} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <InlineEditableText
                value={subject.name[lang]}
                onSave={onRename}
                onEditingChange={setIsRenamingSubject}
                className="truncate font-medium"
              />
              {isCompleted && (
                <CompletedBadge>
                  <Trophy size={10} strokeWidth={2} />
                  {strings.completedBadge[lang]}
                </CompletedBadge>
              )}
            </div>
            <span className="shrink-0 text-sm tabular-nums text-foreground-muted">{progress}%</span>
          </div>
          <div className="mt-2.5">
            <AnimatedProgressBar value={progress} height="h-1" />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-foreground-muted">
              {completedCount}/{totalCount} {strings.chaptersCompletedCount[lang]}
            </p>
            <SubjectMenu
              lang={lang}
              onEditProgress={() => {
                if (!isExpanded) onToggleExpand();
              }}
              onResetProgress={onResetProgress}
              onRemoveSubject={onRemove}
            />
          </div>
        </div>
        <ChevronDown
          size={15}
          strokeWidth={1.75}
          className={`shrink-0 text-foreground-faint transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-5 py-3">
            {subject.chapters.length === 0 ? (
              <div className="py-2">
                <EmptyState
                  icon={BookOpenCheck}
                  title={strings.noChaptersYet[lang]}
                  description={strings.chaptersEmptyDesc[lang]}
                  ctaLabel={strings.addFirstChapterBtn[lang]}
                  onCtaClick={() => document.getElementById(`chapter-add-${subject.id}`)?.click()}
                  compact
                />
              </div>
            ) : (
              <div className="flex flex-col py-1">
                {subject.chapters.map((chapter) => (
                  <ChapterRow
                    key={chapter.id}
                    lang={lang}
                    chapter={chapter}
                    isRecommended={chapter.id === recommendedId}
                    isDragging={draggedChapterId === chapter.id}
                    isDragOver={dragOverChapterId === chapter.id && draggedChapterId !== chapter.id}
                    onDragStart={() => setDraggedChapterId(chapter.id)}
                    onDragEnd={() => {
                      setDraggedChapterId(null);
                      setDragOverChapterId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverChapterId(chapter.id);
                    }}
                    onDragLeave={() => setDragOverChapterId((id) => (id === chapter.id ? null : id))}
                    onDrop={() => handleChapterDrop(chapter.id)}
                    onRename={(name) => onRenameChapter(chapter.id, name)}
                    onSetStatus={(status) => handleSetChapterStatus(chapter.id, status)}
                    onSetMinutes={(minutes) => onSetChapterMinutes(chapter.id, minutes)}
                    onRemove={() => onRemoveChapter(chapter.id)}
                    onNavigateChat={onNavigateChat}
                  />
                ))}
              </div>
            )}

            <div id={`chapter-add-${subject.id}`} className="mt-1">
              <AddChapterForm lang={lang} onAdd={onAddChapter} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddSubjectTrigger({
  lang,
  onAdd,
}: {
  lang: Lang;
  onAdd: (name: string, targetChapters?: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), target ? Math.max(1, Number(target)) : undefined);
    setName("");
    setTarget("");
    setOpen(false);
  };

  const cancel = () => {
    setName("");
    setTarget("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-fit items-center gap-1.5 rounded-md px-1 py-1.5 text-sm font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
      >
        <Plus size={14} strokeWidth={1.75} />
        {strings.addSubject[lang]}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") cancel();
        }}
        placeholder={strings.addSubjectPlaceholder[lang]}
        className="min-w-0 flex-1 rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") cancel();
        }}
        type="number"
        min={1}
        placeholder={strings.targetChaptersPlaceholder[lang]}
        className="w-full rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none focus:border-accent sm:w-40"
      />
      <div className="flex shrink-0 gap-2">
        <button
          onClick={submit}
          className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground sm:flex-none"
        >
          {strings.addBtn[lang]}
        </button>
        <button
          onClick={cancel}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground sm:flex-none"
        >
          {strings.cancelBtn[lang]}
        </button>
      </div>
    </div>
  );
}

function QuickStatCard({
  label,
  children,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex flex-col rounded-xl border border-border bg-surface p-4 text-left transition-colors duration-150 ${
        onClick ? "hover:bg-surface-muted" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</p>
      {children}
    </Tag>
  );
}

function WeeklyGoalCard({ lang }: { lang: Lang }) {
  const completed = 5;
  const [target, setTarget] = useState(10);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(target));

  const commit = () => {
    const n = Math.max(1, Math.round(Number(draft) || target));
    setTarget(n);
    setEditing(false);
  };

  return (
    <QuickStatCard label={strings.weeklyStudyGoal[lang]} onClick={editing ? undefined : () => setEditing(true)}>
      {editing ? (
        <div className="mt-1.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-foreground-muted">{strings.weeklyTargetLabel[lang]}:</span>
          <input
            autoFocus
            type="number"
            min={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(String(target));
                setEditing(false);
              }
            }}
            className="w-14 rounded border border-accent bg-control px-1.5 py-0.5 text-sm outline-none"
          />
          <span className="text-xs text-foreground-muted">{strings.hoursShort[lang]}</span>
        </div>
      ) : (
        <>
          <p className="mt-1.5 text-sm font-medium">
            {completed}/{target} {strings.hoursThisWeek[lang]}
          </p>
          <AnimatedProgressBar value={(completed / target) * 100} className="mt-2.5" />
        </>
      )}
    </QuickStatCard>
  );
}

export function StudyView({
  lang,
  subjects,
  onAddSubject,
  onRemoveSubject,
  onRenameSubject,
  onReorderSubjects,
  onAddChapter,
  onRemoveChapter,
  onRenameChapter,
  onSetChapterStatus,
  onSetChapterMinutes,
  onReorderChapters,
  onResetSubjectProgress,
  onNavigate,
  onStartSession,
}: {
  lang: Lang;
  subjects: Subject[];
  onAddSubject: (name: string, targetChapters?: number) => void;
  onRemoveSubject: (id: string) => void;
  onRenameSubject: (id: string, name: string) => void;
  onReorderSubjects: (subjects: Subject[]) => void;
  onAddChapter: (subjectId: string, name: string, estimatedMinutes?: number) => void;
  onRemoveChapter: (subjectId: string, chapterId: string) => void;
  onRenameChapter: (subjectId: string, chapterId: string, name: string) => void;
  onSetChapterStatus: (subjectId: string, chapterId: string, status: ChapterStatus) => void;
  onSetChapterMinutes: (subjectId: string, chapterId: string, minutes: number) => void;
  onReorderChapters: (subjectId: string, chapters: Chapter[]) => void;
  onResetSubjectProgress: (subjectId: string) => void;
  onNavigate: (view: CanvasView) => void;
  onStartSession: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>("chemistry");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string) => {
    setDragOverId(null);
    const draggedFrom = draggedId;
    setDraggedId(null);
    if (!draggedFrom || draggedFrom === targetId) return;
    const fromIndex = subjects.findIndex((s) => s.id === draggedFrom);
    const toIndex = subjects.findIndex((s) => s.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...subjects];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    onReorderSubjects(reordered);
  };

  const overallCompletion =
    subjects.length === 0
      ? 0
      : Math.round(subjects.reduce((sum, s) => sum + getSubjectProgress(s), 0) / subjects.length);
  // "Today's Session" = the current target; "Next Up" is deliberately whatever
  // comes AFTER that, so the two cards never show the same chapter.
  const current = getNextRecommendedChapter(subjects);
  const next = getUpNextChapter(
    subjects,
    current ? { subjectId: current.subjectId, chapterId: current.chapter.id } : undefined
  );
  const sessionMinutes = current?.chapter.estimatedMinutes ?? todaysSessionMinutes;

  return (
    <div className="mx-auto flex max-w-275 flex-col gap-8 p-6 sm:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground-strong">{strings.studyPlan[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.yourLearningRoadmap[lang]}</p>
          <p className="mt-3 text-xs text-foreground-faint">
            {subjects.length} {strings.subjectsCountWord[lang]} · {overallCompletion}% {strings.overallWord[lang]} ·{" "}
            {streakDays} {strings.streak[lang]}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1">
          <CircularProgress value={overallCompletion} size={64} strokeWidth={5} />
          <span className="text-[10px] text-foreground-muted">{strings.overallCompletion[lang]}</span>
        </div>
      </div>

      {/* Today's Session — the primary action of the page */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          {strings.todaysSession[lang]}
        </p>
        {current ? (
          <>
            <p className="mt-4 text-sm text-foreground-muted">{current.subjectName[lang]}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground-strong">
              {current.chapter.name[lang]}
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-foreground-muted">{strings.allCaughtUp[lang]}</p>
        )}
        <p className="mt-2 text-sm text-foreground-muted">
          {sessionMinutes} {strings.minutesShort[lang]}
        </p>
        <button
          onClick={onStartSession}
          className="mt-5 flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform active:scale-95"
        >
          {strings.startSession[lang]}
          <ArrowRight size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Quick stats — compact, secondary to Today's Session */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <QuickStatCard label={strings.nextUpLabel[lang]}>
          {next ? (
            <>
              <p className="mt-1.5 truncate text-sm font-medium">{next.chapter.name[lang]}</p>
              <p className="mt-0.5 truncate text-xs text-foreground-muted">
                {next.subjectName[lang]} · {next.chapter.estimatedMinutes ?? 20} {strings.minutesShort[lang]}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-xs text-foreground-muted">{strings.allCaughtUpDesc[lang]}</p>
          )}
        </QuickStatCard>

        <WeeklyGoalCard lang={lang} />

        <QuickStatCard label={strings.currentStreakLabel[lang]}>
          <p className="mt-1.5 text-sm font-medium">
            {streakDays} {strings.streak[lang]}
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">{strings.keepGoingLabel[lang]}</p>
        </QuickStatCard>
      </div>

      {/* Subjects — one continuous surface, one row per subject, one expanded at a time */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{strings.subjects[lang]}</p>
        <div className="rounded-2xl border border-border bg-surface">
          {subjects.map((subject) => (
            <SubjectRow
              key={subject.id}
              lang={lang}
              subject={subject}
              isExpanded={expandedId === subject.id}
              onToggleExpand={() => setExpandedId((id) => (id === subject.id ? null : subject.id))}
              isDragging={draggedId === subject.id}
              isDragOver={dragOverId === subject.id && draggedId !== subject.id}
              onDragStart={() => setDraggedId(subject.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(subject.id);
              }}
              onDragLeave={() => setDragOverId((id) => (id === subject.id ? null : id))}
              onDrop={() => handleDrop(subject.id)}
              onRename={(name) => onRenameSubject(subject.id, name)}
              onRemove={() => onRemoveSubject(subject.id)}
              onResetProgress={() => onResetSubjectProgress(subject.id)}
              onAddChapter={(name, minutes) => onAddChapter(subject.id, name, minutes)}
              onRemoveChapter={(chapterId) => onRemoveChapter(subject.id, chapterId)}
              onRenameChapter={(chapterId, name) => onRenameChapter(subject.id, chapterId, name)}
              onSetChapterStatus={(chapterId, status) => onSetChapterStatus(subject.id, chapterId, status)}
              onSetChapterMinutes={(chapterId, minutes) => onSetChapterMinutes(subject.id, chapterId, minutes)}
              onReorderChapters={(chapters) => onReorderChapters(subject.id, chapters)}
              onNavigateChat={() => onNavigate("chat")}
            />
          ))}
        </div>
      </div>

      <AddSubjectTrigger lang={lang} onAdd={onAddSubject} />
    </div>
  );
}
