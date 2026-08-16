"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Check, CreditCard, Receipt, RefreshCw, XCircle, Trash2, AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";
import { Modal } from "@/components/modal";
import { EmptyState } from "@/components/empty-state";
import { ToastStack, type ToastItem } from "@/components/toast";
import { strings, type Lang } from "@/lib/i18n";
import { billingPlans, mockInvoices, type BillingPlan, type BillingPlanId, type Invoice, type InvoiceStatus } from "@/lib/billing-data";

type CardType = "Visa" | "Mastercard" | "Card";

type PaymentMethod = {
  id: string;
  cardholderName: string;
  last4: string;
  cardType: CardType;
  expiry: string;
  isDefault: boolean;
};

type ModalState =
  | { kind: "addPayment" }
  | { kind: "removePayment"; id: string }
  | { kind: "upgrade"; planId: BillingPlanId }
  | { kind: "changePlan" }
  | { kind: "cancel" }
  | { kind: "invoice"; invoice: Invoice }
  | null;

const BILLING_ACTION_ERROR_RATE = 1 / 10;

const INVOICE_STATUS_KEY: Record<InvoiceStatus, keyof typeof strings> = {
  paid: "billingInvoiceStatusPaid",
  failed: "billingInvoiceStatusFailed",
  refunded: "billingInvoiceStatusRefunded",
};

function detectCardType(cardNumber: string): CardType {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.startsWith("4")) return "Visa";
  if (digits.startsWith("5")) return "Mastercard";
  return "Card";
}

function formatCardNumberInput(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiryInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function SuccessBlock({
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

function PlanCard({
  lang,
  plan,
  isCurrent,
  onUpgrade,
}: {
  lang: Lang;
  plan: BillingPlan;
  isCurrent: boolean;
  onUpgrade: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-5 ${
        isCurrent ? "border-accent bg-accent-soft" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold tracking-tight">{plan.name[lang]}</p>
        {isCurrent && (
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
            {strings.billingCurrentPlanBadge[lang]}
          </span>
        )}
      </div>
      <p className="flex items-baseline gap-0.5">
        <span className="text-2xl font-semibold tracking-tight">{plan.price[lang]}</span>
        <span className="text-xs text-foreground-muted">{plan.period[lang]}</span>
      </p>
      <p className="text-xs text-foreground-muted">{plan.billingCycle[lang]}</p>

      <div className="flex flex-col gap-1.5 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-foreground-muted">{strings.billingAiUsageLimitLabel[lang]}</span>
          <span className="font-medium">{plan.aiUsageLimit[lang]}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-foreground-muted">{strings.billingAttachmentLimitLabel[lang]}</span>
          <span className="font-medium">{plan.attachmentLimit[lang]}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-foreground-muted">{strings.billingVoiceInputLimitLabel[lang]}</span>
          <span className="font-medium">{plan.voiceInputLimit[lang]}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2 border-t border-border pt-3">
        {plan.features.map((f) => (
          <li key={f[lang]} className="flex items-start gap-2 text-xs text-foreground-muted">
            <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-foreground" />
            {f[lang]}
          </li>
        ))}
      </ul>
      <button
        disabled={isCurrent}
        onClick={onUpgrade}
        className={`mt-1 rounded-lg px-4 py-2 text-xs font-medium transition-transform active:scale-95 disabled:cursor-default disabled:active:scale-100 ${
          isCurrent
            ? "border border-border bg-surface text-foreground-muted disabled:opacity-60"
            : "bg-accent text-accent-foreground hover:scale-[1.02]"
        }`}
      >
        {isCurrent ? strings.billingCurrentPlanBadge[lang] : strings.billingUpgradeBtn[lang]}
      </button>
    </div>
  );
}

export function BillingView({ lang }: { lang: Lang }) {
  const [currentPlanId, setCurrentPlanId] = useState<BillingPlanId>("free");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [form, setForm] = useState({ cardholderName: "", cardNumber: "", expiry: "", cvc: "" });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastIdRef = useRef(0);
  const paymentIdRef = useRef(0);
  const [changePlanSelection, setChangePlanSelection] = useState<BillingPlanId | null>(null);
  const [changePlanSuccess, setChangePlanSuccess] = useState(false);
  const [changePlanError, setChangePlanError] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState(false);

  const currentPlan = billingPlans.find((p) => p.id === currentPlanId)!;
  const upgradeTargetPlan = modal?.kind === "upgrade" ? billingPlans.find((p) => p.id === modal.planId)! : null;
  const upgradeConfirmDesc = upgradeTargetPlan
    ? lang === "en"
      ? `You'll be switched to the ${upgradeTargetPlan.name.en} plan (${upgradeTargetPlan.price.en}${upgradeTargetPlan.period.en}). This is a mock upgrade — no payment will be processed.`
      : `তুমি ${upgradeTargetPlan.name.bn} প্ল্যানে (${upgradeTargetPlan.price.bn}${upgradeTargetPlan.period.bn}) পরিবর্তিত হবে। এটি একটি মক আপগ্রেড — কোনো পেমেন্ট প্রক্রিয়া করা হবে না।`
    : "";

  const changePlanTarget = changePlanSelection ? billingPlans.find((p) => p.id === changePlanSelection)! : null;
  const showPlanComparison = changePlanTarget !== null && changePlanTarget.id !== currentPlanId;
  const isDowngrade = currentPlanId === "premium" && changePlanTarget?.id === "free";
  const comparisonRows = changePlanTarget
    ? [
        {
          label: strings.billingPriceLabel[lang],
          from: `${currentPlan.price[lang]}${currentPlan.period[lang]}`,
          to: `${changePlanTarget.price[lang]}${changePlanTarget.period[lang]}`,
        },
        { label: strings.billingCycleLabel[lang], from: currentPlan.billingCycle[lang], to: changePlanTarget.billingCycle[lang] },
        {
          label: strings.billingAiUsageLimitLabel[lang],
          from: currentPlan.aiUsageLimit[lang],
          to: changePlanTarget.aiUsageLimit[lang],
        },
        {
          label: strings.billingAttachmentLimitLabel[lang],
          from: currentPlan.attachmentLimit[lang],
          to: changePlanTarget.attachmentLimit[lang],
        },
        {
          label: strings.billingVoiceInputLimitLabel[lang],
          from: currentPlan.voiceInputLimit[lang],
          to: changePlanTarget.voiceInputLimit[lang],
        },
      ]
    : [];

  const pushToast = (title: string, description: string, icon: LucideIcon) => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prev) => [...prev, { id, title, description, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const notifyComingSoon = () => pushToast(strings.comingSoonToastTitle[lang], strings.comingSoonToastDesc[lang], RefreshCw);

  const openAddPayment = () => {
    setForm({ cardholderName: "", cardNumber: "", expiry: "", cvc: "" });
    setModal({ kind: "addPayment" });
  };

  const isAddPaymentValid =
    form.cardholderName.trim().length > 0 &&
    form.cardNumber.replace(/\D/g, "").length >= 12 &&
    /^\d{2}\/\d{2}$/.test(form.expiry) &&
    form.cvc.length >= 3;

  const submitAddPayment = () => {
    if (!isAddPaymentValid) return;
    const last4 = form.cardNumber.replace(/\D/g, "").slice(-4);
    const method: PaymentMethod = {
      id: `card-${paymentIdRef.current++}`,
      cardholderName: form.cardholderName.trim(),
      last4,
      cardType: detectCardType(form.cardNumber),
      expiry: form.expiry,
      isDefault: paymentMethods.length === 0,
    };
    setPaymentMethods((prev) => [...prev, method]);
    setModal(null);
    pushToast(strings.billingCardAddedToastTitle[lang], strings.billingCardAddedToastDesc[lang], CreditCard);
  };

  const removePayment = (id: string) => {
    setPaymentMethods((prev) => {
      const removed = prev.find((m) => m.id === id);
      const rest = prev.filter((m) => m.id !== id);
      if (removed?.isDefault && rest.length > 0) rest[0] = { ...rest[0], isDefault: true };
      return rest;
    });
    setModal(null);
    pushToast(strings.billingCardRemovedToastTitle[lang], "", Trash2);
  };

  const setDefaultPayment = (id: string) => {
    setPaymentMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    pushToast(strings.billingDefaultUpdatedToastTitle[lang], "", CreditCard);
  };

  const confirmUpgrade = (planId: BillingPlanId) => {
    const plan = billingPlans.find((p) => p.id === planId)!;
    setCurrentPlanId(plan.id);
    setModal(null);
    const desc =
      lang === "en" ? `You're now on the ${plan.name.en} plan (mock).` : `তুমি এখন ${plan.name.bn} প্ল্যানে আছ (মক)।`;
    pushToast(strings.billingUpgradeSuccessToastTitle[lang], desc, Check);
  };

  const openChangePlan = (preselect?: BillingPlanId) => {
    setChangePlanSelection(preselect ?? null);
    setChangePlanSuccess(false);
    setChangePlanError(false);
    setModal({ kind: "changePlan" });
  };

  const confirmChangePlan = () => {
    if (!changePlanTarget) return;
    setChangePlanError(false);
    // Mock failure — selection stays exactly as chosen, so Retry re-applies
    // the same target plan rather than needing to be picked again.
    if (Math.random() < BILLING_ACTION_ERROR_RATE) {
      setChangePlanError(true);
      return;
    }
    setCurrentPlanId(changePlanTarget.id);
    setChangePlanSuccess(true);
  };

  const openCancelModal = () => {
    setCancelSuccess(false);
    setCancelError(false);
    setModal({ kind: "cancel" });
  };

  const confirmCancel = () => {
    setCancelError(false);
    if (Math.random() < BILLING_ACTION_ERROR_RATE) {
      setCancelError(true);
      return;
    }
    setCurrentPlanId("free");
    setCancelSuccess(true);
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.billingPageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.billingPageSubtitle[lang]}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingCurrentPlanLabel[lang]}
          </p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold tracking-tight">{currentPlan.name[lang]}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className="size-1.5 shrink-0 rounded-full bg-success" />
                {strings.billingStatusActive[lang]}
              </p>
            </div>
            <p className="flex items-baseline gap-0.5">
              <span className="text-2xl font-semibold tracking-tight">{currentPlan.price[lang]}</span>
              <span className="text-xs text-foreground-muted">{currentPlan.period[lang]}</span>
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.billingCycleLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">{currentPlan.billingCycle[lang]}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.billingNextBillingDateLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {currentPlanId === "free"
                  ? strings.billingNotApplicable[lang]
                  : lang === "en"
                  ? "September 1, 2026"
                  : "১ সেপ্টেম্বর, ২০২৬"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.billingPriceLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {currentPlan.price[lang]}
                {currentPlan.period[lang]}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.billingAiUsageLimitLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">{currentPlan.aiUsageLimit[lang]}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.billingAttachmentLimitLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">{currentPlan.attachmentLimit[lang]}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                {strings.billingVoiceInputLimitLabel[lang]}
              </p>
              <p className="mt-0.5 text-sm font-medium">{currentPlan.voiceInputLimit[lang]}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <button
              onClick={() => openChangePlan()}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-transform hover:scale-[1.02] active:scale-95"
            >
              {strings.billingChangePlanBtn[lang]}
            </button>
            <button
              onClick={notifyComingSoon}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <RefreshCw size={12} strokeWidth={1.75} />
              {strings.billingManageSubscriptionBtn[lang]}
            </button>
            <button
              onClick={openCancelModal}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <XCircle size={12} strokeWidth={1.75} />
              {strings.billingCancelSubscriptionBtn[lang]}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Receipt size={13} strokeWidth={1.75} />
            {strings.billingHistoryLabel[lang]}
          </p>
          {mockInvoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={strings.billingNoHistory[lang]}
              description={strings.billingNoHistoryDesc[lang]}
              ctaLabel={strings.billingUpgradePlanBtn[lang]}
              onCtaClick={() => setModal({ kind: "upgrade", planId: "premium" })}
              compact
            />
          ) : (
            <div className="mt-2 flex flex-col">
              {mockInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-b-0 last:pb-1"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-muted">
                      <Receipt size={14} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {inv.plan[lang]} · {inv.amount[lang]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-foreground-muted">
                        {inv.date[lang]} · {strings[INVOICE_STATUS_KEY[inv.status]][lang]}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModal({ kind: "invoice", invoice: inv })}
                    className="shrink-0 text-xs font-medium text-accent transition-opacity duration-150 hover:opacity-75"
                  >
                    {strings.billingViewInvoiceBtn[lang]}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <CreditCard size={13} strokeWidth={1.75} />
            {strings.billingPaymentMethodsLabel[lang]}
          </p>
          {paymentMethods.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title={strings.billingNoPaymentMethod[lang]}
              description={strings.billingNoPaymentMethodDesc[lang]}
              ctaLabel={strings.billingAddPaymentMethodBtn[lang]}
              onCtaClick={openAddPayment}
            />
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {paymentMethods.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-muted">
                      <CreditCard size={16} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <span>•••• •••• •••• {m.last4}</span>
                        {m.isDefault && (
                          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                            {strings.billingDefaultBadge[lang]}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-foreground-muted">
                        {m.cardType} · {strings.billingExpiresLabel[lang]} {m.expiry}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {!m.isDefault && (
                      <button
                        onClick={() => setDefaultPayment(m.id)}
                        className="text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                      >
                        {strings.billingSetDefaultBtn[lang]}
                      </button>
                    )}
                    <button
                      onClick={() => setModal({ kind: "removePayment", id: m.id })}
                      className="text-xs font-medium text-danger transition-opacity duration-150 hover:opacity-75"
                    >
                      {strings.billingRemoveBtn[lang]}
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={openAddPayment}
                className="self-start rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.billingAddPaymentMethodBtn[lang]}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingAvailablePlansLabel[lang]}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {billingPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                lang={lang}
                plan={plan}
                isCurrent={plan.id === currentPlanId}
                onUpgrade={() => openChangePlan(plan.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal?.kind === "addPayment" && (
          <Modal title={strings.billingAddPaymentMethodModalTitle[lang]} onClose={() => setModal(null)}>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground-muted">{strings.billingCardholderNameLabel[lang]}</span>
                <input
                  value={form.cardholderName}
                  onChange={(e) => setForm((f) => ({ ...f, cardholderName: e.target.value }))}
                  placeholder={strings.billingCardholderNamePlaceholder[lang]}
                  className="rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-foreground-muted">{strings.billingCardNumberLabel[lang]}</span>
                <input
                  value={form.cardNumber}
                  onChange={(e) => setForm((f) => ({ ...f, cardNumber: formatCardNumberInput(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  className="rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.billingExpiryDateLabel[lang]}</span>
                  <input
                    value={form.expiry}
                    onChange={(e) => setForm((f) => ({ ...f, expiry: formatExpiryInput(e.target.value) }))}
                    placeholder="MM/YY"
                    inputMode="numeric"
                    className="rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-foreground-muted">{strings.billingCvcLabel[lang]}</span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={form.cvc}
                    onChange={(e) => setForm((f) => ({ ...f, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    placeholder="123"
                    inputMode="numeric"
                    className="rounded-lg border border-border bg-control px-3 py-2 text-sm outline-none transition-colors duration-150 placeholder:text-foreground-faint focus:border-foreground-faint"
                  />
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.cancelBtn[lang]}
              </button>
              <button
                onClick={submitAddPayment}
                disabled={!isAddPaymentValid}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
              >
                {strings.billingAddPaymentMethodConfirmBtn[lang]}
              </button>
            </div>
          </Modal>
        )}

        {modal?.kind === "removePayment" && (
          <Modal title={strings.billingRemoveCardConfirmTitle[lang]} onClose={() => setModal(null)}>
            <p className="text-sm text-foreground-muted">{strings.billingRemoveCardConfirmDesc[lang]}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.cancelBtn[lang]}
              </button>
              <button
                onClick={() => removePayment(modal.id)}
                className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white"
              >
                {strings.confirmBtn[lang]}
              </button>
            </div>
          </Modal>
        )}

        {modal?.kind === "upgrade" && upgradeTargetPlan && (
          <Modal title={strings.billingUpgradeConfirmTitle[lang]} onClose={() => setModal(null)}>
            <p className="text-sm text-foreground-muted">{upgradeConfirmDesc}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
              >
                {strings.cancelBtn[lang]}
              </button>
              <button
                onClick={() => confirmUpgrade(upgradeTargetPlan.id)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                {strings.confirmBtn[lang]}
              </button>
            </div>
          </Modal>
        )}

        {modal?.kind === "changePlan" && (
          <Modal title={strings.billingChangePlanModalTitle[lang]} onClose={() => setModal(null)}>
            {changePlanSuccess && changePlanTarget ? (
              <SuccessBlock
                title={strings.billingChangePlanSuccessTitle[lang]}
                desc={
                  lang === "en"
                    ? `You're now on the ${changePlanTarget.name.en} plan. This is a mock change — no payment was processed.`
                    : `তুমি এখন ${changePlanTarget.name.bn} প্ল্যানে আছ। এটি একটি মক পরিবর্তন — কোনো পেমেন্ট প্রক্রিয়া করা হয়নি।`
                }
                doneLabel={strings.doneBtn[lang]}
                onDone={() => setModal(null)}
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    {strings.billingChangePlanSelectLabel[lang]}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {billingPlans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setChangePlanSelection(p.id)}
                        className={`rounded-lg border p-3 text-left transition-colors duration-150 ${
                          changePlanSelection === p.id ? "border-accent bg-accent-soft" : "border-border hover:border-accent"
                        }`}
                      >
                        <p className="flex items-center justify-between gap-2 text-sm font-semibold">
                          {p.name[lang]}
                          {p.id === currentPlanId && (
                            <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted">
                              {strings.billingCurrentPlanBadge[lang]}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-muted">
                          {p.price[lang]}
                          {p.period[lang]}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {showPlanComparison && changePlanTarget && (
                  <>
                    <div className="rounded-lg border border-border p-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                        {strings.billingComparisonLabel[lang]}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {comparisonRows.map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                            <span className="shrink-0 text-foreground-muted">{row.label}</span>
                            <span className="text-right font-medium">
                              {row.from} <span className="text-foreground-faint">→</span> {row.to}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isDowngrade && (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-warning">
                          <AlertTriangle size={13} strokeWidth={1.75} />
                          {strings.billingDowngradeWarningTitle[lang]}
                        </p>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {currentPlan.features.map((f) => (
                            <li key={f[lang]} className="text-xs text-foreground-muted">
                              • {f[lang]}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {changePlanError && (
                      <div role="alert" className="rounded-lg bg-danger/10 p-3">
                        <p className="text-xs font-medium text-danger">{strings.billingActionFailedTitle[lang]}</p>
                        <p className="mt-0.5 text-xs text-foreground-muted">{strings.billingChangePlanFailedDesc[lang]}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModal(null)}
                        className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                      >
                        {strings.cancelBtn[lang]}
                      </button>
                      <button
                        onClick={confirmChangePlan}
                        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                      >
                        {strings.billingChangePlanConfirmBtn[lang]}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </Modal>
        )}

        {modal?.kind === "cancel" &&
          (currentPlanId === "free" ? (
            <Modal title={strings.billingCancelNothingTitle[lang]} onClose={() => setModal(null)}>
              <p className="text-sm text-foreground-muted">{strings.billingCancelSubscriptionDesc[lang]}</p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setModal(null)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
                >
                  {strings.doneBtn[lang]}
                </button>
              </div>
            </Modal>
          ) : (
            <Modal title={strings.billingCancelConfirmTitle[lang]} onClose={() => setModal(null)}>
              {cancelSuccess ? (
                <SuccessBlock
                  title={strings.billingCancelSuccessToastTitle[lang]}
                  desc={strings.billingCancelSuccessToastDesc[lang]}
                  doneLabel={strings.doneBtn[lang]}
                  onDone={() => setModal(null)}
                />
              ) : (
                <>
                  <p className="text-sm text-foreground-muted">{strings.billingCancelConfirmDesc[lang]}</p>
                  {cancelError && (
                    <div role="alert" className="mt-3 rounded-lg bg-danger/10 p-3">
                      <p className="text-xs font-medium text-danger">{strings.billingActionFailedTitle[lang]}</p>
                      <p className="mt-0.5 text-xs text-foreground-muted">{strings.billingCancelFailedDesc[lang]}</p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setModal(null)}
                      className="rounded-lg border border-border px-4 py-2 text-sm text-foreground-muted transition-colors duration-150 hover:text-foreground"
                    >
                      {strings.billingKeepSubscriptionBtn[lang]}
                    </button>
                    <button onClick={confirmCancel} className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white">
                      {strings.billingConfirmCancellationBtn[lang]}
                    </button>
                  </div>
                </>
              )}
            </Modal>
          ))}

        {modal?.kind === "invoice" && (
          <Modal title={`${strings.billingInvoiceModalTitle[lang]} · ${modal.invoice.id}`} onClose={() => setModal(null)}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span className="text-foreground-muted">{strings.billingInvoiceNumberLabel[lang]}</span>
                <span className="font-medium">{modal.invoice.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span className="text-foreground-muted">{strings.billingHistoryDateLabel[lang]}</span>
                <span className="font-medium">{modal.invoice.date[lang]}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span className="text-foreground-muted">{strings.billingHistoryPlanLabel[lang]}</span>
                <span className="font-medium">{modal.invoice.plan[lang]}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span className="text-foreground-muted">{strings.billingHistoryAmountLabel[lang]}</span>
                <span className="font-medium">{modal.invoice.amount[lang]}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-foreground-muted">{strings.billingStatusLabel[lang]}</span>
                <span className="font-medium">{strings[INVOICE_STATUS_KEY[modal.invoice.status]][lang]}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setModal(null)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
              >
                {strings.doneBtn[lang]}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ToastStack toasts={toasts} />
    </div>
  );
}
