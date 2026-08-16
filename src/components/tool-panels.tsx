"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Sparkles,
  FileCheck2,
  Check,
  Search,
  Pin,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { subjects as curriculumSubjects } from "@/lib/curriculum-data";
import { aiNotebookEntries, mistakeBookEntries, savedAnswers, roadmapWeeks, alarmSounds } from "@/lib/tools-data";
import {
  cyclePosition,
  formatClock,
  getRemainingMs,
  studyTimerPresets,
  type TimerActions,
  type TimerState,
} from "@/lib/study-timer";
import { CycleDots, TimerSettingsForm, useTimerNow } from "@/components/study-timer-controls";
import {
  createDraftNote,
  isEmptyNote,
  loadNotes,
  matchesQuery,
  saveNotes,
  sortNotes,
  timeAgo,
  type Note,
} from "@/lib/notebook";

const EASE = [0.16, 1, 0.3, 1] as const;

export function StudyTimerPanel({
  lang,
  timer,
  actions,
}: {
  lang: Lang;
  timer: TimerState;
  actions: TimerActions;
}) {
  const now = useTimerNow(timer.status);
  const remainingMs = getRemainingMs(timer, now);
  const active = timer.status === "running" || timer.status === "paused";
  const cycle = cyclePosition(timer);
  const phaseLabel =
    timer.phase === "focus"
      ? strings.timerPhaseFocus[lang]
      : timer.phase === "break"
      ? strings.timerPhaseBreak[lang]
      : strings.timerPhaseLongBreak[lang];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.timerCurrentSessionLabel[lang]}
          </p>
          <CycleDots completed={cycle.completed} total={cycle.total} />
        </div>
        {active ? (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground-strong">{phaseLabel}</p>
              <p className="text-5xl font-semibold tabular-nums tracking-tight">{formatClock(remainingMs)}</p>
              <p className="text-xs text-foreground-muted">{strings.timerRemainingLabel[lang]}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => (timer.status === "running" ? actions.pause() : actions.resume())}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
              >
                {timer.status === "running" ? <Pause size={15} strokeWidth={2} /> : <Play size={15} strokeWidth={2} />}
                {timer.status === "running" ? strings.timerPause[lang] : strings.timerResume[lang]}
              </button>
              <button
                onClick={() => actions.reset()}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted hover:text-foreground"
              >
                <RotateCcw size={15} strokeWidth={1.75} />
                {strings.timerReset[lang]}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm font-medium text-foreground-strong">{strings.timerNoActiveSession[lang]}</p>
            <p className="text-xs text-foreground-muted">{strings.timerNoActiveSessionDesc[lang]}</p>
            <button
              onClick={() => actions.start("focus")}
              className="mt-1 flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
            >
              <Play size={15} strokeWidth={2} />
              {strings.timerStart[lang]}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.timerSessionSettingsLabel[lang]}
        </p>
        <TimerSettingsForm lang={lang} settings={timer.settings} actions={actions} showPreview={false} />
        <label className="flex items-center justify-between text-sm">
          <span>{strings.timerAutoStartLabel[lang]}</span>
          <input
            type="checkbox"
            checked={timer.settings.autoStartNext}
            onChange={(e) => actions.updateSettings({ autoStartNext: e.target.checked })}
            className="size-4 accent-accent"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>{strings.alarmToggleLabel[lang]}</span>
          <input
            type="checkbox"
            checked={timer.settings.alarmOn}
            onChange={(e) => actions.updateSettings({ alarmOn: e.target.checked })}
            className="size-4 accent-accent"
          />
        </label>
        {timer.settings.alarmOn && (
          <div>
            <p className="text-xs text-foreground-muted">{strings.alarmSoundLabel[lang]}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {alarmSounds.map((s, i) => (
                <button
                  key={s.en}
                  onClick={() => actions.updateSettings({ alarmSoundIndex: i })}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    timer.settings.alarmSoundIndex === i
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-foreground-muted"
                  }`}
                >
                  {s[lang]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.timerPresetsLabel[lang]}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {studyTimerPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => actions.applyPreset(p)}
              className="rounded-xl border border-border p-3.5 text-left transition-colors duration-150 hover:bg-surface-muted"
            >
              <p className="text-sm font-medium">{p.label[lang]}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {p.focusMinutes} {strings.minutesWord[lang]} · {p.breakMinutes} {strings.minutesWord[lang]}{" "}
                {strings.timerBreakLabel[lang]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NoteCard({
  lang,
  note,
  subjectName,
  onOpen,
  onTogglePin,
}: {
  lang: Lang;
  note: Note;
  subjectName: string | null;
  onOpen: () => void;
  onTogglePin: () => void;
}) {
  const snippet = note.content.trim();
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15, ease: EASE }}
      className="group relative rounded-xl border border-border p-3.5 transition-colors duration-150 hover:border-foreground-faint hover:bg-surface-muted"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={note.title.trim() || strings.noteTitlePlaceholder[lang]}
        className="absolute inset-0 z-0 rounded-xl"
      />
      <div className="pointer-events-none relative z-0 pr-6">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">
            {note.title.trim() || strings.noteTitlePlaceholder[lang]}
          </p>
          <span className="shrink-0 text-[10px] text-foreground-faint">
            {strings.noteUpdatedPrefix[lang]} {timeAgo(note.updatedAt, lang)}
          </span>
        </div>
        {snippet && <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">{snippet}</p>}
        {subjectName && (
          <span className="mt-2 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-muted">
            {subjectName}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        aria-label={note.pinned ? strings.notePinnedLabel[lang] : strings.notePinLabel[lang]}
        className={`pointer-events-auto absolute right-2.5 top-2.5 z-10 rounded-md p-1 transition-colors duration-150 ${
          note.pinned
            ? "text-foreground-strong"
            : "text-foreground-faint opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        }`}
      >
        <Pin size={13} strokeWidth={1.75} className={note.pinned ? "fill-current" : ""} />
      </button>
    </motion.div>
  );
}

function NoteEditorView({
  lang,
  note,
  saveState,
  onChange,
  onClose,
  onDelete,
}: {
  lang: Lang;
  note: Note;
  saveState: "idle" | "saving" | "saved";
  onChange: (patch: Partial<Note>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [aiOpen, setAiOpen] = useState(Boolean(note.chapterId || note.sourceTopic));
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const subject = curriculumSubjects.find((s) => s.id === note.subjectId) ?? null;
  const chapters = subject ? subject.chapters : [];

  return (
    <div
      className="flex flex-col gap-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
          {strings.noteBackToNotes[lang]}
        </button>
        <AnimatePresence mode="wait">
          {saveState !== "idle" && (
            <motion.span
              key={saveState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="text-[11px] text-foreground-faint"
            >
              {saveState === "saving" ? strings.noteSaving[lang] : strings.noteSaved[lang]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <input
        autoFocus
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            contentRef.current?.focus();
          }
        }}
        placeholder={strings.noteTitlePlaceholder[lang]}
        className="w-full bg-transparent text-lg font-semibold tracking-tight text-foreground-strong outline-none placeholder:text-foreground-faint"
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={note.subjectId ?? ""}
          onChange={(e) => onChange({ subjectId: e.target.value || null, chapterId: null })}
          className="rounded-lg border border-border bg-control px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 hover:border-foreground-faint focus:border-foreground-faint"
        >
          <option value="">{strings.noteNoSubject[lang]}</option>
          {curriculumSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name[lang]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onChange({ pinned: !note.pinned })}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
            note.pinned
              ? "border-accent bg-surface-muted text-foreground-strong"
              : "border-border text-foreground-muted hover:border-foreground-faint hover:text-foreground"
          }`}
        >
          <Pin size={12} strokeWidth={1.75} className={note.pinned ? "fill-current" : ""} />
          {note.pinned ? strings.notePinnedLabel[lang] : strings.notePinLabel[lang]}
        </button>
      </div>

      <textarea
        ref={contentRef}
        value={note.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder={strings.noteContentPlaceholder[lang]}
        rows={10}
        className="min-h-48 w-full resize-y rounded-lg border border-border bg-control px-3 py-2.5 text-sm leading-relaxed outline-none transition-colors duration-150 focus:border-foreground-faint"
      />

      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setAiOpen((o) => !o)}
          aria-expanded={aiOpen}
          className="flex w-full items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <motion.span
            animate={{ rotate: aiOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="flex"
          >
            <ChevronRight size={12} strokeWidth={2} />
          </motion.span>
          {strings.noteAiConnectionLabel[lang]}
        </button>
        <AnimatePresence initial={false}>
          {aiOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.noteChapterLabel[lang]}
                  </span>
                  <select
                    value={note.chapterId ?? ""}
                    onChange={(e) => onChange({ chapterId: e.target.value || null })}
                    disabled={!subject}
                    className="rounded-lg border border-border bg-control px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 hover:border-foreground-faint focus:border-foreground-faint disabled:opacity-40"
                  >
                    <option value="">{strings.noteChapterNone[lang]}</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name[lang]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.noteSourceLabel[lang]}
                  </span>
                  <input
                    value={note.sourceTopic ?? ""}
                    onChange={(e) => onChange({ sourceTopic: e.target.value })}
                    placeholder={strings.noteSourcePlaceholder[lang]}
                    className="rounded-lg border border-border bg-control px-2.5 py-1.5 text-xs outline-none transition-colors duration-150 focus:border-foreground-faint"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {onDelete && (
        <div className="border-t border-border pt-3">
          {confirmDelete ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2.5">
              <div>
                <p className="text-xs font-medium text-foreground">{strings.noteDeleteConfirm[lang]}</p>
                <p className="text-[11px] text-foreground-muted">{strings.noteDeleteConfirmDesc[lang]}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md border border-border px-2.5 py-1 text-[11px] text-foreground-muted transition-colors duration-150 hover:text-foreground"
                >
                  {strings.cancelBtn[lang]}
                </button>
                <button onClick={onDelete} className="rounded-md bg-danger px-2.5 py-1 text-[11px] font-medium text-white">
                  {strings.confirmBtn[lang]}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-danger"
            >
              <Trash2 size={12} strokeWidth={1.75} />
              {strings.noteDeleteBtn[lang]}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const filterChipClass = (active: boolean) =>
  `rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 ${
    active
      ? "border-accent bg-surface-muted text-foreground-strong"
      : "border-border text-foreground-muted hover:border-foreground-faint hover:text-foreground"
  }`;

export function NotebookPanel({ lang }: { lang: Lang }) {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [draft, setDraft] = useState<Note | null>(null);
  const [editorMode, setEditorMode] = useState<"new" | "edit" | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const draftRef = useRef<Note | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const persist = (updater: (prev: Note[]) => Note[]) => {
    setNotes((prev) => {
      const next = updater(prev);
      saveNotes(next);
      return next;
    });
  };

  const commitDraft = () => {
    const current = draftRef.current;
    if (!current) return;
    persist((prev) => {
      const exists = prev.some((n) => n.id === current.id);
      return exists ? prev.map((n) => (n.id === current.id ? current : n)) : [...prev, current];
    });
    setSaveState("saved");
  };

  const updateDraft = (patch: Partial<Note>) => {
    setDraft((d) => (d ? { ...d, ...patch, updatedAt: Date.now() } : d));
    setSaveState("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(commitDraft, 500);
  };

  const openNote = (note: Note) => {
    setDraft({ ...note });
    setEditorMode("edit");
    setSaveState("saved");
  };
  const openNewNote = () => {
    setDraft(createDraftNote());
    setEditorMode("new");
    setSaveState("idle");
  };
  const closeEditor = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const current = draftRef.current;
    if (current && !(editorMode === "new" && isEmptyNote(current))) {
      persist((prev) => {
        const exists = prev.some((n) => n.id === current.id);
        return exists ? prev.map((n) => (n.id === current.id ? current : n)) : [...prev, current];
      });
    }
    setDraft(null);
    setEditorMode(null);
    setSaveState("idle");
  };
  const deleteNote = (id: string) => {
    persist((prev) => prev.filter((n) => n.id !== id));
    setDraft(null);
    setEditorMode(null);
  };
  const togglePinInList = (id: string) => {
    persist((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const subjectIdsWithNotes = Array.from(new Set(notes.map((n) => n.subjectId).filter((id): id is string => !!id)));
  const filterableSubjects = curriculumSubjects.filter((s) => subjectIdsWithNotes.includes(s.id));
  const visibleNotes = sortNotes(
    notes.filter((n) => matchesQuery(n, query) && (subjectFilter === "all" || n.subjectId === subjectFilter))
  );

  if (draft) {
    return (
      <NoteEditorView
        lang={lang}
        note={draft}
        saveState={saveState}
        onChange={updateDraft}
        onClose={closeEditor}
        onDelete={editorMode === "edit" ? () => deleteNote(draft.id) : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={openNewNote}
          className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
        >
          <Plus size={13} strokeWidth={1.75} />
          {strings.newNote[lang]}
        </button>
        <div className="relative">
          <Search
            size={13}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.noteSearchPlaceholder[lang]}
            className="w-full rounded-lg border border-border bg-control py-1.5 pl-7 pr-3 text-xs outline-none transition-colors duration-150 focus:border-foreground-faint sm:w-52"
          />
        </div>
      </div>

      {filterableSubjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setSubjectFilter("all")} className={filterChipClass(subjectFilter === "all")}>
            {strings.noteAllSubjects[lang]}
          </button>
          {filterableSubjects.map((s) => (
            <button key={s.id} onClick={() => setSubjectFilter(s.id)} className={filterChipClass(subjectFilter === s.id)}>
              {s.name[lang]}
            </button>
          ))}
        </div>
      )}

      {visibleNotes.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-6 text-center">
          <p className="text-xs font-medium text-foreground">
            {notes.length === 0 ? strings.noteEmptyTitle[lang] : strings.noteNoResultsTitle[lang]}
          </p>
          <p className="max-w-[240px] text-[11px] text-foreground-muted">
            {notes.length === 0 ? strings.noteEmptyDesc[lang] : strings.noteNoResultsDesc[lang]}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleNotes.map((n) => (
            <NoteCard
              key={n.id}
              lang={lang}
              note={n}
              subjectName={n.subjectId ? curriculumSubjects.find((s) => s.id === n.subjectId)?.name[lang] ?? null : null}
              onOpen={() => openNote(n)}
              onTogglePin={() => togglePinInList(n.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AiNotebookPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      {aiNotebookEntries.map((n, i) => (
        <div key={i} className="rounded-xl border border-border bg-highlight p-3.5">
          <div className="flex items-center gap-2">
            <Sparkles size={13} strokeWidth={1.75} className="text-accent" />
            <p className="text-sm font-medium text-accent">{n.title[lang]}</p>
          </div>
          <ul className="mt-2 list-disc pl-4 text-xs text-foreground">
            {n.points[lang].map((pt, j) => (
              <li key={j}>{pt}</li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-foreground-muted">{n.generatedFrom[lang]}</p>
        </div>
      ))}
    </div>
  );
}

export function MistakeBookPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      {mistakeBookEntries.map((m, i) => (
        <div key={i} className="rounded-xl border border-border p-3.5">
          <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-muted">
            {m.subject[lang]}
          </span>
          <p className="mt-2 text-sm font-medium">{m.question[lang]}</p>
          <p className="mt-2 text-xs text-danger">
            {strings.yourAnswer[lang]}: <span className="line-through">{m.yourAnswer[lang]}</span>
          </p>
          <p className="mt-1 text-xs text-success">
            {strings.correctAnswer[lang]}: {m.correctAnswer[lang]}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SavedAnswersPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col gap-3">
      {savedAnswers.map((a, i) => (
        <div key={i} className="rounded-xl border border-border p-3.5">
          <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground-muted">
            {a.subject[lang]}
          </span>
          <p className="mt-2 text-sm font-medium">{a.question[lang]}</p>
          <p className="mt-1 text-xs text-foreground-muted">{a.answer[lang]}</p>
          <p className="mt-2 text-xs text-foreground-muted">{a.source[lang]}</p>
        </div>
      ))}
    </div>
  );
}

export function MyLibraryPanel({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState<"aiNotebook" | "savedAnswers">("aiNotebook");
  const notebookTabRef = useRef<HTMLButtonElement>(null);
  const savedTabRef = useRef<HTMLButtonElement>(null);
  const idBase = useId();
  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
      active ? "bg-accent-soft text-accent" : "text-foreground-muted hover:text-foreground"
    }`;

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    if (tab === "aiNotebook") {
      setTab("savedAnswers");
      savedTabRef.current?.focus();
    } else {
      setTab("aiNotebook");
      notebookTabRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex gap-1 rounded-lg border border-border p-1">
        <button
          ref={notebookTabRef}
          role="tab"
          id={`${idBase}-tab-notebook`}
          aria-selected={tab === "aiNotebook"}
          aria-controls={`${idBase}-panel-notebook`}
          tabIndex={tab === "aiNotebook" ? 0 : -1}
          onClick={() => setTab("aiNotebook")}
          onKeyDown={handleTabKeyDown}
          className={tabClass(tab === "aiNotebook")}
        >
          <Sparkles size={13} strokeWidth={1.75} />
          {strings.aiNotebookTitle[lang]}
        </button>
        <button
          ref={savedTabRef}
          role="tab"
          id={`${idBase}-tab-saved`}
          aria-selected={tab === "savedAnswers"}
          aria-controls={`${idBase}-panel-saved`}
          tabIndex={tab === "savedAnswers" ? 0 : -1}
          onClick={() => setTab("savedAnswers")}
          onKeyDown={handleTabKeyDown}
          className={tabClass(tab === "savedAnswers")}
        >
          <FileCheck2 size={13} strokeWidth={1.75} />
          {strings.savedAnswersTitle[lang]}
        </button>
      </div>
      {tab === "aiNotebook" ? (
        <div role="tabpanel" id={`${idBase}-panel-notebook`} aria-labelledby={`${idBase}-tab-notebook`}>
          <AiNotebookPanel lang={lang} />
        </div>
      ) : (
        <div role="tabpanel" id={`${idBase}-panel-saved`} aria-labelledby={`${idBase}-tab-saved`}>
          <SavedAnswersPanel lang={lang} />
        </div>
      )}
    </div>
  );
}

export function AiRoadmapPanel({ lang }: { lang: Lang }) {
  return (
    <div className="flex flex-col">
      {roadmapWeeks.map((w, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                w.status === "done"
                  ? "bg-success text-white"
                  : w.status === "in-progress"
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-foreground-muted"
              }`}
            >
              {w.status === "done" ? <Check size={11} strokeWidth={3} /> : i + 1}
            </span>
            {i < roadmapWeeks.length - 1 && <span className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-4">
            <p className="text-sm font-medium">{w.week[lang]}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{w.topics[lang]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
