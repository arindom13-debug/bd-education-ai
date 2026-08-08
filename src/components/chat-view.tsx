"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { subjects as allSubjects, streakDays, type Subject } from "@/lib/curriculum-data";
import { placeholderYesterdayMinutes } from "@/lib/daily-briefing";
import type { StudyPlan } from "@/lib/study-plan";
import { getDemoReplyText, type ChatLanguage } from "@/lib/chat-language";
import type { ChatMessage, ChatThread } from "@/lib/chat-data";
import { TypingDots } from "@/components/typing-dots";
import { DailyBriefing } from "@/components/daily-briefing";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { AiRecommendationStrip } from "@/components/ai-recommendation-strip";
import { RecentChatsSection } from "@/components/recent-chats-section";
import { SubjectWorkspace } from "@/components/subject-workspace";

function Bubble({ message, lang }: { message: ChatMessage; lang: Lang }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-accent text-accent-foreground"
              : "border border-border bg-surface"
          }`}
        >
          {message.text[lang]}
        </div>
        {!isUser && (
          <p
            className={`mt-1.5 px-1 text-xs ${
              message.source ? "text-foreground-muted" : "text-warning"
            }`}
          >
            {message.source
              ? message.source[lang]
              : lang === "en"
              ? "Not yet verified against your textbook — general AI answer"
              : "এখনো তোমার পাঠ্যবইয়ের সাথে যাচাই করা হয়নি — সাধারণ এআই উত্তর"}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChatView({
  lang,
  activeChat,
  plan,
  subjects,
  chatLanguage,
  onStartSession,
  onOpenChat,
}: {
  lang: Lang;
  activeChat: ChatThread | null;
  plan: StudyPlan;
  subjects: Subject[];
  chatLanguage: ChatLanguage;
  onStartSession: () => void;
  onOpenChat: (id: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(activeChat?.messages ?? []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: { en: trimmed, bn: trimmed } }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply = getDemoReplyText(chatLanguage);
      setMessages((prev) => [...prev, { role: "ai", text: { en: reply, bn: reply } }]);
    }, 700);
  };

  const composer = (
    <div className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-border bg-surface p-2.5 shadow-md">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        rows={1}
        placeholder={strings.chatPlaceholder[lang]}
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-foreground-muted"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        aria-label={strings.send[lang]}
        className="flex shrink-0 items-center justify-center rounded-full bg-accent p-2 text-accent-foreground disabled:opacity-40"
      >
        <ArrowUp size={18} strokeWidth={2} />
      </button>
    </div>
  );

  if (messages.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
        <DailyBriefing
          lang={lang}
          studentName={plan.name.trim()}
          examDate={plan.examDate}
          streakDays={streakDays}
          yesterdayMinutes={placeholderYesterdayMinutes}
          subjects={subjects}
          weakSubjectIds={plan.weakSubjects}
          onStartStudying={onStartSession}
        />
        <ContinueLearningCard lang={lang} subjects={subjects} onContinue={onStartSession} />
        <AiRecommendationStrip
          lang={lang}
          subjects={subjects}
          streakDays={streakDays}
          onAction={onStartSession}
        />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sparkles size={24} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {strings.chatGreeting[lang]}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
              {strings.chatSubtitle[lang]}
            </p>
          </div>
        </div>
        {composer}
        <div className="flex w-full max-w-2xl flex-col items-center">
          <div className="flex flex-wrap justify-center gap-2">
            {allSubjects.slice(0, 5).map((s) => {
              const isSelected = selectedSubjectId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId((id) => (id === s.id ? null : s.id))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    isSelected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-foreground-muted hover:border-accent hover:text-foreground"
                  }`}
                >
                  {s.name[lang]}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {selectedSubject && (
              <SubjectWorkspace
                key={selectedSubject.id}
                lang={lang}
                subject={selectedSubject}
                onAskAi={() =>
                  setInput(
                    `${lang === "en" ? "Ask about" : "সম্পর্কে জিজ্ঞাসা করো"} ${selectedSubject.name[lang]}`
                  )
                }
                onPractice={() =>
                  setInput(
                    lang === "en"
                      ? `Give me practice questions on ${selectedSubject.name.en}`
                      : `${selectedSubject.name.bn} বিষয়ে অনুশীলন প্রশ্ন দাও`
                  )
                }
                onRevise={() =>
                  setInput(
                    lang === "en"
                      ? `Help me revise ${selectedSubject.name.en}`
                      : `${selectedSubject.name.bn} রিভিশন করতে সাহায্য করো`
                  )
                }
              />
            )}
          </AnimatePresence>
        </div>
        <RecentChatsSection lang={lang} onOpenChat={onOpenChat} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
        {messages.map((m, i) => (
          <Bubble key={i} message={m} lang={lang} />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-surface px-4 py-2.5">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="sticky bottom-16 border-t border-border bg-background p-3 sm:p-4 md:bottom-0">
        {composer}
      </div>
    </div>
  );
}
