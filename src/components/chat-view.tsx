"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { subjects as allSubjects, type Subject } from "@/lib/curriculum-data";
import { classLevelOptions, type StudyPlan } from "@/lib/study-plan";
import { getDemoReplyText, type ChatLanguage } from "@/lib/chat-language";
import type { ChatMessage, ChatThread, MessageAttachment, MessageAttachmentKind } from "@/lib/chat-data";
import { TypingDots } from "@/components/typing-dots";
import { RecentChatsSection } from "@/components/recent-chats-section";
import { SubjectWorkspace } from "@/components/subject-workspace";

const EASE = [0.16, 1, 0.3, 1] as const;

const ATTACHMENT_ICON: Record<MessageAttachmentKind, LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  txt: FileText,
  image: ImageIcon,
};

function detectAttachmentKind(file: File): MessageAttachmentKind | null {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "doc";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

const MOCK_TRANSCRIPTIONS: { en: string; bn: string }[] = [
  { en: "Can you explain this topic again?", bn: "এই বিষয়টা আবার বুঝিয়ে দাও।" },
  { en: "What's the formula for this?", bn: "এর সূত্রটা কী?" },
  { en: "Give me a practice question on this.", bn: "এই বিষয়ে একটা অনুশীলন প্রশ্ন দাও।" },
];

function getMockTranscription(lang: Lang): string {
  const pick = MOCK_TRANSCRIPTIONS[Math.floor(Math.random() * MOCK_TRANSCRIPTIONS.length)];
  return pick[lang];
}

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MIN_RECORDING_SECONDS = 1;
const AI_ERROR_RATE = 1 / 14;

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
          {message.attachment && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-accent-foreground/10 px-2.5 py-1.5">
              {(() => {
                const AttachmentIcon = ATTACHMENT_ICON[message.attachment.kind];
                return <AttachmentIcon size={14} strokeWidth={1.75} className="shrink-0" />;
              })()}
              <span className="min-w-0 flex-1 truncate text-xs">{message.attachment.name}</span>
            </div>
          )}
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
  onOpenChat,
}: {
  lang: Lang;
  activeChat: ChatThread | null;
  plan: StudyPlan;
  subjects: Subject[];
  chatLanguage: ChatLanguage;
  onOpenChat: (id: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(activeChat?.messages ?? []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [aiError, setAiError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const classLabel = classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang] ?? "";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, aiError]);

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);

  const attemptReply = () => {
    setAiError(false);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (Math.random() < AI_ERROR_RATE) {
        setAiError(true);
        return;
      }
      const reply = getDemoReplyText(chatLanguage);
      setMessages((prev) => [...prev, { role: "ai", text: { en: reply, bn: reply } }]);
    }, 700);
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !attachment) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: { en: trimmed, bn: trimmed }, attachment: attachment ?? undefined },
    ]);
    setInput("");
    setAttachment(null);
    attemptReply();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = detectAttachmentKind(file);
    setUploadError(false);
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      if (!kind || file.size > MAX_ATTACHMENT_BYTES) {
        setUploadError(true);
        return;
      }
      setAttachment({ name: file.name, kind });
    }, 500);
  };

  const startRecording = () => {
    setVoiceError(false);
    setRecordingSeconds(0);
    setRecording(true);
  };

  const stopRecording = () => {
    setRecording(false);
    if (recordingSeconds < MIN_RECORDING_SECONDS) {
      setVoiceError(true);
      return;
    }
    setTranscribing(true);
    setTimeout(() => {
      const transcribed = getMockTranscription(lang);
      setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcribed}` : transcribed));
      setTranscribing(false);
    }, 600);
  };

  const composer = (
    <motion.div
      layoutId="chat-composer"
      transition={{ duration: 0.4, ease: EASE }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-border bg-surface p-2.5 shadow-md transition-colors duration-150 focus-within:border-foreground-faint"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {attachment && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5">
          {(() => {
            const AttachmentIcon = ATTACHMENT_ICON[attachment.kind];
            return <AttachmentIcon size={14} strokeWidth={1.75} className="shrink-0 text-foreground-muted" />;
          })()}
          <span className="min-w-0 flex-1 truncate text-xs">{attachment.name}</span>
          <button
            onClick={() => setAttachment(null)}
            aria-label={strings.removeAttachmentLabel[lang]}
            className="shrink-0 rounded-md p-1 text-foreground-muted transition-colors duration-150 hover:bg-surface hover:text-foreground"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}
      {recording ? (
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="flex items-center gap-1.5 text-sm tabular-nums">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-danger" />
            {formatRecordingTime(recordingSeconds)}
          </span>
          <span className="flex-1 truncate text-xs text-foreground-muted">{strings.voiceRecordingLabel[lang]}</span>
          <button
            onClick={stopRecording}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-danger px-3 py-1.5 text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
          >
            <Square size={11} strokeWidth={2} fill="currentColor" />
            {strings.voiceStopBtn[lang]}
          </button>
        </div>
      ) : transcribing ? (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-foreground-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-foreground-faint" />
          {strings.voiceTranscribingLabel[lang]}
        </div>
      ) : voiceError ? (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-danger">
          {strings.voiceInputFailedLabel[lang]}
          <button
            onClick={startRecording}
            className="ml-auto shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
          >
            {strings.retryBtn[lang]}
          </button>
        </div>
      ) : uploading ? (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-foreground-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-foreground-faint" />
          {strings.voiceUploadingLabel[lang]}
        </div>
      ) : uploadError ? (
        <div className="flex items-center gap-2 px-2 py-2 text-xs text-danger">
          {strings.uploadFailedLabel[lang]}
          <button
            onClick={() => {
              setUploadError(false);
              fileInputRef.current?.click();
            }}
            className="ml-auto shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
          >
            {strings.retryBtn[lang]}
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label={strings.attachFileLabel[lang]}
            className="flex shrink-0 items-center justify-center rounded-full p-2 text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
          >
            <Paperclip size={17} strokeWidth={1.75} />
          </button>
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
            className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-foreground-faint"
          />
          <button
            onClick={startRecording}
            aria-label={strings.voiceInputLabel[lang]}
            className="flex shrink-0 items-center justify-center rounded-full p-2 text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
          >
            <Mic size={17} strokeWidth={1.75} />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim() && !attachment}
            aria-label={strings.send[lang]}
            className="flex shrink-0 items-center justify-center rounded-full bg-accent p-2 text-accent-foreground disabled:opacity-40"
          >
            <ArrowUp size={18} strokeWidth={2} />
          </button>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        {messages.length === 0 ? (
          <motion.div
            key="landing"
            exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE } }}
            className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {strings.academicAssistantLabel[lang]}
                {classLabel && <span aria-hidden>·</span>}
                {classLabel}
                <span aria-hidden>·</span>
                {strings.bangladeshCurriculumLabel[lang]}
              </p>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong sm:text-3xl">
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
          </motion.div>
        ) : (
          <motion.div key="active" className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: EASE, delay: 0.05 }}
              className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6"
            >
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
              {aiError && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl border border-border bg-surface px-4 py-2.5 sm:max-w-[70%]">
                    <p className="text-sm text-danger">{strings.aiUnavailableLabel[lang]}</p>
                    <button
                      onClick={attemptReply}
                      className="mt-1.5 text-xs font-medium text-danger underline underline-offset-2 hover:opacity-80"
                    >
                      {strings.retryBtn[lang]}
                    </button>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </motion.div>
            <div className="sticky bottom-16 border-t border-border bg-background p-3 sm:p-4 md:bottom-0">
              {composer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
