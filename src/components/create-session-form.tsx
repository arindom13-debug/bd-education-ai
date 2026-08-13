"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";
import { durationOptions, schedulableChapters, todayKey, type StudySession } from "@/lib/study-schedule";
import { ChapterStatusTag, InputField, SelectField } from "@/components/schedule-fields";

/**
 * Manual "create a session" form — shared by the Schedule page and Plan My
 * Week's edit mode so "add a session" behaves identically wherever it's reached.
 */
export function CreateSessionForm({
  lang,
  subjects,
  initialDate,
  onCreate,
}: {
  lang: Lang;
  subjects: Subject[];
  initialDate?: string;
  onCreate: (draft: Omit<StudySession, "id" | "status">) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const subject = subjects.find((s) => s.id === subjectId) ?? null;
  const chapters = subject ? schedulableChapters(subject) : [];
  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? "");
  const [date, setDate] = useState(initialDate ?? todayKey());
  const [startTime, setStartTime] = useState("17:00");
  const [duration, setDuration] = useState(45);
  const [goal, setGoal] = useState("");

  const selectSubject = (id: string) => {
    setSubjectId(id);
    const next = subjects.find((s) => s.id === id);
    setChapterId(next ? schedulableChapters(next)[0]?.id ?? "" : "");
  };

  const chapter = chapters.find((c) => c.id === chapterId) ?? null;

  const submit = () => {
    if (!subjectId) return;
    onCreate({
      subjectId,
      chapterId: chapterId || null,
      date,
      startTime,
      durationMinutes: duration,
      goal: goal.trim() || undefined,
      source: "student",
    });
    setGoal("");
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <SelectField
        label={strings.scheduleSubjectLabel[lang]}
        value={subjectId}
        onChange={selectSubject}
        options={subjects.map((s) => ({ value: s.id, label: s.name[lang] }))}
      />
      <div className="flex flex-col gap-1">
        <SelectField
          label={strings.scheduleTopicLabel[lang]}
          value={chapterId}
          onChange={setChapterId}
          options={[
            { value: "", label: strings.scheduleWholeSubject[lang] },
            ...chapters.map((c) => ({ value: c.id, label: c.name[lang] })),
          ]}
        />
        {chapter && <ChapterStatusTag lang={lang} status={chapter.status} />}
      </div>
      <InputField label={strings.scheduleDateLabel[lang]} type="date" value={date} onChange={setDate} />
      <InputField
        label={strings.scheduleStartTimeLabel[lang]}
        type="time"
        value={startTime}
        onChange={setStartTime}
      />
      <SelectField
        label={strings.scheduleDurationLabel[lang]}
        value={String(duration)}
        onChange={(v) => setDuration(Number(v))}
        options={durationOptions.map((d) => ({ value: String(d), label: `${d} ${strings.minutesWord[lang]}` }))}
      />
      <InputField
        label={strings.scheduleGoalOptional[lang]}
        value={goal}
        onChange={setGoal}
        placeholder={strings.scheduleGoalPlaceholder[lang]}
      />
      <div className="sm:col-span-2">
        <button
          onClick={submit}
          disabled={!subjectId}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          <Plus size={14} strokeWidth={2} />
          {strings.scheduleAddSessionBtn[lang]}
        </button>
      </div>
    </div>
  );
}
