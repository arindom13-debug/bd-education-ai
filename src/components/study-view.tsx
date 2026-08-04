"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/progress-bar";
import { strings, type Lang } from "@/lib/i18n";
import { subjects, type ChapterStatus } from "@/lib/curriculum-data";

function StatusIcon({ status }: { status: ChapterStatus }) {
  if (status === "mastered") {
    return (
      <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-[10px] text-white">
        ✓
      </span>
    );
  }
  if (status === "in-progress") {
    return <span className="size-2.5 shrink-0 rounded-full bg-accent" />;
  }
  return <span className="size-2.5 shrink-0 rounded-full border border-border" />;
}

export function StudyView({ lang }: { lang: Lang }) {
  const [expanded, setExpanded] = useState<string | null>("chemistry");

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-4 overflow-y-auto p-5 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{strings.studyPlan[lang]}</h1>

      <div className="flex flex-col gap-2">
        {subjects.map((subject) => {
          const isExpanded = expanded === subject.id;
          return (
            <div key={subject.id} className="rounded-xl border border-border bg-surface">
              <button
                onClick={() => setExpanded(isExpanded ? null : subject.id)}
                className="flex w-full flex-col gap-2 p-4 text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted">{isExpanded ? "▾" : "▸"}</span>
                  <span className="flex-1 font-medium">{subject.name[lang]}</span>
                  <span className="text-sm tabular-nums text-foreground-muted">{subject.progress}%</span>
                </span>
                <ProgressBar value={subject.progress} className="ml-5 w-auto" />
              </button>
              {isExpanded && (
                <div className="border-t border-border px-4 py-2">
                  {subject.chapters.length === 0 ? (
                    <p className="py-2 text-sm text-foreground-muted">
                      {lang === "en" ? "Chapters coming soon." : "অধ্যায়সমূহ শীঘ্রই আসছে।"}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-0.5 py-1">
                      {subject.chapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-center gap-2.5 rounded-md px-1.5 py-2 text-sm hover:bg-surface-muted"
                        >
                          <StatusIcon status={chapter.status} />
                          <span className="flex-1 truncate">{chapter.name[lang]}</span>
                          {chapter.status === "in-progress" && (
                            <span className="text-xs tabular-nums text-foreground-muted">
                              {chapter.progress}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
