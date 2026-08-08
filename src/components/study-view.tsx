"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Trophy,
  Flame,
  Clock,
  Check,
  BookOpenCheck,
} from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { CircularProgress } from "@/components/circular-progress";
import { EmptyState } from "@/components/empty-state";
import { CompletionCelebration, CompletedBadge, playSuccessChime } from "@/components/completion-celebration";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import {
  getSubjectProgress,
  getNextRecommendedChapter,
  streakDays,
  type Subject,
  type Chapter,
} from "@/lib/curriculum-data";

const weeklyGoalHours = { completed: 5, target: 10 };
const todaysSessionMinutes = 45;

export function StudyView({
  lang,
  subjects,
  onAddSubject,
  onRemoveSubject,
  onAddChapter,
  onToggleChapter,
  onReorderSubjects,
  onNavigate,
  onStartSession,
}: {
  lang: Lang;
  subjects: Subject[];
  onAddSubject: (name: string) => void;
  onRemoveSubject: (id: string) => void;
  onAddChapter: (subjectId: string, name: string) => void;
  onToggleChapter: (subjectId: string, chapterId: string) => void;
  onReorderSubjects: (subjects: Subject[]) => void;
  onNavigate: (view: CanvasView) => void;
  onStartSession: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>("chemistry");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newChapterName, setNewChapterName] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [justCompletedSubjectId, setJustCompletedSubjectId] = useState<string | null>(null);

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    onAddSubject(newSubjectName.trim());
    setNewSubjectName("");
  };

  const handleAddChapter = (subjectId: string) => {
    if (!newChapterName.trim()) return;
    onAddChapter(subjectId, newChapterName.trim());
    setNewChapterName("");
  };

  const handleToggleChapter = (subjectId: string, chapter: Chapter) => {
    if (chapter.status !== "mastered") {
      setJustCompletedId(chapter.id);
      setTimeout(() => setJustCompletedId((id) => (id === chapter.id ? null : id)), 500);

      const subject = subjects.find((s) => s.id === subjectId);
      const willCompleteSubject =
        subject !== undefined &&
        subject.chapters.every((c) => c.id === chapter.id || c.status === "mastered");
      if (willCompleteSubject) {
        setJustCompletedSubjectId(subjectId);
        playSuccessChime();
        setTimeout(
          () => setJustCompletedSubjectId((id) => (id === subjectId ? null : id)),
          1600
        );
      }
    }
    onToggleChapter(subjectId, chapter.id);
  };

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
  const recommended = getNextRecommendedChapter(subjects);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{strings.studyPlan[lang]}</h1>
        <div className="flex flex-col items-center gap-1">
          <CircularProgress value={overallCompletion} size={56} strokeWidth={5} />
          <span className="text-[10px] text-foreground-muted">{strings.overallCompletion[lang]}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          {strings.todaysSession[lang]}
        </p>
        <p className="mt-1 text-base font-medium">
          {todaysSessionMinutes} {strings.minutesShort[lang]}
          {recommended && ` — ${recommended.subjectName[lang]}: ${recommended.chapter.name[lang]}`}
        </p>
        <button
          onClick={onStartSession}
          className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform active:scale-95"
        >
          {strings.startSession[lang]}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.nextRecommendedChapter[lang]}
          </p>
          {recommended ? (
            <>
              <p className="mt-1.5 text-sm font-medium">{recommended.chapter.name[lang]}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {recommended.subjectName[lang]} • {recommended.chapter.estimatedMinutes ?? 20}{" "}
                {strings.minutesShort[lang]}
              </p>
            </>
          ) : (
            <EmptyState
              icon={Trophy}
              title={strings.allCaughtUp[lang]}
              description={strings.allCaughtUpDesc[lang]}
              ctaLabel={strings.exploreToolsBtn[lang]}
              onCtaClick={() => onNavigate("tools")}
              compact
            />
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.weeklyStudyGoal[lang]}
          </p>
          <p className="mt-1.5 text-sm font-medium">
            {weeklyGoalHours.completed}/{weeklyGoalHours.target} {strings.hoursThisWeek[lang]}
          </p>
          <AnimatedProgressBar
            value={(weeklyGoalHours.completed / weeklyGoalHours.target) * 100}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {subjects.map((subject) => {
          const isExpanded = expanded === subject.id;
          const progress = getSubjectProgress(subject);
          const isCompleted = progress === 100;
          const isDragging = draggedId === subject.id;
          const isDragOver = dragOverId === subject.id && draggedId !== subject.id;
          const isJustCompleted = justCompletedSubjectId === subject.id;
          return (
            <div
              key={subject.id}
              draggable
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
              className={`relative rounded-xl border bg-surface transition-all duration-150 hover:border-accent/30 hover:shadow-[0_8px_20px_-14px_var(--color-accent)] ${
                isCompleted ? "border-success/40" : "border-border"
              } ${isDragging ? "opacity-40" : ""} ${isDragOver ? "ring-2 ring-accent" : ""}`}
            >
              {isJustCompleted && <CompletionCelebration />}
              <div className="flex items-center gap-1 p-4">
                <span
                  className="shrink-0 cursor-grab touch-none text-foreground-muted active:cursor-grabbing"
                  aria-hidden
                >
                  <GripVertical size={16} strokeWidth={1.75} />
                </span>
                <button
                  onClick={() => setExpanded(isExpanded ? null : subject.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span className="shrink-0 text-foreground-muted">
                    {isExpanded ? (
                      <ChevronDown size={14} strokeWidth={1.75} />
                    ) : (
                      <ChevronRight size={14} strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{subject.name[lang]}</span>
                      {isCompleted && (
                        <CompletedBadge>
                          <Trophy size={10} strokeWidth={2} />
                          {strings.completedBadge[lang]}
                        </CompletedBadge>
                      )}
                    </div>
                    <AnimatedProgressBar value={progress} className="mt-2" />
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-foreground-muted">{progress}%</span>
                </button>
                <button
                  onClick={() => onRemoveSubject(subject.id)}
                  aria-label="Remove subject"
                  className="shrink-0 p-1.5 text-foreground-muted transition-transform hover:text-warning active:scale-90"
                >
                  <Trash2 size={14} strokeWidth={1.75} />
                </button>
              </div>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ${
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-border px-4 py-3">
                    <div className="mb-3 flex items-center gap-4 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1.5">
                        <Flame size={13} strokeWidth={1.75} className="text-warning" />
                        {streakDays} {strings.streak[lang]}
                      </span>
                    </div>

                    {subject.chapters.length === 0 ? (
                      <div className="pb-2">
                        <EmptyState
                          icon={BookOpenCheck}
                          title={strings.noChaptersYet[lang]}
                          description={strings.chaptersEmptyDesc[lang]}
                          ctaLabel={strings.addFirstChapterBtn[lang]}
                          onCtaClick={() =>
                            document.getElementById(`chapter-input-${subject.id}`)?.focus()
                          }
                          compact
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 pb-2">
                        {subject.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className="flex items-center gap-2.5 rounded-md px-1.5 py-2 hover:bg-surface-muted"
                          >
                            <button
                              onClick={() => handleToggleChapter(subject.id, chapter)}
                              aria-label="Toggle chapter complete"
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-transform active:scale-90 ${
                                chapter.status === "mastered"
                                  ? "border-success bg-success text-white"
                                  : "border-border text-transparent"
                              } ${justCompletedId === chapter.id ? "animate-[pop-in_450ms_ease-out]" : ""}`}
                            >
                              <Check size={12} strokeWidth={3} />
                            </button>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate text-sm ${
                                  chapter.status === "mastered"
                                    ? "text-foreground-muted line-through"
                                    : ""
                                }`}
                              >
                                {chapter.name[lang]}
                              </p>
                              <AnimatedProgressBar value={chapter.progress} height="h-1" className="mt-1.5" />
                            </div>
                            <span className="flex shrink-0 items-center gap-1 text-xs text-foreground-muted">
                              <Clock size={11} strokeWidth={1.75} />
                              {chapter.estimatedMinutes ?? 20} {strings.minutesShort[lang]}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        id={`chapter-input-${subject.id}`}
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddChapter(subject.id)}
                        placeholder={strings.newChapterPlaceholder[lang]}
                        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => handleAddChapter(subject.id)}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs text-foreground-muted hover:text-foreground"
                      >
                        <Plus size={12} strokeWidth={1.75} />
                        {strings.addChapter[lang]}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
          placeholder={strings.newSubjectPlaceholder[lang]}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={handleAddSubject}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted hover:text-foreground"
        >
          <Plus size={14} strokeWidth={1.75} />
          {strings.addSubject[lang]}
        </button>
      </div>
    </div>
  );
}
