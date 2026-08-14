"use client";

import { Sparkles } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { whatsNewEntries, type ChangelogTag } from "@/lib/account-data";

const TAG_LABEL: Record<ChangelogTag, keyof typeof strings> = {
  new: "whatsNewTagNew",
  improved: "whatsNewTagImproved",
  fixed: "whatsNewTagFixed",
};

const TAG_CLASSES: Record<ChangelogTag, string> = {
  new: "bg-accent-soft text-accent",
  improved: "bg-success/15 text-success",
  fixed: "bg-warning/15 text-warning",
};

export function WhatsNewView({ lang }: { lang: Lang }) {
  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.whatsNewPageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.whatsNewPageSubtitle[lang]}</p>
        </div>

        <div className="flex flex-col gap-4">
          {whatsNewEntries.map((entry) => (
            <div key={entry.id} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-strong">
                <Sparkles size={16} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_CLASSES[entry.tag]}`}>
                    {strings[TAG_LABEL[entry.tag]][lang]}
                  </span>
                  <span className="text-xs text-foreground-muted">{entry.date[lang]}</span>
                </div>
                <p className="mt-1.5 text-sm font-semibold">{entry.title[lang]}</p>
                <p className="mt-1 text-sm text-foreground-muted">{entry.description[lang]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
