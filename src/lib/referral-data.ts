export type ReferralMilestone = {
  count: number;
  reward: { en: string; bn: string };
};

/** Ordered by count ascending — the reward unlocked once that many accepted
 * invitations are reached. */
export const referralMilestones: ReferralMilestone[] = [
  { count: 1, reward: { en: "50 bonus AI messages", bn: "৫০টি বোনাস এআই বার্তা" } },
  { count: 3, reward: { en: "1 week of Premium", bn: "১ সপ্তাহের প্রিমিয়াম" } },
  { count: 5, reward: { en: "1 month of Premium", bn: "১ মাসের প্রিমিয়াম" } },
  { count: 10, reward: { en: "3 months of Premium", bn: "৩ মাসের প্রিমিয়াম" } },
];

/** Mock referral activity — local/mock state only, not tied to any real
 * account or backend. */
export const mockReferralStats = {
  invited: 6,
  accepted: 4,
};

function buildReferralCode(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return `${base || "STUDY"}-2026`;
}

export function getReferralCode(studentName: string): string {
  return buildReferralCode(studentName);
}

export function getReferralLink(code: string): string {
  return `arindomsai.app/invite/${code}`;
}
