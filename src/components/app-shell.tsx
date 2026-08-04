"use client";

import { useState } from "react";
import { Sidebar, type CanvasView } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { ChatView } from "@/components/chat-view";
import { ProgressView } from "@/components/progress-view";
import { StudyView } from "@/components/study-view";
import { SetupView } from "@/components/setup-view";
import { strings, type Lang } from "@/lib/i18n";
import { chatHistory, onboardingThread } from "@/lib/chat-data";
import { defaultStudyPlan, type StudyPlan } from "@/lib/study-plan";

export function AppShell() {
  const [lang, setLang] = useState<Lang>("en");
  const [view, setView] = useState<CanvasView>("chat");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [plan, setPlan] = useState<StudyPlan>(defaultStudyPlan);
  const updatePlan = (patch: Partial<StudyPlan>) => setPlan((p) => ({ ...p, ...patch }));

  const toggleLang = () => setLang((l) => (l === "en" ? "bn" : "en"));
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
  const startPersonalizeChat = () => {
    setActiveChatId(onboardingThread.id);
    setView("chat");
    setHistoryOpen(false);
  };

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <aside className="hidden md:flex md:w-72 md:flex-col md:border-r md:border-border">
        <Sidebar
          lang={lang}
          onToggleLang={toggleLang}
          view={view}
          activeChatId={activeChatId}
          onSelectView={selectView}
          onSelectChat={selectChat}
          onNewChat={newChat}
        />
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistoryOpen(true)}
            className="rounded-md px-1.5 py-1 text-lg leading-none text-foreground-muted"
            aria-label="Menu"
          >
            ☰
          </button>
          <span className="text-sm font-semibold tracking-tight">{strings.appName[lang]}</span>
        </div>
        <button
          onClick={toggleLang}
          className="rounded-md border border-border px-2 py-1 text-xs text-foreground-muted"
        >
          {lang === "en" ? "বাংলা" : "EN"}
        </button>
      </header>

      <main className="min-h-0 flex-1">
        {view === "chat" && (
          <ChatView key={activeChat?.id ?? "new"} lang={lang} activeChat={activeChat} />
        )}
        {view === "progress" && <ProgressView lang={lang} plan={plan} onNavigate={selectView} />}
        {view === "study" && <StudyView lang={lang} />}
        {view === "setup" && (
          <SetupView lang={lang} plan={plan} onChange={updatePlan} onStartPersonalize={startPersonalizeChat} />
        )}
      </main>

      <div className="md:hidden">
        <BottomNav lang={lang} active={view} onSelect={selectView} />
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-72 max-w-[80vw] border-r border-border">
            <Sidebar
              lang={lang}
              onToggleLang={toggleLang}
              view={view}
              activeChatId={activeChatId}
              onSelectView={selectView}
              onSelectChat={selectChat}
              onNewChat={newChat}
            />
          </div>
          <button
            className="flex-1 bg-black/40"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close history"
          />
        </div>
      )}
    </div>
  );
}
