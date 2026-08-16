"use client";

import { useState } from "react";
import { Copy, Check, Share2, Users, UserCheck, Gift, Award } from "lucide-react";
import { AnimatedProgressBar } from "@/components/animated-progress-bar";
import { strings, type Lang } from "@/lib/i18n";
import { referralMilestones, mockReferralStats, getReferralCode, getReferralLink } from "@/lib/referral-data";

export function InviteFriendsView({ lang, studentName }: { lang: Lang; studentName: string }) {
  const referralCode = getReferralCode(studentName);
  const referralLink = getReferralLink(referralCode);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const copyText = async (text: string, onCopied: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyError(false);
      onCopied();
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 2400);
    }
  };

  const copyCode = () => {
    copyText(referralCode, () => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    });
  };

  const copyLink = () => {
    copyText(referralLink, () => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    });
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: strings.inviteShareTitle[lang],
          text: strings.inviteShareText[lang],
          url: `https://${referralLink}`,
        });
      } catch {
        // user dismissed the native share sheet — no fallback needed
      }
      return;
    }
    copyLink();
  };

  const { invited, accepted } = mockReferralStats;
  const earnedMilestones = referralMilestones.filter((m) => m.count <= accepted);
  const currentReward = earnedMilestones[earnedMilestones.length - 1] ?? null;
  const nextMilestone = referralMilestones.find((m) => m.count > accepted) ?? null;
  const progressToNext = nextMilestone ? Math.min(100, (accepted / nextMilestone.count) * 100) : 100;

  return (
    <div className="p-5 sm:p-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground-strong">{strings.invitePageTitle[lang]}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{strings.invitePageSubtitle[lang]}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {strings.inviteReferralCodeLabel[lang]}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-border bg-surface-muted px-3 py-2 font-mono text-sm tracking-wide">
                  {referralCode}
                </span>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                >
                  {copiedCode ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
                  {copiedCode ? strings.inviteCopiedLabel[lang] : strings.inviteCopyCodeBtn[lang]}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {strings.inviteReferralLinkLabel[lang]}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground-muted">
                  {referralLink}
                </span>
                <button
                  onClick={copyLink}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground-muted transition-colors duration-150 hover:text-foreground"
                >
                  {copiedLink ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.75} />}
                  {copiedLink ? strings.inviteCopiedLabel[lang] : strings.inviteCopyLinkBtn[lang]}
                </button>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Share2 size={14} strokeWidth={1.75} />
              {strings.inviteShareBtn[lang]}
            </button>
            {copyError && <p className="text-xs text-danger">{strings.inviteCopyFailedLabel[lang]}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {strings.inviteStatusTitle[lang]}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-surface-muted px-3 py-2.5">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                <Users size={11} strokeWidth={1.75} />
                {strings.inviteFriendsInvitedLabel[lang]}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{invited}</p>
            </div>
            <div className="rounded-lg bg-surface-muted px-3 py-2.5">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                <UserCheck size={11} strokeWidth={1.75} />
                {strings.inviteInvitationsAcceptedLabel[lang]}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{accepted}</p>
            </div>
            <div className="rounded-lg bg-surface-muted px-3 py-2.5">
              <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                <Gift size={11} strokeWidth={1.75} />
                {strings.inviteRewardsEarnedLabel[lang]}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{earnedMilestones.length}</p>
            </div>
          </div>

          {nextMilestone && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>{strings.inviteProgressToNextLabel[lang]}</span>
                <span className="tabular-nums">
                  {accepted} / {nextMilestone.count}
                </span>
              </div>
              <div className="mt-1.5">
                <AnimatedProgressBar value={progressToNext} height="h-1.5" />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            <Award size={13} strokeWidth={1.75} />
            {strings.inviteRewardsTitle[lang]}
          </p>
          {currentReward ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                  {strings.inviteRewardEarnedLabel[lang]}
                </p>
                <p className="mt-0.5 text-sm font-medium">{currentReward.reward[lang]}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                  {strings.inviteMilestoneLabel[lang]}
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {currentReward.count} {strings.inviteMilestoneReferralsSuffix[lang]}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                  {strings.inviteNextMilestoneLabel[lang]}
                </p>
                <p className="mt-0.5 text-sm font-medium">
                  {nextMilestone ? nextMilestone.reward[lang] : strings.inviteAllMilestonesReachedLabel[lang]}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">{strings.inviteNoRewardYetTitle[lang]}</p>
              <p className="mt-1 text-xs text-foreground-muted">{strings.inviteNoRewardYetDesc[lang]}</p>
              {nextMilestone && (
                <p className="mt-3 text-xs text-foreground-muted">
                  {strings.inviteNextMilestoneLabel[lang]}: {nextMilestone.reward[lang]} ({nextMilestone.count}{" "}
                  {strings.inviteMilestoneReferralsSuffix[lang]})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
