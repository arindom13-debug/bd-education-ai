"use client";

import { useState } from "react";
import { strings, type Lang } from "@/lib/i18n";
import {
  curriculumTrackOptions,
  subjectGroupOptions,
  weekdayOptions,
  daysUntil,
  type StudyPlan,
} from "@/lib/study-plan";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export function SetupView({
  lang,
  plan,
  onChange,
  onStartPersonalize,
}: {
  lang: Lang;
  plan: StudyPlan;
  onChange: (patch: Partial<StudyPlan>) => void;
  onStartPersonalize: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const remaining = daysUntil(plan.examDate);

  const toggleDay = (day: StudyPlan["studyDays"][number]) => {
    const has = plan.studyDays.includes(day);
    onChange({
      studyDays: has ? plan.studyDays.filter((d) => d !== day) : [...plan.studyDays, day],
    });
  };

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 overflow-y-auto p-5 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{strings.setupTitle[lang]}</h1>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4">
        <p className="text-sm text-foreground">{strings.personalizeHint[lang]}</p>
        <button
          onClick={onStartPersonalize}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
        >
          {strings.personalizeButton[lang]}
        </button>
      </div>

      <Section title={strings.examSection[lang]}>
        <Field label={strings.examName[lang]}>
          <input
            className={inputClass}
            value={plan.examName}
            onChange={(e) => onChange({ examName: e.target.value })}
            placeholder={strings.examNamePlaceholder[lang]}
          />
        </Field>
        <Field label={strings.examDate[lang]}>
          <input
            type="date"
            className={inputClass}
            value={plan.examDate}
            onChange={(e) => onChange({ examDate: e.target.value })}
          />
        </Field>
        {remaining !== null && (
          <p className="text-sm font-medium text-accent">
            {remaining >= 0
              ? `${remaining} ${strings.daysLeft[lang]}`
              : lang === "en"
              ? "This date has passed"
              : "তারিখটি পার হয়ে গেছে"}
          </p>
        )}
      </Section>

      <Section title={strings.goalSection[lang]}>
        <textarea
          className={`${inputClass} min-h-20 resize-none`}
          value={plan.goal}
          onChange={(e) => onChange({ goal: e.target.value })}
          placeholder={strings.goalPlaceholder[lang]}
        />
      </Section>

      <Section title={strings.syllabusSection[lang]}>
        <Field label={strings.curriculumTrack[lang]}>
          <select
            className={inputClass}
            value={plan.curriculumTrack}
            onChange={(e) => onChange({ curriculumTrack: e.target.value as StudyPlan["curriculumTrack"] })}
          >
            {curriculumTrackOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[lang]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={strings.subjectGroup[lang]}>
          <select
            className={inputClass}
            value={plan.subjectGroup}
            onChange={(e) => onChange({ subjectGroup: e.target.value as StudyPlan["subjectGroup"] })}
          >
            {subjectGroupOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label[lang]}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title={strings.routineSection[lang]}>
        <Field label={`${strings.dailyStudyTime[lang]} (${plan.dailyMinutes} ${strings.minutesPerDay[lang]})`}>
          <input
            type="range"
            min={15}
            max={240}
            step={15}
            value={plan.dailyMinutes}
            onChange={(e) => onChange({ dailyMinutes: Number(e.target.value) })}
          />
        </Field>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground-muted">{strings.studyDays[lang]}</span>
          <div className="flex flex-wrap gap-1.5">
            {weekdayOptions.map((opt) => {
              const active = plan.studyDays.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleDay(opt.value)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-foreground-muted"
                  }`}
                >
                  {opt.label[lang]}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <button
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        }}
        className="self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
      >
        {saved ? "✓" : strings.saveSetup[lang]}
      </button>
    </div>
  );
}
