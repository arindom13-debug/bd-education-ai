"use client";

import { ChevronDown } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import type { ChapterStatus } from "@/lib/curriculum-data";

const fieldClass =
  "w-full appearance-none rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 hover:border-foreground-faint focus:border-foreground-faint";

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{children}</span>;
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${fieldClass} pr-8`}>
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-control">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted"
        />
      </div>
    </label>
  );
}

export function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={fieldClass}
      />
    </label>
  );
}

/** The chapter's Study Plan state, shown wherever a topic is being picked so
 * scheduling and progress never look like two different systems. */
export function ChapterStatusTag({ lang, status }: { lang: Lang; status: ChapterStatus }) {
  const label =
    status === "mastered"
      ? strings.statusCompleted[lang]
      : status === "in-progress"
      ? strings.statusInProgress[lang]
      : status === "needs-revision"
      ? strings.statusNeedsRevision[lang]
      : strings.statusNotStarted[lang];
  return <span className="text-[11px] text-foreground-faint">{label}</span>;
}
