"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { subjects } from "@/lib/curriculum-data";
import type { ChatMessage, ChatThread } from "@/lib/chat-data";
import { TypingDots } from "@/components/typing-dots";

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

export function ChatView({ lang, activeChat }: { lang: Lang; activeChat: ChatThread | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>(activeChat?.messages ?? []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: {
            en: "This is a demo reply. Real answers grounded in your textbooks are coming in a later step.",
            bn: "এটি একটি ডেমো উত্তর। তোমার পাঠ্যবইয়ের ভিত্তিতে প্রকৃত উত্তর পরবর্তী ধাপে আসবে।",
          },
        },
      ]);
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
        <div className="flex max-w-2xl flex-wrap justify-center gap-2">
          {subjects.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => setInput(`${lang === "en" ? "Ask about" : "সম্পর্কে জিজ্ঞাসা করো"} ${s.name[lang]}`)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted hover:border-accent hover:text-foreground"
            >
              {s.name[lang]}
            </button>
          ))}
        </div>
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
