export type BillingPlanId = "free" | "premium";

export type BillingPlan = {
  id: BillingPlanId;
  name: { en: string; bn: string };
  price: { en: string; bn: string };
  period: { en: string; bn: string };
  billingCycle: { en: string; bn: string };
  aiUsageLimit: { en: string; bn: string };
  attachmentLimit: { en: string; bn: string };
  voiceInputLimit: { en: string; bn: string };
  features: { en: string; bn: string }[];
};

export const billingPlans: BillingPlan[] = [
  {
    id: "free",
    name: { en: "Free", bn: "ফ্রি" },
    price: { en: "৳0", bn: "৳০" },
    period: { en: "/month", bn: "/মাস" },
    billingCycle: { en: "Free forever", bn: "চিরকাল ফ্রি" },
    aiUsageLimit: { en: "100 AI messages / month", bn: "মাসে ১০০টি এআই বার্তা" },
    attachmentLimit: { en: "10 files / month", bn: "মাসে ১০টি ফাইল" },
    voiceInputLimit: { en: "20 minutes / month", bn: "মাসে ২০ মিনিট" },
    features: [
      { en: "10 study plan generations / month", bn: "মাসে ১০টি পড়ার পরিকল্পনা তৈরি" },
      { en: "Core study tools", bn: "মূল পড়ার টুলস" },
    ],
  },
  {
    id: "premium",
    name: { en: "Premium", bn: "প্রিমিয়াম" },
    price: { en: "৳499", bn: "৳৪৯৯" },
    period: { en: "/month", bn: "/মাস" },
    billingCycle: { en: "Billed monthly", bn: "মাসিক বিল হয়" },
    aiUsageLimit: { en: "Unlimited AI messages", bn: "সীমাহীন এআই বার্তা" },
    attachmentLimit: { en: "Unlimited attachments", bn: "সীমাহীন সংযুক্তি" },
    voiceInputLimit: { en: "Unlimited voice input", bn: "সীমাহীন ভয়েস ইনপুট" },
    features: [
      { en: "Unlimited study plan generations", bn: "সীমাহীন পড়ার পরিকল্পনা তৈরি" },
      { en: "Priority AI response speed", bn: "অগ্রাধিকারভিত্তিক এআই সাড়া" },
      { en: "All study tools + AI Roadmap", bn: "সব পড়ার টুলস + এআই রোডম্যাপ" },
    ],
  },
];

export type InvoiceStatus = "paid" | "failed" | "refunded";

export type Invoice = {
  id: string;
  date: { en: string; bn: string };
  amount: { en: string; bn: string };
  plan: { en: string; bn: string };
  status: InvoiceStatus;
};

export const mockInvoices: Invoice[] = [
  {
    id: "INV-2026-0803",
    date: { en: "August 1, 2026", bn: "১ আগস্ট, ২০২৬" },
    amount: { en: "৳499", bn: "৳৪৯৯" },
    plan: { en: "Premium", bn: "প্রিমিয়াম" },
    status: "paid",
  },
  {
    id: "INV-2026-0702",
    date: { en: "July 1, 2026", bn: "১ জুলাই, ২০২৬" },
    amount: { en: "৳499", bn: "৳৪৯৯" },
    plan: { en: "Premium", bn: "প্রিমিয়াম" },
    status: "paid",
  },
  {
    id: "INV-2026-0601",
    date: { en: "June 1, 2026", bn: "১ জুন, ২০২৬" },
    amount: { en: "৳499", bn: "৳৪৯৯" },
    plan: { en: "Premium", bn: "প্রিমিয়াম" },
    status: "paid",
  },
];
