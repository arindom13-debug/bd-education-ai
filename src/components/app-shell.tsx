"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
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
import { StudySessionView } from "@/components/study-session-view";
import { Tooltip } from "@/components/tooltip";
import { strings, type Lang } from "@/lib/i18n";
import { chatHistory, onboardingThread } from "@/lib/chat-data";
import { loadStudyPlan, saveStudyPlan, classLevelOptions, type StudyPlan } from "@/lib/study-plan";
import { subjects as initialSubjects, type Subject, type Chapter, type ChapterStatus } from "@/lib/curriculum-data";
import { loadChatLanguage, saveChatLanguage, type ChatLanguage } from "@/lib/chat-language";
import { defaultCountdowns, getMainCountdown, type Countdown } from "@/lib/countdowns";
import { MainCountdownStrip } from "@/components/main-countdown-strip";

const EASE = [0.16, 1, 0.3, 1] as const;

export function AppShell() {
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<CanvasView>("chat");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studySessionActive, setStudySessionActive] = useState(false);
  const [chatLanguage, setChatLanguageState] = useState<ChatLanguage>(() => loadChatLanguage());
  const setChatLanguage = (value: ChatLanguage) => {
    setChatLanguageState(value);
    saveChatLanguage(value);
  };
  const [plan, setPlan] = useState<StudyPlan>(() => loadStudyPlan());
  const updatePlan = (patch: Partial<StudyPlan>) =>
    setPlan((p) => {
      const next = { ...p, ...patch };
      saveStudyPlan(next);
      return next;
    });
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const addSubject = (name: string, targetChapters?: number) =>
    setSubjects((prev) => [
      ...prev,
      {
        id: `subject-${Date.now()}`,
        name: { en: name, bn: name },
        progress: 0,
        chapters: [],
        totalChapters: targetChapters && targetChapters > 0 ? targetChapters : 10,
        lastStudiedDaysAgo: 0,
      },
    ]);
  const renameSubject = (id: string, name: string) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name: { en: name, bn: name } } : s)));
  const removeSubject = (id: string) => setSubjects((prev) => prev.filter((s) => s.id !== id));
  const reorderSubjects = (reordered: Subject[]) => setSubjects(reordered);
  const addChapter = (subjectId: string, name: string, estimatedMinutes?: number) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: [
                ...s.chapters,
                {
                  id: `chapter-${Date.now()}`,
                  name: { en: name, bn: name },
                  status: "not-started" as const,
                  progress: 0,
                  estimatedMinutes: estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : undefined,
                },
              ],
            }
          : s
      )
    );
  const removeChapter = (subjectId: string, chapterId: string) =>
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, chapters: s.chapters.filter((c) => c.id !== chapterId) } : s))
    );
  const renameChapter = (subjectId: string, chapterId: string, name: string) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, name: { en: name, bn: name } } : c)) }
          : s
      )
    );
  const setChapterMinutes = (subjectId: string, chapterId: string, minutes: number) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chapters: s.chapters.map((c) => (c.id === chapterId ? { ...c, estimatedMinutes: minutes } : c)) }
          : s
      )
    );
  const setChapterStatus = (subjectId: string, chapterId: string, status: ChapterStatus) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? {
              ...s,
              chapters: s.chapters.map((c) =>
                c.id === chapterId
                  ? {
                      ...c,
                      status,
                      progress:
                        status === "not-started"
                          ? 0
                          : status === "mastered" || status === "needs-revision"
                          ? 100
                          : c.progress > 0 && c.progress < 100
                          ? c.progress
                          : 50,
                    }
                  : c
              ),
            }
          : s
      )
    );
  const reorderChapters = (subjectId: string, reordered: Chapter[]) =>
    setSubjects((prev) => prev.map((s) => (s.id === subjectId ? { ...s, chapters: reordered } : s)));

  const [countdowns, setCountdowns] = useState<Countdown[]>(defaultCountdowns);
  const mainCountdown = getMainCountdown(countdowns);
  const addCountdown = (draft: { name: string; targetDate: string; description?: string }) =>
    setCountdowns((prev) => [
      ...prev,
      { id: `countdown-${Date.now()}`, isMain: prev.length === 0, ...draft },
    ]);
  const updateCountdown = (id: string, draft: { name: string; targetDate: string; description?: string }) =>
    setCountdowns((prev) => prev.map((c) => (c.id === id ? { ...c, ...draft } : c)));
  const deleteCountdown = (id: string) =>
    setCountdowns((prev) => {
      const next = prev.filter((c) => c.id !== id);
      const removedWasMain = prev.find((c) => c.id === id)?.isMain;
      if (removedWasMain && next.length > 0 && !next.some((c) => c.isMain)) {
        next[0] = { ...next[0], isMain: true };
      }
      return next;
    });
  const setMainCountdown = (id: string) =>
    setCountdowns((prev) => prev.map((c) => ({ ...c, isMain: c.id === id })));
  const reorderCountdowns = (reordered: Countdown[]) => setCountdowns(reordered);

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
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {studySessionActive && (
          <StudySessionView
            lang={lang}
            subjects={subjects}
            onEnd={() => setStudySessionActive(false)}
            onFinish={(subjectId, chapterId) => setChapterStatus(subjectId, chapterId, "mastered")}
          />
        )}
      </AnimatePresence>
      {!studySessionActive && (
    <div className="min-h-dvh">
      <aside
        className={`fixed inset-y-0 left-0 z-10 hidden overflow-hidden border-border bg-sidebar transition-[width,border-color] duration-300 ease-in-out md:flex md:flex-col ${
          sidebarCollapsed ? "md:w-0 md:border-r-0" : "md:w-72 md:border-r"
        }`}
      >
        <div className="flex h-full w-72 shrink-0 flex-col overflow-y-auto overflow-x-hidden">
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
            plan={plan}
            chatLanguage={chatLanguage}
            onChangeChatLanguage={setChatLanguage}
            mainCountdown={mainCountdown}
          />
        </div>
      </aside>

      <div
        className={`fixed left-3 top-3 z-10 hidden transition-opacity duration-300 ease-in-out md:block ${
          sidebarCollapsed ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <Tooltip label={strings.expandSidebarLabel[lang]}>
          <button
            onClick={() => setSidebarCollapsed(false)}
            aria-label="Open sidebar"
            className="flex rounded-md border border-border bg-surface p-1.5 text-foreground-muted transition-colors duration-150 hover:text-foreground active:scale-95"
          >
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center rounded-md p-1.5 text-foreground-muted transition-colors duration-150 active:scale-95"
            aria-label="Menu"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <BrandMark size={22} />
          <span className="text-[15px] font-semibold tracking-tight">{strings.appName[lang]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLang}
            className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted transition-colors duration-150 hover:text-foreground"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
        </div>
      </header>

      <div className="sticky top-[53px] z-20 md:hidden">
        <MainCountdownStrip lang={lang} countdown={mainCountdown} variant="mobile" />
      </div>

      <main
        className={`pb-16 transition-[margin-left] duration-300 ease-in-out md:pb-0 ${
          sidebarCollapsed ? "md:ml-0" : "md:ml-72"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {view === "chat" && (
              <ChatView
                key={activeChat?.id ?? "new"}
                lang={lang}
                activeChat={activeChat}
                plan={plan}
                subjects={subjects}
                chatLanguage={chatLanguage}
                onOpenChat={selectChat}
              />
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
                onRenameSubject={renameSubject}
                onReorderSubjects={reorderSubjects}
                onAddChapter={addChapter}
                onRemoveChapter={removeChapter}
                onRenameChapter={renameChapter}
                onSetChapterStatus={setChapterStatus}
                onSetChapterMinutes={setChapterMinutes}
                onReorderChapters={reorderChapters}
                onNavigate={selectView}
                onStartSession={() => setStudySessionActive(true)}
              />
            )}
            {view === "setup" && (
              <SetupView lang={lang} plan={plan} onChange={updatePlan} onFinish={() => selectView("chat")} />
            )}
            {view === "tools" && (
              <ToolsView
                lang={lang}
                countdowns={countdowns}
                onAddCountdown={addCountdown}
                onUpdateCountdown={updateCountdown}
                onDeleteCountdown={deleteCountdown}
                onSetMainCountdown={setMainCountdown}
                onReorderCountdowns={reorderCountdowns}
              />
            )}
            {view === "examMode" && (
              <ExamModeView lang={lang} plan={plan} subjects={subjects} onNavigate={selectView} />
            )}
            {view === "panicRevision" && (
              <PanicRevisionView lang={lang} plan={plan} subjects={subjects} onNavigate={selectView} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="sticky bottom-0 z-20 md:hidden">
        <BottomNav lang={lang} active={view} onSelect={selectView} />
      </div>

      <div
        className={`fixed inset-0 z-50 flex md:hidden ${historyOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`h-full w-72 max-w-[80vw] overflow-y-auto overflow-x-hidden border-r border-border bg-sidebar transition-transform duration-300 ease-in-out ${
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
            plan={plan}
            chatLanguage={chatLanguage}
            onChangeChatLanguage={setChatLanguage}
            mainCountdown={mainCountdown}
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
      )}
    </MotionConfig>
  );
}
