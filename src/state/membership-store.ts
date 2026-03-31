import { useSyncExternalStore } from "react";

export interface TierRequirements {
  minSpend?: number;
  minVisits?: number;
  minPoints?: number;
}

export interface MemberTier {
  id: string;
  name: string;
  nameZh?: string;
  color: string;        // tailwind color key: "amber", "gray", "yellow", "purple", "cyan"
  sortOrder: number;
  requirements: TierRequirements;
  discountPercent: number;
  perks: string[];
  pointsMultiplier: number;
}

type Listener = () => void;

let tiers: MemberTier[] = [
  {
    id: "tier-member", name: "Member", nameZh: "会员", color: "stone",
    sortOrder: 0, requirements: {}, discountPercent: 0, pointsMultiplier: 1.0,
    perks: ["Welcome drink on first visit"],
  },
  {
    id: "tier-silver", name: "Silver", nameZh: "银卡", color: "slate",
    sortOrder: 1, requirements: { minSpend: 200, minVisits: 5 },
    discountPercent: 5, pointsMultiplier: 1.2,
    perks: ["Birthday reward", "5% on all orders"],
  },
  {
    id: "tier-gold", name: "Gold", nameZh: "金卡", color: "sand",
    sortOrder: 2, requirements: { minSpend: 500, minVisits: 15 },
    discountPercent: 8, pointsMultiplier: 1.5,
    perks: ["Priority seating", "Birthday reward", "8% on all orders"],
  },
  {
    id: "tier-platinum", name: "Platinum", nameZh: "铂金", color: "lavender",
    sortOrder: 3, requirements: { minSpend: 1500, minVisits: 30 },
    discountPercent: 12, pointsMultiplier: 2.0,
    perks: ["Priority seating", "Free delivery", "Birthday double points", "12% on all orders"],
  },
  {
    id: "tier-diamond", name: "Diamond", nameZh: "钻石", color: "sky",
    sortOrder: 4, requirements: { minSpend: 3000, minVisits: 50 },
    discountPercent: 15, pointsMultiplier: 3.0,
    perks: ["All Platinum perks", "Exclusive events", "Complimentary dessert", "15% on all orders"],
  },
];

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useMemberTiers = () => useSyncExternalStore(subscribe, () => tiers, () => tiers);
export const getMemberTiersSnapshot = () => tiers;

export const addTier = (tier: Omit<MemberTier, "id" | "sortOrder">) => {
  const id = `tier-${Date.now()}`;
  const sortOrder = tiers.length;
  tiers = [...tiers, { ...tier, id, sortOrder }];
  emit();
};

export const updateTier = (id: string, updates: Partial<Omit<MemberTier, "id">>) => {
  tiers = tiers.map(t => t.id === id ? { ...t, ...updates } : t);
  emit();
};

export const deleteTier = (id: string) => {
  if (tiers.length <= 1) return; // must have at least 1 tier
  tiers = tiers.filter(t => t.id !== id).map((t, i) => ({ ...t, sortOrder: i }));
  emit();
};

export const moveTierUp = (id: string) => {
  const idx = tiers.findIndex(t => t.id === id);
  if (idx <= 0) return;
  const arr = [...tiers];
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
  tiers = arr.map((t, i) => ({ ...t, sortOrder: i }));
  emit();
};

export const moveTierDown = (id: string) => {
  const idx = tiers.findIndex(t => t.id === id);
  if (idx < 0 || idx >= tiers.length - 1) return;
  const arr = [...tiers];
  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
  tiers = arr.map((t, i) => ({ ...t, sortOrder: i }));
  emit();
};

/** Get the tier object for a given tier ID */
export const getTierById = (tierId: string): MemberTier | undefined => tiers.find(t => t.id === tierId);

/** Get the tier for a customer based on their stats. Returns highest qualifying tier. */
export const calculateTier = (totalSpend: number, visits: number, points: number): MemberTier => {
  // Walk from highest to lowest, return first match
  const sorted = [...tiers].sort((a, b) => b.sortOrder - a.sortOrder);
  for (const tier of sorted) {
    const r = tier.requirements;
    const meetsSpend = !r.minSpend || totalSpend >= r.minSpend;
    const meetsVisits = !r.minVisits || visits >= r.minVisits;
    const meetsPoints = !r.minPoints || points >= r.minPoints;
    // OR logic: meet ANY requirement to qualify (if set)
    const hasRequirements = r.minSpend || r.minVisits || r.minPoints;
    if (!hasRequirements) continue; // base tier — fallback
    if (meetsSpend || meetsVisits || meetsPoints) return tier;
  }
  return tiers[0]; // base tier
};

/** Get discount percent for a tier ID */
export const getTierDiscount = (tierId: string): number => {
  const tier = getTierById(tierId);
  return tier?.discountPercent ?? 0;
};

/** Japanese-inspired low-saturation tier color palette */
export const TIER_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  stone:   { bg: "bg-stone-50 dark:bg-stone-900/40",       text: "text-stone-500 dark:text-stone-400",           border: "border-stone-200 dark:border-stone-700",       dot: "bg-stone-400" },
  slate:   { bg: "bg-slate-50 dark:bg-slate-900/40",       text: "text-slate-500 dark:text-slate-400",           border: "border-slate-200 dark:border-slate-700",       dot: "bg-slate-400" },
  sand:    { bg: "bg-amber-50/60 dark:bg-amber-950/20",    text: "text-amber-600/80 dark:text-amber-400/80",     border: "border-amber-200/60 dark:border-amber-800/40", dot: "bg-amber-400/80" },
  sage:    { bg: "bg-emerald-50/50 dark:bg-emerald-950/20",text: "text-emerald-600/70 dark:text-emerald-400/70", border: "border-emerald-200/50 dark:border-emerald-800/30", dot: "bg-emerald-400/70" },
  lavender:{ bg: "bg-violet-50/50 dark:bg-violet-950/20",  text: "text-violet-500/70 dark:text-violet-400/70",   border: "border-violet-200/50 dark:border-violet-800/30",dot: "bg-violet-400/70" },
  blush:   { bg: "bg-rose-50/40 dark:bg-rose-950/15",      text: "text-rose-500/60 dark:text-rose-400/60",       border: "border-rose-200/40 dark:border-rose-800/25",   dot: "bg-rose-400/60" },
  sky:     { bg: "bg-sky-50/50 dark:bg-sky-950/20",        text: "text-sky-600/70 dark:text-sky-400/70",         border: "border-sky-200/50 dark:border-sky-800/30",     dot: "bg-sky-400/70" },
  warm:    { bg: "bg-orange-50/40 dark:bg-orange-950/15",  text: "text-orange-500/70 dark:text-orange-400/60",   border: "border-orange-200/40 dark:border-orange-800/25",dot: "bg-orange-400/60" },
  ink:     { bg: "bg-zinc-100/60 dark:bg-zinc-800/40",     text: "text-zinc-600/80 dark:text-zinc-400/70",       border: "border-zinc-200/60 dark:border-zinc-700/40",   dot: "bg-zinc-500/70" },
};
