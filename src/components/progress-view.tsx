import { ProgressBar } from "@/components/progress-bar";
import type { CanvasView } from "@/components/sidebar";
import { strings, type Lang } from "@/lib/i18n";
import { subjects, streakDays, suggestedTopic } from "@/lib/curriculum-data";
import { daysUntil, type StudyPlan } from "@/lib/study-plan";

export function ProgressView({
  lang,
  plan,
  onNavigate,
}: {
  lang: Lang;
  plan: StudyPlan;
  onNavigate: (view: CanvasView) => void;
}) {
  const overallProgress = Math.round(
    subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length
  );
  const remaining = daysUntil(plan.examDate);
  const crashLabel =
    remaining !== null && remaining >= 0
      ? lang === "en"
        ? `${remaining} days to ${plan.examName || "your exam"} — Start Crash Mode`
        : `${plan.examName || "তোমার পরীক্ষার"} জন্য ${remaining} দিন বাকি — ক্র্যাশ মোড শুরু করো`
      : strings.crashMode[lang];

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-5 overflow-y-auto p-5 sm:p-8">
      <div>
        <p className="text-sm text-foreground-muted">
          🔥 {streakDays} {strings.streak[lang]}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{strings.greeting[lang]}</h1>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{strings.overallProgress[lang]}</span>
          <span className="tabular-nums text-foreground-muted">{overallProgress}%</span>
        </div>
        <ProgressBar value={overallProgress} className="mt-2" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {suggestedTopic.subjectName[lang]}
        </p>
        <p className="mt-1 text-base font-medium">{suggestedTopic.chapterName[lang]}</p>
        <ProgressBar value={suggestedTopic.progress} className="mt-3" />
        <button className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
          {strings.continueStudying[lang]}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
          {strings.subjects[lang]}
        </p>
        <div className="flex flex-col gap-3">
          {subjects.map((s) => (
            <div key={s.id}>
              <div className="flex items-center justify-between text-sm">
                <span>{s.name[lang]}</span>
                <span className="tabular-nums text-foreground-muted">{s.progress}%</span>
              </div>
              <ProgressBar value={s.progress} className="mt-1.5" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onNavigate(remaining === null ? "setup" : "chat")}
        className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-left"
      >
        <p className="text-sm font-medium text-warning">{crashLabel}</p>
      </button>
    </div>
  );
}
