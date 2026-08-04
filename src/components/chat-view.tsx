"use client";

import { useEffect, useRef, useState } from "react";
import { strings, type Lang } from "@/lib/i18n";
import { subjects } from "@/lib/curriculum-data";
import type { ChatMessage, ChatThread } from "@/lib/chat-data";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
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
    <div className="mx-auto flex w-full max-w-2xl items-end gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm">
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
        className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
      >
        {strings.send[lang]}
      </button>
    </div>
  );

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {strings.chatGreeting[lang]}
        </h1>
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
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
          {messages.map((m, i) => (
            <Bubble key={i} message={m} lang={lang} />
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground-muted">
                …
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border p-3 sm:p-4">{composer}</div>
    </div>
  );
}
