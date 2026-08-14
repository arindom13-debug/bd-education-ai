"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  HelpCircle,
  Mail,
  Flag,
  MessageCircle,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/modal";
import { ToastStack, type ToastItem } from "@/components/toast";
import { strings, type Lang } from "@/lib/i18n";

type HelpCardId = "center" | "faq" | "contact" | "report" | "feedback";

const cards: { id: HelpCardId; icon: LucideIcon; title: keyof typeof strings; desc: keyof typeof strings }[] = [
  { id: "center", icon: LifeBuoy, title: "helpCenterTitle", desc: "helpCenterDesc" },
  { id: "faq", icon: HelpCircle, title: "helpFaqTitle", desc: "helpFaqDesc" },
  { id: "contact", icon: Mail, title: "helpContactSupportTitle", desc: "helpContactSupportDesc" },
  { id: "report", icon: Flag, title: "helpReportProblemTitle", desc: "helpReportProblemDesc" },
  { id: "feedback", icon: MessageCircle, title: "helpGiveFeedbackTitle", desc: "helpGiveFeedbackDesc" },
];

const guideItems: (keyof typeof strings)[] = [
  "chatGreeting",
  "studyPlan",
  "scheduleTitle",
  "toolsTitle",
  "learningProfile",
];

function MessageForm({ lang, onSubmit }: { lang: Lang; onSubmit: () => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder={strings.helpFeedbackPlaceholder[lang]}
        className="w-full resize-none rounded-lg border border-border bg-control px-3 py-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
      />
      <button
        disabled={!value.trim()}
        onClick={() => {
          onSubmit();
          setValue("");
        }}
        className="flex items-center justify-center gap-1.5 self-end rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
      >
        <Send size={13} strokeWidth={2} />
        {strings.helpSubmitBtn[lang]}
      </button>
    </div>
  );
}

export function HelpSupportView({ lang }: { lang: Lang }) {
  const [openCard, setOpenCard] = useState<HelpCardId | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (title: string, description: string, icon: LucideIcon) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const active = cards.find((c) => c.id === openCard);
  const faqPairs: [keyof typeof strings, keyof typeof strings][] = [
    ["helpFaq1Q", "helpFaq1A"],
    ["helpFaq2Q", "helpFaq2A"],
    ["helpFaq3Q", "helpFaq3A"],
    ["helpFaq4Q", "helpFaq4A"],
  ];

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.helpPageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.helpPageSubtitle[lang]}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => setOpenCard(card.id)}
              className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors duration-200 hover:bg-surface-muted"
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
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <Modal title={strings[active.title][lang]} onClose={() => setOpenCard(null)}>
            {active.id === "center" && (
              <ul className="flex flex-col gap-2.5">
                {guideItems.map((key) => (
                  <li key={key} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                    {strings[key][lang]}
                  </li>
                ))}
              </ul>
            )}
            {active.id === "faq" && (
              <div className="flex flex-col gap-4">
                {faqPairs.map(([q, a]) => (
                  <div key={q}>
                    <p className="text-sm font-medium">{strings[q][lang]}</p>
                    <p className="mt-1 text-sm text-foreground-muted">{strings[a][lang]}</p>
                  </div>
                ))}
              </div>
            )}
            {(active.id === "contact" || active.id === "report" || active.id === "feedback") && (
              <MessageForm
                lang={lang}
                onSubmit={() => {
                  pushToast(strings.feedbackSentToastTitle[lang], strings.feedbackSentToastDesc[lang], Send);
                  setOpenCard(null);
                }}
              />
            )}
          </Modal>
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} />
    </div>
  );
}
