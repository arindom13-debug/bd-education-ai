"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { Subject } from "@/lib/curriculum-data";
import { durationOptions, schedulableChapters } from "@/lib/study-schedule";
import type { TimerContext } from "@/lib/study-timer";
import { ChapterStatusTag, SelectField } from "@/components/schedule-fields";

/**
 * Start studying right now without going near the schedule. Shared by the
 * timer popover and the Schedule page so "start a session" behaves identically
 * wherever the student reaches for it.
 */
export function StartStudyForm({
  lang,
  subjects,
  defaultMinutes,
  onStart,
}: {
  lang: Lang;
  subjects: Subject[];
  defaultMinutes: number;
  onStart: (context: TimerContext, minutes: number) => void;
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const subject = subjects.find((s) => s.id === subjectId) ?? null;
  const chapters = subject ? schedulableChapters(subject) : [];
  const [chapterId, setChapterId] = useState<string>(chapters[0]?.id ?? "");
  const [minutes, setMinutes] = useState(defaultMinutes);

  const selectSubject = (id: string) => {
    setSubjectId(id);
    const next = subjects.find((s) => s.id === id);
    setChapterId(next ? schedulableChapters(next)[0]?.id ?? "" : "");
  };

  const chapter = chapters.find((c) => c.id === chapterId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground-strong">{strings.scheduleStartStudyTitle[lang]}</p>

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

      <SelectField
        label={strings.scheduleDurationLabel[lang]}
        value={String(minutes)}
        onChange={(v) => setMinutes(Number(v))}
        options={durationOptions.map((d) => ({ value: String(d), label: `${d} ${strings.minutesWord[lang]}` }))}
      />

      <button
        disabled={!subjectId}
        onClick={() => onStart({ subjectId, chapterId: chapterId || null }, minutes)}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
      >
        <Play size={14} strokeWidth={2} />
        {strings.scheduleStartSessionBtn[lang]}
      </button>
    </div>
  );
}
