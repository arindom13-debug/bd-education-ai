"use client";

import { useState } from "react";
import { Check, CreditCard, Receipt, RefreshCw, XCircle, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ToastStack, type ToastItem } from "@/components/toast";
import { strings, type Lang } from "@/lib/i18n";
import { billingPlans, type BillingPlanId } from "@/lib/account-data";

const CURRENT_PLAN_ID: BillingPlanId = "free";

function PlanCard({ lang, planId }: { lang: Lang; planId: BillingPlanId }) {
  const plan = billingPlans.find((p) => p.id === planId)!;
  const isCurrent = planId === CURRENT_PLAN_ID;
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
      <ul className="flex flex-col gap-2">
        {plan.features.map((f) => (
          <li key={f[lang]} className="flex items-start gap-2 text-xs text-foreground-muted">
            <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-foreground" />
            {f[lang]}
          </li>
        ))}
      </ul>
      <button
        disabled={isCurrent}
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

function EmptyRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-2 text-sm text-foreground-muted">
      <Icon size={15} strokeWidth={1.75} />
      {label}
    </div>
  );
}

export function BillingView({ lang }: { lang: Lang }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (title: string, description: string, icon: LucideIcon) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, description, icon }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.billingPageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.billingPageSubtitle[lang]}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingCurrentPlanLabel[lang]}
          </p>
          <div className="max-w-xs">
            <PlanCard lang={lang} planId={CURRENT_PLAN_ID} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingAvailablePlansLabel[lang]}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {billingPlans.map((plan) => (
              <PlanCard key={plan.id} lang={lang} planId={plan.id} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingPaymentMethodsLabel[lang]}
          </p>
          <EmptyState
            icon={CreditCard}
            title={strings.billingNoPaymentMethod[lang]}
            description={strings.billingNoPaymentMethodDesc[lang]}
            ctaLabel={strings.billingAddPaymentMethodBtn[lang]}
            onCtaClick={() => pushToast(strings.comingSoonToastTitle[lang], strings.comingSoonToastDesc[lang], CreditCard)}
          />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingHistoryLabel[lang]}
          </p>
          <EmptyRow icon={Receipt} label={strings.billingNoHistory[lang]} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.billingInvoicesLabel[lang]}
          </p>
          <EmptyRow icon={Receipt} label={strings.billingNoInvoices[lang]} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-b-0">
            <div className="min-w-0">
              <p className="text-sm font-medium">{strings.billingManageSubscriptionLabel[lang]}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{strings.billingManageSubscriptionDesc[lang]}</p>
            </div>
            <button
              onClick={() => pushToast(strings.comingSoonToastTitle[lang], strings.comingSoonToastDesc[lang], RefreshCw)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <RefreshCw size={12} strokeWidth={1.75} />
              {strings.billingManageSubscriptionBtn[lang]}
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{strings.billingCancelSubscriptionLabel[lang]}</p>
              <p className="mt-0.5 text-xs text-foreground-muted">{strings.billingCancelSubscriptionDesc[lang]}</p>
            </div>
            <button
              onClick={() =>
                pushToast(strings.billingCancelSubscriptionLabel[lang], strings.billingCancelSubscriptionDesc[lang], XCircle)
              }
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
            >
              <XCircle size={12} strokeWidth={1.75} />
              {strings.billingCancelSubscriptionBtn[lang]}
            </button>
          </div>
        </div>
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
