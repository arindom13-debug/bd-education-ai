"use client";

import { useState } from "react";
import { Menu, PanelLeftOpen } from "lucide-react";
import { Sidebar, BrandMark, type CanvasView } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { ChatView } from "@/components/chat-view";
import { ProgressView } from "@/components/progress-view";
import { StudyView } from "@/components/study-view";
import { SetupView } from "@/components/setup-view";
import { ToolsView } from "@/components/tools-view";
import { ExamModeView } from "@/components/exam-mode-view";
import { PanicRevisionView } from "@/components/panic-revision-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { strings, type Lang } from "@/lib/i18n";
import { chatHistory, onboardingThread } from "@/lib/chat-data";
import { defaultStudyPlan, classLevelOptions, type StudyPlan } from "@/lib/study-plan";
import { subjects as initialSubjects, type Subject } from "@/lib/curriculum-data";

export function AppShell() {
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<CanvasView>("chat");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [plan, setPlan] = useState<StudyPlan>(defaultStudyPlan);
  const updatePlan = (patch: Partial<StudyPlan>) => setPlan((p) => ({ ...p, ...patch }));
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const addSubject = (name: string) =>
    setSubjects((prev) => [
      ...prev,
      {
        id: `subject-${Date.now()}`,
        name: { en: name, bn: name },
        progress: 0,
        chapters: [],
        totalChapters: 10,
        lastStudiedDaysAgo: 0,
      },
    ]);
  const removeSubject = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));
  const reorderSubjects = (reordered: Subject[]) => setSubjects(reordered);
  const addChapter = (subjectId: string, name: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: [
                ...s.chapters,
                { id: `chapter-${Date.now()}`, name: { en: name, bn: name }, status: "not-started" as const, progress: 0 },
              ],
            }
          : s
      )
    );
  const toggleChapter = (subjectId: string, chapterId: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId
                  ? {
                      ...c,
                      status: c.status === "mastered" ? ("not-started" as const) : ("mastered" as const),
                      progress: c.status === "mastered" ? 0 : 100,
                    }
                  : c
              ),
            }
          : s
      )
    );
  const toggleLang = () => setLang((l) => (l === "en" ? "bn" : "en"));
  const studentName = plan.name.trim() || strings.defaultStudentName[lang];
  const studentClassLabel = classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang] ?? "";
  const activeChat =
    activeChatId === onboardingThread.id
      ? onboardingThread
      : chatHistory.find((c) => c.id === activeChatId) ?? null;

  const selectView = (v: CanvasView) => {
    setView(v);
    setHistoryOpen(false);
  };
  const selectChat = (id: string) => {
    setActiveChatId(id);
    setView("chat");
    setHistoryOpen(false);
  };
  const newChat = () => {
    setActiveChatId(null);
    setView("chat");
    setHistoryOpen(false);
  };

  return (
    <div className="min-h-dvh">
      <aside
        className={`fixed inset-y-0 left-0 z-10 hidden overflow-hidden border-border bg-surface transition-[width,border-color] duration-300 ease-in-out md:flex md:flex-col ${
          sidebarCollapsed ? "md:w-0 md:border-r-0" : "md:w-72 md:border-r"
        }`}
      >
        <div className="flex h-full w-72 shrink-0 flex-col">
          <Sidebar
            lang={lang}
            onToggleLang={toggleLang}
            view={view}
            activeChatId={activeChatId}
            onSelectView={selectView}
            onSelectChat={selectChat}
            onNewChat={newChat}
            onCollapse={() => setSidebarCollapsed(true)}
            studentName={studentName}
            studentClassLabel={studentClassLabel}
          />
        </div>
      </aside>

      <button
        onClick={() => setSidebarCollapsed(false)}
        aria-label="Open sidebar"
        className={`fixed left-3 top-3 z-10 hidden rounded-md border border-border bg-surface p-1.5 text-foreground-muted transition-opacity duration-300 ease-in-out hover:text-foreground md:flex ${
          sidebarCollapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <PanelLeftOpen size={18} strokeWidth={1.75} />
      </button>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center rounded-md p-1.5 text-foreground-muted"
            aria-label="Menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <BrandMark size={22} />
          <span className="text-[15px] font-semibold tracking-tight">{strings.appName[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={toggleLang}
            className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
      </header>

      <main
        className={`pb-16 transition-[margin-left] duration-300 ease-in-out md:pb-0 ${
          sidebarCollapsed ? "md:ml-0" : "md:ml-72"
        }`}
      >
        {view === "chat" && (
          <ChatView key={activeChat?.id ?? "new"} lang={lang} activeChat={activeChat} />
        )}
        {view === "progress" && (
          <ProgressView
            lang={lang}
            plan={plan}
            onNavigate={selectView}
            subjects={subjects}
            onOpenChat={selectChat}
          />
        )}
        {view === "study" && (
          <StudyView
            lang={lang}
            subjects={subjects}
            onAddSubject={addSubject}
            onRemoveSubject={removeSubject}
            onAddChapter={addChapter}
            onToggleChapter={toggleChapter}
            onReorderSubjects={reorderSubjects}
          />
        )}
        {view === "setup" && (
          <SetupView lang={lang} plan={plan} onChange={updatePlan} onFinish={() => selectView("progress")} />
        )}
        {view === "tools" && <ToolsView lang={lang} />}
        {view === "examMode" && (
          <ExamModeView lang={lang} plan={plan} subjects={subjects} onNavigate={selectView} />
        )}
        {view === "panicRevision" && (
          <PanicRevisionView lang={lang} plan={plan} subjects={subjects} onNavigate={selectView} />
        )}
      </main>

      <div className="sticky bottom-0 z-20 md:hidden">
        <BottomNav lang={lang} active={view} onSelect={selectView} />
      </div>

      <div
        className={`fixed inset-0 z-50 flex md:hidden ${historyOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`h-full w-72 max-w-[80vw] border-r border-border bg-surface transition-transform duration-300 ease-in-out ${
            historyOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            lang={lang}
            onToggleLang={toggleLang}
            view={view}
            activeChatId={activeChatId}
            onSelectView={selectView}
            onSelectChat={selectChat}
            onNewChat={newChat}
            studentName={studentName}
            studentClassLabel={studentClassLabel}
          />
        </div>
        <button
          className={`flex-1 bg-black/40 transition-opacity duration-300 ease-in-out ${
            historyOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setHistoryOpen(false)}
          aria-label="Close history"
        />
      </div>
    </div>
  );
}
