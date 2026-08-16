"use client";

import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LifeBuoy,
  HelpCircle,
  Mail,
  Flag,
  MessageCircle,
  Send,
  Search,
  ChevronRight,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Star,
  CheckCircle2,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { strings, type Lang } from "@/lib/i18n";
import {
  helpArticles,
  faqEntries,
  helpCategories,
  systemServices,
  type HelpCategory,
  type FaqEntry,
  type ServiceStatusLevel,
} from "@/lib/help-data";

const EASE = [0.16, 1, 0.3, 1] as const;

const CATEGORY_LABEL_KEY: Record<HelpCategory, keyof typeof strings> = {
  gettingStarted: "helpCategoryGettingStarted",
  usingAi: "helpCategoryUsingAi",
  studyTools: "helpCategoryStudyTools",
  accountBilling: "helpCategoryAccountBilling",
};

type SupportCategory = "account" | "billing" | "technical" | "other";
const SUPPORT_CATEGORY_LABEL_KEY: Record<SupportCategory, keyof typeof strings> = {
  account: "helpSupportCategoryAccount",
  billing: "helpSupportCategoryBilling",
  technical: "helpSupportCategoryTechnical",
  other: "helpSupportCategoryOther",
};

type ProblemCategory = "bug" | "content" | "performance" | "other";
const PROBLEM_CATEGORY_LABEL_KEY: Record<ProblemCategory, keyof typeof strings> = {
  bug: "helpProblemCategoryBug",
  content: "helpProblemCategoryContent",
  performance: "helpProblemCategoryPerformance",
  other: "helpProblemCategoryOther",
};

type FeedbackType = "general" | "feature" | "bug" | "aiResponse" | "studyExperience";
const FEEDBACK_TYPE_LABEL_KEY: Record<FeedbackType, keyof typeof strings> = {
  general: "helpFeedbackTypeGeneral",
  feature: "helpFeedbackTypeFeature",
  bug: "helpFeedbackTypeBug",
  aiResponse: "helpFeedbackTypeAiResponse",
  studyExperience: "helpFeedbackTypeStudyExperience",
};

const MIN_FEEDBACK_MESSAGE_LENGTH = 10;

type AttachmentKind = "pdf" | "doc" | "image" | "txt";
const ATTACHMENT_ICON: Record<AttachmentKind, LucideIcon> = {
  pdf: FileText,
  doc: FileText,
  txt: FileText,
  image: ImageIcon,
};

function detectAttachmentKind(file: File): AttachmentKind | null {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".doc") || name.endsWith(".docx")) return "doc";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

function pillClass(active: boolean): string {
  return `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
    active ? "border-accent bg-accent-soft text-accent" : "border-border text-foreground-muted hover:border-accent hover:text-foreground"
  }`;
}

function fieldClass(hasError?: boolean): string {
  return `w-full rounded-lg border ${
    hasError ? "border-danger" : "border-border"
  } bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint`;
}

function FieldError({ show, message, id }: { show?: boolean; message: string; id?: string }) {
  if (!show) return null;
  return (
    <p id={id} role="alert" className="text-xs text-danger">
      {message}
    </p>
  );
}

function SuccessView({
  title,
  desc,
  doneLabel,
  onDone,
}: {
  title: string;
  desc: string;
  doneLabel: string;
  onDone: () => void;
}) {
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

function FaqItem({
  entry,
  lang,
  isOpen,
  onToggle,
}: {
  entry: FaqEntry;
  lang: Lang;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium transition-colors duration-150 hover:text-foreground-strong"
      >
        {entry.question[lang]}
        <motion.span
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="shrink-0 text-foreground-muted"
        >
          <ChevronRight size={15} strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-3 text-sm text-foreground-muted">{entry.answer[lang]}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const STATUS_LABEL_KEY: Record<ServiceStatusLevel, keyof typeof strings> = {
  operational: "helpStatusOperational",
  limited: "helpStatusLimited",
  maintenance: "helpStatusMaintenance",
};

const STATUS_DOT_CLASS: Record<ServiceStatusLevel, string> = {
  operational: "bg-success",
  limited: "bg-warning",
  maintenance: "bg-danger",
};

const STATUS_BADGE_CLASS: Record<ServiceStatusLevel, string> = {
  operational: "bg-success/15 text-success",
  limited: "bg-warning/15 text-warning",
  maintenance: "bg-danger/15 text-danger",
};

const contactCards: { id: "contact" | "report" | "feedback"; icon: LucideIcon; title: keyof typeof strings; desc: keyof typeof strings }[] = [
  { id: "contact", icon: Mail, title: "helpContactSupportTitle", desc: "helpContactSupportDesc" },
  { id: "report", icon: Flag, title: "helpReportProblemTitle", desc: "helpReportProblemDesc" },
  { id: "feedback", icon: MessageCircle, title: "helpGiveFeedbackTitle", desc: "helpGiveFeedbackDesc" },
];

export function HelpSupportView({ lang }: { lang: Lang }) {
  const idBase = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "all">("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"contact" | "report" | "feedback" | null>(null);

  const [contactForm, setContactForm] = useState({ subject: "", category: "" as SupportCategory | "", message: "" });
  const [contactErrors, setContactErrors] = useState<{ subject?: boolean; category?: boolean; message?: boolean }>({});
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const [reportForm, setReportForm] = useState({ category: "" as ProblemCategory | "", description: "" });
  const [reportAttachment, setReportAttachment] = useState<{ name: string; kind: AttachmentKind } | null>(null);
  const [reportErrors, setReportErrors] = useState<{ category?: boolean; description?: boolean }>({});
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const reportFileInputRef = useRef<HTMLInputElement>(null);

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | "">("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackAttachment, setFeedbackAttachment] = useState<{ name: string; kind: AttachmentKind } | null>(null);
  const [feedbackErrors, setFeedbackErrors] = useState<{ rating?: boolean; type?: boolean; message?: boolean }>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const feedbackFileInputRef = useRef<HTMLInputElement>(null);

  const filteredArticles = helpArticles.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      (query.trim() === "" || matchesQuery(a.title[lang], query) || matchesQuery(a.description[lang], query))
  );
  const filteredFaq = faqEntries.filter(
    (f) =>
      (category === "all" || f.category === category) &&
      (query.trim() === "" || matchesQuery(f.question[lang], query) || matchesQuery(f.answer[lang], query))
  );

  const openModal = (id: "contact" | "report" | "feedback") => {
    if (id === "contact") {
      setContactForm({ subject: "", category: "", message: "" });
      setContactErrors({});
      setContactSubmitted(false);
    }
    if (id === "report") {
      setReportForm({ category: "", description: "" });
      setReportAttachment(null);
      setReportErrors({});
      setReportSubmitted(false);
    }
    if (id === "feedback") {
      setFeedbackRating(0);
      setFeedbackType("");
      setFeedbackMessage("");
      setFeedbackAttachment(null);
      setFeedbackErrors({});
      setFeedbackSubmitting(false);
      setFeedbackSubmitted(false);
    }
    setActiveModal(id);
  };

  const submitContact = () => {
    const errors = {
      subject: contactForm.subject.trim() === "",
      category: contactForm.category === "",
      message: contactForm.message.trim() === "",
    };
    setContactErrors(errors);
    if (errors.subject || errors.category || errors.message) return;
    setContactSubmitted(true);
  };

  const handleReportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = detectAttachmentKind(file);
    if (!kind) return;
    setReportAttachment({ name: file.name, kind });
  };

  const submitReport = () => {
    const errors = { category: reportForm.category === "", description: reportForm.description.trim() === "" };
    setReportErrors(errors);
    if (errors.category || errors.description) return;
    setReportSubmitted(true);
  };

  const handleFeedbackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = detectAttachmentKind(file);
    if (!kind) return;
    setFeedbackAttachment({ name: file.name, kind });
  };

  const submitFeedback = () => {
    if (feedbackSubmitting) return;
    const errors = {
      rating: feedbackRating === 0,
      type: feedbackType === "",
      message: feedbackMessage.trim().length < MIN_FEEDBACK_MESSAGE_LENGTH,
    };
    setFeedbackErrors(errors);
    if (errors.rating || errors.type || errors.message) return;
    setFeedbackSubmitting(true);
    setTimeout(() => {
      setFeedbackSubmitting(false);
      setFeedbackSubmitted(true);
    }, 500);
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.helpPageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.helpPageSubtitle[lang]}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <LifeBuoy size={13} strokeWidth={1.75} />
            {strings.helpCenterTitle[lang]}
          </p>
          <p className="mb-4 text-xs text-foreground-muted">{strings.helpCenterDesc[lang]}</p>

          <div className="relative mb-3">
            <Search
              size={14}
              strokeWidth={1.75}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={strings.helpSearchPlaceholder[lang]}
              className="w-full rounded-lg border border-border bg-control py-2 pl-9 pr-3 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory("all")} className={pillClass(category === "all")}>
              {strings.helpCategoryAll[lang]}
            </button>
            {helpCategories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={pillClass(category === c)}>
                {strings[CATEGORY_LABEL_KEY[c]][lang]}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-1">
            {filteredArticles.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm font-medium">{strings.helpNoResultsTitle[lang]}</p>
                <p className="mt-1 text-xs text-foreground-muted">{strings.helpNoResultsDesc[lang]}</p>
              </div>
            ) : (
              filteredArticles.map((a) => (
                <div key={a.id} className="rounded-lg px-2.5 py-2.5 transition-colors duration-150 hover:bg-surface-muted">
                  <p className="text-sm font-medium">{a.title[lang]}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">{a.description[lang]}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <HelpCircle size={13} strokeWidth={1.75} />
            {strings.helpFaqTitle[lang]}
          </p>
          <p className="mb-2 text-xs text-foreground-muted">{strings.helpFaqDesc[lang]}</p>
          {filteredFaq.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm font-medium">{strings.helpNoResultsTitle[lang]}</p>
              <p className="mt-1 text-xs text-foreground-muted">{strings.helpNoResultsDesc[lang]}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredFaq.map((f) => (
                <FaqItem
                  key={f.id}
                  entry={f}
                  lang={lang}
                  isOpen={openFaqId === f.id}
                  onToggle={() => setOpenFaqId((id) => (id === f.id ? null : f.id))}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Activity size={13} strokeWidth={1.75} />
            {strings.helpSystemStatusTitle[lang]}
          </p>
          <p className="mb-3 text-xs text-foreground-muted">{strings.helpSystemStatusDesc[lang]}</p>
          <div className="flex flex-col">
            {systemServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0"
              >
                <span className="text-sm">{strings[service.labelKey][lang]}</span>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_CLASS[service.status]}`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[service.status]}`} />
                  {strings[STATUS_LABEL_KEY[service.status]][lang]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{strings.helpGetInTouchLabel[lang]}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {contactCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => openModal(card.id)}
                className="group flex w-full cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition-colors duration-200 hover:bg-surface-muted"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground transition-colors duration-200 group-hover:text-foreground-strong">
                  <card.icon size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{strings[card.title][lang]}</p>
                  <p className="mt-1 text-xs text-foreground-muted">{strings[card.desc][lang]}</p>
                </div>
                <span className="text-xs font-medium text-foreground-muted transition-colors duration-200 group-hover:text-foreground">
                  {strings.helpOpenBtn[lang]} →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal === "contact" && (
          <Modal title={strings.helpContactSupportTitle[lang]} onClose={() => setActiveModal(null)}>
            {contactSubmitted ? (
              <SuccessView
                title={strings.helpContactSuccessTitle[lang]}
                desc={strings.helpContactSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpSubjectLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <input
                    value={contactForm.subject}
                    onChange={(e) => setContactForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder={strings.helpSubjectPlaceholder[lang]}
                    required
                    aria-required="true"
                    aria-invalid={contactErrors.subject || undefined}
                    aria-describedby={contactErrors.subject ? `${idBase}-contact-subject-error` : undefined}
                    className={fieldClass(contactErrors.subject)}
                  />
                  <FieldError
                    show={contactErrors.subject}
                    message={strings.helpFieldRequiredError[lang]}
                    id={`${idBase}-contact-subject-error`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpSupportCategoryLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <select
                    value={contactForm.category}
                    onChange={(e) => setContactForm((f) => ({ ...f, category: e.target.value as SupportCategory }))}
                    required
                    aria-required="true"
                    aria-invalid={contactErrors.category || undefined}
                    aria-describedby={contactErrors.category ? `${idBase}-contact-category-error` : undefined}
                    className={fieldClass(contactErrors.category)}
                  >
                    <option value="">{strings.helpSelectCategoryPlaceholder[lang]}</option>
                    {(Object.keys(SUPPORT_CATEGORY_LABEL_KEY) as SupportCategory[]).map((c) => (
                      <option key={c} value={c} className="bg-control">
                        {strings[SUPPORT_CATEGORY_LABEL_KEY[c]][lang]}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    show={contactErrors.category}
                    message={strings.helpSelectCategoryError[lang]}
                    id={`${idBase}-contact-category-error`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpMessageLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                    rows={4}
                    placeholder={strings.helpFeedbackPlaceholder[lang]}
                    required
                    aria-required="true"
                    aria-invalid={contactErrors.message || undefined}
                    aria-describedby={contactErrors.message ? `${idBase}-contact-message-error` : undefined}
                    className={`resize-none ${fieldClass(contactErrors.message)}`}
                  />
                  <FieldError
                    show={contactErrors.message}
                    message={strings.helpFieldRequiredError[lang]}
                    id={`${idBase}-contact-message-error`}
                  />
                </label>
                <button
                  onClick={submitContact}
                  className="mt-1 flex items-center justify-center gap-1.5 self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                >
                  <Send size={13} strokeWidth={2} />
                  {strings.send[lang]}
                </button>
              </div>
            )}
          </Modal>
        )}

        {activeModal === "report" && (
          <Modal title={strings.helpReportProblemTitle[lang]} onClose={() => setActiveModal(null)}>
            {reportSubmitted ? (
              <SuccessView
                title={strings.helpReportSuccessTitle[lang]}
                desc={strings.helpReportSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpProblemCategoryLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm((f) => ({ ...f, category: e.target.value as ProblemCategory }))}
                    required
                    aria-required="true"
                    aria-invalid={reportErrors.category || undefined}
                    aria-describedby={reportErrors.category ? `${idBase}-report-category-error` : undefined}
                    className={fieldClass(reportErrors.category)}
                  >
                    <option value="">{strings.helpSelectCategoryPlaceholder[lang]}</option>
                    {(Object.keys(PROBLEM_CATEGORY_LABEL_KEY) as ProblemCategory[]).map((c) => (
                      <option key={c} value={c} className="bg-control">
                        {strings[PROBLEM_CATEGORY_LABEL_KEY[c]][lang]}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    show={reportErrors.category}
                    message={strings.helpSelectCategoryError[lang]}
                    id={`${idBase}-report-category-error`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpDescriptionLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <textarea
                    value={reportForm.description}
                    onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    placeholder={strings.helpDescriptionPlaceholder[lang]}
                    required
                    aria-required="true"
                    aria-invalid={reportErrors.description || undefined}
                    aria-describedby={reportErrors.description ? `${idBase}-report-description-error` : undefined}
                    className={`resize-none ${fieldClass(reportErrors.description)}`}
                  />
                  <FieldError
                    show={reportErrors.description}
                    message={strings.helpFieldRequiredError[lang]}
                    id={`${idBase}-report-description-error`}
                  />
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.helpAttachScreenshotLabel[lang]}</span>
                  <input
                    ref={reportFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    onChange={handleReportFileChange}
                    className="hidden"
                  />
                  {reportAttachment ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5">
                      {(() => {
                        const AttachmentIcon = ATTACHMENT_ICON[reportAttachment.kind];
                        return <AttachmentIcon size={14} strokeWidth={1.75} className="shrink-0 text-foreground-muted" />;
                      })()}
                      <span className="min-w-0 flex-1 truncate text-xs">{reportAttachment.name}</span>
                      <button
                        onClick={() => setReportAttachment(null)}
                        aria-label={strings.removeAttachmentLabel[lang]}
                        className="shrink-0 rounded-md p-1 text-foreground-muted transition-colors duration-150 hover:bg-surface hover:text-foreground"
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => reportFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      <Paperclip size={13} strokeWidth={1.75} />
                      {strings.attachFileLabel[lang]}
                    </button>
                  )}
                </div>
                <button
                  onClick={submitReport}
                  className="mt-1 flex items-center justify-center gap-1.5 self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                >
                  <Send size={13} strokeWidth={2} />
                  {strings.helpSubmitBtn[lang]}
                </button>
              </div>
            )}
          </Modal>
        )}

        {activeModal === "feedback" && (
          <Modal title={strings.helpGiveFeedbackTitle[lang]} onClose={() => setActiveModal(null)}>
            {feedbackSubmitted ? (
              <SuccessView
                title={strings.helpFeedbackSuccessTitle[lang]}
                desc={strings.helpFeedbackSuccessDesc[lang]}
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setActiveModal(null)}
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <span id={`${idBase}-rating-label`} className="text-xs font-medium text-foreground-muted">
                    {strings.helpRatingLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <div
                    role="radiogroup"
                    aria-labelledby={`${idBase}-rating-label`}
                    aria-describedby={feedbackErrors.rating ? `${idBase}-rating-error` : undefined}
                    className="flex items-center gap-1"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={n === feedbackRating}
                        onClick={() => setFeedbackRating(n)}
                        aria-label={`${n} star`}
                        className="p-0.5"
                      >
                        <Star
                          size={22}
                          strokeWidth={1.75}
                          className={n <= feedbackRating ? "fill-accent text-accent" : "fill-none text-foreground-faint"}
                        />
                      </button>
                    ))}
                  </div>
                  <FieldError show={feedbackErrors.rating} message={strings.helpRatingError[lang]} id={`${idBase}-rating-error`} />
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpFeedbackTypeLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                    required
                    aria-required="true"
                    aria-invalid={feedbackErrors.type || undefined}
                    aria-describedby={feedbackErrors.type ? `${idBase}-feedback-type-error` : undefined}
                    className={fieldClass(feedbackErrors.type)}
                  >
                    <option value="">{strings.helpSelectCategoryPlaceholder[lang]}</option>
                    {(Object.keys(FEEDBACK_TYPE_LABEL_KEY) as FeedbackType[]).map((t) => (
                      <option key={t} value={t} className="bg-control">
                        {strings[FEEDBACK_TYPE_LABEL_KEY[t]][lang]}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    show={feedbackErrors.type}
                    message={strings.helpSelectCategoryError[lang]}
                    id={`${idBase}-feedback-type-error`}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">
                    {strings.helpFeedbackMessageLabel[lang]} <span aria-hidden>*</span>
                  </span>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                    placeholder={strings.helpFeedbackMessagePlaceholder[lang]}
                    required
                    aria-required="true"
                    aria-invalid={feedbackErrors.message || undefined}
                    aria-describedby={feedbackErrors.message ? `${idBase}-feedback-message-error` : undefined}
                    className={`resize-none ${fieldClass(feedbackErrors.message)}`}
                  />
                  <FieldError
                    show={feedbackErrors.message}
                    message={strings.helpMessageTooShortError[lang]}
                    id={`${idBase}-feedback-message-error`}
                  />
                </label>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.helpAttachScreenshotLabel[lang]}</span>
                  <input
                    ref={feedbackFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,image/*"
                    onChange={handleFeedbackFileChange}
                    className="hidden"
                  />
                  {feedbackAttachment ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5">
                      {(() => {
                        const AttachmentIcon = ATTACHMENT_ICON[feedbackAttachment.kind];
                        return <AttachmentIcon size={14} strokeWidth={1.75} className="shrink-0 text-foreground-muted" />;
                      })()}
                      <span className="min-w-0 flex-1 truncate text-xs">{feedbackAttachment.name}</span>
                      <button
                        onClick={() => setFeedbackAttachment(null)}
                        aria-label={strings.removeAttachmentLabel[lang]}
                        className="shrink-0 rounded-md p-1 text-foreground-muted transition-colors duration-150 hover:bg-surface hover:text-foreground"
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => feedbackFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      <Paperclip size={13} strokeWidth={1.75} />
                      {strings.attachFileLabel[lang]}
                    </button>
                  )}
                </div>
                <div className="mt-1 flex justify-end gap-2">
                  <button
                    onClick={() => setActiveModal(null)}
                    disabled={feedbackSubmitting}
                    className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground disabled:opacity-40"
                  >
                    {strings.cancelBtn[lang]}
                  </button>
                  <button
                    onClick={submitFeedback}
                    disabled={feedbackSubmitting}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
                  >
                    <Send size={13} strokeWidth={2} />
                    {feedbackSubmitting ? strings.helpSubmittingBtn[lang] : strings.helpSubmitFeedbackBtn[lang]}
                  </button>
                </div>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
