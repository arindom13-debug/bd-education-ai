"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  MoreHorizontal,
  Archive,
  Eraser,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { strings, type Lang } from "@/lib/i18n";
import { subjects as allSubjects, type Subject } from "@/lib/curriculum-data";
import { classLevelOptions, type StudyPlan } from "@/lib/study-plan";
import { getDemoReplyText, type ChatLanguage } from "@/lib/chat-language";
import {
  onboardingThread,
  type ChatMessage,
  type ChatThread,
  type MessageAttachment,
  type MessageAttachmentKind,
  type MessageFeedback,
} from "@/lib/chat-data";
import { TypingDots } from "@/components/typing-dots";
import { RecentChatsSection } from "@/components/recent-chats-section";
import { SubjectWorkspace } from "@/components/subject-workspace";
import { Modal } from "@/components/modal";

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
const SEND_ERROR_RATE = 1 / 16;

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  iconClassName,
  hoverClassName,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  iconClassName?: string;
  hoverClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-md p-1 text-foreground-muted transition-colors duration-150 hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40 ${
        hoverClassName ?? "hover:text-foreground"
      }`}
    >
      <Icon size={13} strokeWidth={1.75} className={iconClassName} />
    </button>
  );
}

function SuccessBlock({ title, desc, doneLabel, onDone }: { title: string; desc: string; doneLabel: string; onDone: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckCircle2 size={24} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs text-foreground-muted">{desc}</p>
      </div>
      <button onClick={onDone} className="mt-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        {doneLabel}
      </button>
    </div>
  );
}

const Bubble = memo(function Bubble({
  index,
  message,
  lang,
  isRegenerating,
  isCopied,
  disabled,
  onCopy,
  onRegenerate,
  onEditRetry,
  onFeedback,
  onEdit,
  onDelete,
}: {
  index: number;
  message: ChatMessage;
  lang: Lang;
  isRegenerating: boolean;
  isCopied: boolean;
  disabled: boolean;
  onCopy: (index: number, text: string) => void;
  onRegenerate: (index: number) => void;
  onEditRetry: (index: number) => void;
  onFeedback: (index: number, value: MessageFeedback) => void;
  onEdit: (index: number, text: string) => void;
  onDelete: (index: number) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] sm:max-w-[70%] ${isUser ? "" : "w-full"}`}>
        <div
          role={isRegenerating ? "status" : undefined}
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed wrap-break-word ${
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
          {isRegenerating ? (
            <>
              <span className="sr-only">{strings.chatRegenerateLabel[lang]}…</span>
              <TypingDots />
            </>
          ) : (
            message.text[lang]
          )}
        </div>
        {!isUser && !isRegenerating && (
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
        {!isRegenerating && (
          <div className={`mt-0.5 flex items-center gap-0.5 px-0.5 ${isUser ? "justify-end" : "justify-start"}`}>
            {isUser ? (
              <>
                <ActionButton
                  icon={Pencil}
                  label={strings.chatEditMessageLabel[lang]}
                  onClick={() => onEdit(index, message.text[lang])}
                  disabled={disabled}
                />
                <ActionButton
                  icon={isCopied ? Check : Copy}
                  label={isCopied ? strings.chatCopiedLabel[lang] : strings.chatCopyLabel[lang]}
                  onClick={() => onCopy(index, message.text[lang])}
                />
                <ActionButton
                  icon={Trash2}
                  label={strings.chatDeleteMessageLabel[lang]}
                  onClick={() => onDelete(index)}
                  hoverClassName="hover:text-danger"
                />
              </>
            ) : (
              <>
                <ActionButton
                  icon={isCopied ? Check : Copy}
                  label={isCopied ? strings.chatCopiedLabel[lang] : strings.chatCopyLabel[lang]}
                  onClick={() => onCopy(index, message.text[lang])}
                />
                <ActionButton
                  icon={RefreshCw}
                  label={strings.chatRegenerateLabel[lang]}
                  onClick={() => onRegenerate(index)}
                  disabled={disabled}
                />
                <ActionButton
                  icon={Pencil}
                  label={strings.chatEditPromptLabel[lang]}
                  onClick={() => onEditRetry(index)}
                  disabled={disabled}
                />
                <ActionButton
                  icon={ThumbsUp}
                  label={strings.chatHelpfulLabel[lang]}
                  onClick={() => onFeedback(index, "helpful")}
                  iconClassName={message.feedback === "helpful" ? "fill-accent/25 text-accent" : ""}
                  hoverClassName={message.feedback === "helpful" ? "text-accent" : "hover:text-foreground"}
                />
                <ActionButton
                  icon={ThumbsDown}
                  label={strings.chatNotHelpfulLabel[lang]}
                  onClick={() => onFeedback(index, "unhelpful")}
                  iconClassName={message.feedback === "unhelpful" ? "fill-danger/25 text-danger" : ""}
                  hoverClassName={message.feedback === "unhelpful" ? "text-danger" : "hover:text-foreground"}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export function ChatView({
  lang,
  activeChat,
  chatThreads,
  plan,
  subjects,
  chatLanguage,
  onOpenChat,
  onRenameChat,
  onArchiveChat,
  onDeleteChat,
  onClearChatMessages,
}: {
  lang: Lang;
  activeChat: ChatThread | null;
  chatThreads: ChatThread[];
  plan: StudyPlan;
  subjects: Subject[];
  chatLanguage: ChatLanguage;
  onOpenChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onArchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onClearChatMessages: (id: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(activeChat?.messages ?? []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [chatMenuModal, setChatMenuModal] = useState<"rename" | "archive" | "delete" | "clear" | null>(null);
  const [renameText, setRenameText] = useState("");
  // Archiving/deleting the active chat makes app-shell hand control back to a
  // new chat, which remounts this whole component (see the `key` on its
  // wrapper in app-shell.tsx). So the real action is deferred until the
  // success view is acknowledged — otherwise it would vanish before the user
  // ever saw it.
  const [chatActionDone, setChatActionDone] = useState<"archive" | "delete" | "clear" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const chatMenuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ?? null;
  const classLabel = classLevelOptions.find((o) => o.value === plan.classLevel)?.label[lang] ?? "";
  const isManageable = activeChat !== null && activeChat.id !== onboardingThread.id;

  // Deliberately keyed on isTyping/aiError, not `messages` itself — sending a
  // message or an AI reply arriving always flips isTyping, so those still
  // scroll. In-place edits that replace an existing message (regenerate,
  // helpful/not-helpful, delete) do NOT touch isTyping, so they no longer
  // yank the viewport to the bottom while someone's reviewing older messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isTyping, aiError]);

  useEffect(() => {
    if (!recording) return;
    const interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [recording]);

  useEffect(() => {
    if (!chatMenuOpen) return;
    chatMenuItemRefs.current[0]?.focus();
    function handleClick(e: MouseEvent) {
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target as Node)) {
        setChatMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setChatMenuOpen(false);
        chatMenuTriggerRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = chatMenuItemRefs.current.filter(Boolean) as HTMLButtonElement[];
        if (items.length === 0) return;
        const currentIndex = items.findIndex((el) => el === document.activeElement);
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + dir + items.length) % items.length;
        items[nextIndex]?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [chatMenuOpen]);

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
    setSendError(false);
    setSending(true);
    setTimeout(() => {
      setSending(false);
      // Nothing is appended and input/attachment are left exactly as typed,
      // so clicking Retry just re-runs this same attempt — no duplicate
      // message can result from a failed send.
      if (Math.random() < SEND_ERROR_RATE) {
        setSendError(true);
        return;
      }
      if (editingIndex !== null) {
        const idx = editingIndex;
        setMessages((prev) => [
          ...prev.slice(0, idx),
          { role: "user", text: { en: trimmed, bn: trimmed }, attachment: attachment ?? undefined },
        ]);
        setEditingIndex(null);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "user", text: { en: trimmed, bn: trimmed }, attachment: attachment ?? undefined },
        ]);
      }
      setInput("");
      setAttachment(null);
      attemptReply();
    }, 300);
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

  // Stabilized with useCallback (and Bubble wrapped in React.memo below) so
  // that typing in the composer — which re-renders ChatView on every
  // keystroke — doesn't force every message bubble in the conversation to
  // re-render too. Only bubbles whose own data actually changed do.
  const copyMessage = useCallback(async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 1800);
    } catch {
      // clipboard unavailable — best effort, no visible confirmation
    }
  }, []);

  const setFeedback = useCallback((index: number, value: MessageFeedback) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, feedback: m.feedback === value ? undefined : value } : m))
    );
  }, []);

  const regenerateMessage = useCallback(
    (index: number) => {
      setRegeneratingIndex(index);
      setTimeout(() => {
        const reply = getDemoReplyText(chatLanguage);
        setMessages((prev) => prev.map((m, i) => (i === index ? { role: "ai", text: { en: reply, bn: reply } } : m)));
        setRegeneratingIndex(null);
      }, 700);
    },
    [chatLanguage]
  );

  const startEdit = useCallback((index: number, text: string) => {
    setEditingIndex(index);
    setInput(text);
  }, []);

  const cancelEdit = () => {
    setEditingIndex(null);
    setInput("");
  };

  const editRetryFromAi = useCallback(
    (aiIndex: number) => {
      for (let i = aiIndex - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          startEdit(i, messages[i].text[lang]);
          return;
        }
      }
    },
    [messages, lang, startEdit]
  );

  const requestDeleteMessage = useCallback((index: number) => setDeleteConfirmIndex(index), []);

  // Used only by the failed-AI-reply block below, which has no message index
  // of its own to attach Copy/Edit-prompt actions to — both look backward
  // for the most recent user message, i.e. the prompt that just failed.
  const editLastPrompt = () => editRetryFromAi(messages.length);
  const copyLastPrompt = async () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        try {
          await navigator.clipboard.writeText(messages[i].text[lang]);
          setPromptCopied(true);
          setTimeout(() => setPromptCopied(false), 1800);
        } catch {
          // clipboard unavailable — best effort, no visible confirmation
        }
        return;
      }
    }
  };

  const confirmDeleteMessage = () => {
    if (deleteConfirmIndex === null) return;
    setMessages((prev) => prev.filter((_, i) => i !== deleteConfirmIndex));
    setDeleteConfirmIndex(null);
  };

  const openChatMenuModal = (modal: "rename" | "archive" | "delete" | "clear") => {
    setChatMenuOpen(false);
    if (modal === "rename" && activeChat) setRenameText(activeChat.title[lang]);
    setChatActionDone(null);
    setChatMenuModal(modal);
  };

  const saveRename = () => {
    if (!activeChat || !renameText.trim()) return;
    onRenameChat(activeChat.id, renameText.trim());
    setChatMenuModal(null);
  };

  // These three only reveal the success view — the real, state-changing
  // action runs in finishChatAction once it's acknowledged.
  const confirmArchiveChat = () => setChatActionDone("archive");
  const confirmDeleteChat = () => setChatActionDone("delete");
  const confirmClearChat = () => setChatActionDone("clear");

  const finishChatAction = () => {
    if (activeChat) {
      if (chatActionDone === "archive") onArchiveChat(activeChat.id);
      else if (chatActionDone === "delete") onDeleteChat(activeChat.id);
      else if (chatActionDone === "clear") {
        onClearChatMessages(activeChat.id);
        setMessages([]);
      }
    }
    setChatMenuModal(null);
    setChatActionDone(null);
  };

  // Used as the archive/delete/clear modals' onClose (Escape, backdrop, X) —
  // if the success view is already showing, closing must still apply the
  // action instead of silently discarding it.
  const closeChatActionModal = () => {
    if (chatActionDone) {
      finishChatAction();
      return;
    }
    setChatMenuModal(null);
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
      {editingIndex !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-accent-soft px-2.5 py-1.5 text-xs text-accent">
          <Pencil size={12} strokeWidth={1.75} className="shrink-0" />
          <span className="flex-1">{strings.chatEditingLabel[lang]}</span>
          <button
            onClick={cancelEdit}
            aria-label={strings.chatCancelEditLabel[lang]}
            className="shrink-0 rounded-md p-1 transition-colors duration-150 hover:bg-accent/15"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}
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
        <div role="status" className="flex items-center gap-2 px-1 py-1.5">
          <span className="flex items-center gap-1.5 text-sm tabular-nums">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-danger" aria-hidden />
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
        <div role="status" className="flex items-center gap-2 px-2 py-2 text-xs text-foreground-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-foreground-faint" aria-hidden />
          {strings.voiceTranscribingLabel[lang]}
        </div>
      ) : voiceError ? (
        <div role="alert" className="flex items-center gap-2 px-2 py-2 text-xs text-danger">
          {strings.voiceInputFailedLabel[lang]}
          <button
            onClick={startRecording}
            className="ml-auto shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
          >
            {strings.retryBtn[lang]}
          </button>
          <button
            onClick={() => setVoiceError(false)}
            aria-label={strings.dismissErrorLabel[lang]}
            className="shrink-0 rounded-md p-1 hover:bg-danger/10"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ) : uploading ? (
        <div role="status" className="flex items-center gap-2 px-2 py-2 text-xs text-foreground-muted">
          <span className="size-1.5 animate-pulse rounded-full bg-foreground-faint" aria-hidden />
          {strings.voiceUploadingLabel[lang]}
        </div>
      ) : uploadError ? (
        <div role="alert" className="flex items-center gap-2 px-2 py-2 text-xs text-danger">
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
          <button
            onClick={() => setUploadError(false)}
            aria-label={strings.dismissErrorLabel[lang]}
            className="shrink-0 rounded-md p-1 hover:bg-danger/10"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ) : sendError ? (
        <div role="alert" className="flex items-center gap-2 px-2 py-2 text-xs text-danger">
          {strings.messageSendFailedLabel[lang]}
          <button
            onClick={handleSend}
            className="ml-auto shrink-0 font-medium underline underline-offset-2 hover:opacity-80"
          >
            {strings.retryBtn[lang]}
          </button>
          <button
            onClick={() => setSendError(false)}
            aria-label={strings.dismissErrorLabel[lang]}
            className="shrink-0 rounded-md p-1 hover:bg-danger/10"
          >
            <X size={12} strokeWidth={2} />
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
            disabled={sending || isTyping || (!input.trim() && !attachment)}
            aria-label={strings.send[lang]}
            className="flex shrink-0 items-center justify-center rounded-full bg-accent p-2 text-accent-foreground disabled:opacity-40"
          >
            {sending ? (
              <span className="flex size-4.5 items-center justify-center">
                <span className="size-1.5 animate-pulse rounded-full bg-accent-foreground" />
              </span>
            ) : (
              <ArrowUp size={18} strokeWidth={2} />
            )}
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
            <RecentChatsSection lang={lang} threads={chatThreads} onOpenChat={onOpenChat} />
          </motion.div>
        ) : (
          <motion.div key="active" className="flex flex-col">
            {isManageable && (
              <div className="sticky top-0 z-10 flex justify-end border-b border-border bg-background px-4 py-2 sm:px-6">
                <div ref={chatMenuRef} className="relative">
                  <button
                    ref={chatMenuTriggerRef}
                    onClick={() => setChatMenuOpen((o) => !o)}
                    aria-label={strings.chatMenuLabel[lang]}
                    aria-haspopup="menu"
                    aria-expanded={chatMenuOpen}
                    className="rounded-md p-1.5 text-foreground-muted transition-colors duration-150 hover:bg-surface-muted hover:text-foreground"
                  >
                    <MoreHorizontal size={16} strokeWidth={1.75} />
                  </button>
                  <AnimatePresence>
                    {chatMenuOpen && (
                      <motion.div
                        role="menu"
                        aria-label={strings.chatMenuLabel[lang]}
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: EASE }}
                        className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-border bg-surface p-1 shadow-lg"
                      >
                        <button
                          ref={(el) => {
                            chatMenuItemRefs.current[0] = el;
                          }}
                          role="menuitem"
                          onClick={() => openChatMenuModal("rename")}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-surface-muted"
                        >
                          <Pencil size={13} strokeWidth={1.75} />
                          {strings.chatMenuRename[lang]}
                        </button>
                        <button
                          ref={(el) => {
                            chatMenuItemRefs.current[1] = el;
                          }}
                          role="menuitem"
                          onClick={() => openChatMenuModal("archive")}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-surface-muted"
                        >
                          <Archive size={13} strokeWidth={1.75} />
                          {strings.chatMenuArchive[lang]}
                        </button>
                        <button
                          ref={(el) => {
                            chatMenuItemRefs.current[2] = el;
                          }}
                          role="menuitem"
                          onClick={() => openChatMenuModal("clear")}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-surface-muted"
                        >
                          <Eraser size={13} strokeWidth={1.75} />
                          {strings.chatMenuClear[lang]}
                        </button>
                        <button
                          ref={(el) => {
                            chatMenuItemRefs.current[3] = el;
                          }}
                          role="menuitem"
                          onClick={() => openChatMenuModal("delete")}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-danger transition-colors duration-150 hover:bg-danger/10"
                        >
                          <Trash2 size={13} strokeWidth={1.75} />
                          {strings.chatMenuDelete[lang]}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: EASE, delay: 0.05 }}
              className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6"
            >
              {messages.map((m, i) => (
                <Bubble
                  key={i}
                  index={i}
                  message={m}
                  lang={lang}
                  isRegenerating={regeneratingIndex === i}
                  isCopied={copiedIndex === i}
                  disabled={isTyping || sending}
                  onCopy={copyMessage}
                  onRegenerate={regenerateMessage}
                  onEditRetry={editRetryFromAi}
                  onFeedback={setFeedback}
                  onEdit={startEdit}
                  onDelete={requestDeleteMessage}
                />
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div role="status" className="rounded-2xl border border-border bg-surface px-4 py-2.5">
                    <span className="sr-only">{strings.aiGeneratingLabel[lang]}</span>
                    <TypingDots />
                  </div>
                </div>
              )}
              {aiError && (
                <div className="flex justify-start">
                  <div role="alert" className="max-w-[85%] rounded-2xl border border-border bg-surface px-4 py-2.5 sm:max-w-[70%]">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-danger">{strings.aiUnavailableLabel[lang]}</p>
                      <button
                        onClick={() => setAiError(false)}
                        aria-label={strings.dismissErrorLabel[lang]}
                        className="shrink-0 rounded-md p-0.5 text-foreground-muted transition-colors duration-150 hover:text-foreground"
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <button
                        onClick={attemptReply}
                        className="text-xs font-medium text-danger underline underline-offset-2 hover:opacity-80"
                      >
                        {strings.retryBtn[lang]}
                      </button>
                      <button
                        onClick={copyLastPrompt}
                        className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                      >
                        {promptCopied ? <Check size={12} strokeWidth={2} /> : <Copy size={12} strokeWidth={1.75} />}
                        {promptCopied ? strings.chatCopiedLabel[lang] : strings.chatCopyPromptLabel[lang]}
                      </button>
                      <button
                        onClick={editLastPrompt}
                        className="flex items-center gap-1 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                      >
                        <Pencil size={12} strokeWidth={1.75} />
                        {strings.chatEditPromptLabel[lang]}
                      </button>
                    </div>
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

      <AnimatePresence>
        {chatMenuModal === "rename" && (
          <Modal title={strings.chatRenameModalTitle[lang]} onClose={() => setChatMenuModal(null)}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground-muted">{strings.chatRenameInputLabel[lang]}</span>
              <input
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                className="w-full rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setChatMenuModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.cancelBtn[lang]}
              </button>
              <button
                onClick={saveRename}
                disabled={!renameText.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
              >
                {strings.saveBtn[lang]}
              </button>
            </div>
          </Modal>
        )}

        {chatMenuModal === "archive" && (
          <Modal title={strings.chatArchiveConfirmTitle[lang]} onClose={closeChatActionModal}>
            {chatActionDone === "archive" ? (
              <SuccessBlock
                title={strings.chatArchiveSuccessTitle[lang]}
                desc={strings.chatArchiveSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={finishChatAction}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.chatArchiveConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setChatMenuModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button onClick={confirmArchiveChat} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white">
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {chatMenuModal === "delete" && (
          <Modal title={strings.chatDeleteChatConfirmTitle[lang]} onClose={closeChatActionModal}>
            {chatActionDone === "delete" ? (
              <SuccessBlock
                title={strings.chatDeleteSuccessTitle[lang]}
                desc={strings.chatDeleteSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={finishChatAction}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.chatDeleteChatConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setChatMenuModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button onClick={confirmDeleteChat} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white">
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {chatMenuModal === "clear" && (
          <Modal title={strings.chatClearConfirmTitle[lang]} onClose={closeChatActionModal}>
            {chatActionDone === "clear" ? (
              <SuccessBlock
                title={strings.chatClearSuccessTitle[lang]}
                desc={strings.chatClearSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={finishChatAction}
              />
            ) : (
              <>
                <p className="text-sm text-foreground-muted">{strings.chatClearConfirmDesc[lang]}</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setChatMenuModal(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button onClick={confirmClearChat} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white">
                    {strings.confirmBtn[lang]}
                  </button>
                </div>
              </>
            )}
          </Modal>
        )}

        {deleteConfirmIndex !== null && (
          <Modal title={strings.chatDeleteMessageConfirmTitle[lang]} onClose={() => setDeleteConfirmIndex(null)}>
            <p className="text-sm text-foreground-muted">{strings.chatDeleteMessageConfirmDesc[lang]}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmIndex(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.cancelBtn[lang]}
              </button>
              <button onClick={confirmDeleteMessage} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white">
                {strings.confirmBtn[lang]}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
