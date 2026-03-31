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
    id: "tier-member", name: "Member", nameZh: "会员", color: "gray",
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
    id: "tier-gold", name: "Gold", nameZh: "金卡", color: "amber",
    sortOrder: 2, requirements: { minSpend: 500, minVisits: 15 },
    discountPercent: 8, pointsMultiplier: 1.5,
    perks: ["Priority seating", "Birthday reward", "8% on all orders"],
  },
  {
    id: "tier-platinum", name: "Platinum", nameZh: "铂金", color: "violet",
    sortOrder: 3, requirements: { minSpend: 1500, minVisits: 30 },
    discountPercent: 12, pointsMultiplier: 2.0,
    perks: ["Priority seating", "Free delivery", "Birthday double points", "12% on all orders"],
  },
  {
    id: "tier-diamond", name: "Diamond", nameZh: "钻石", color: "cyan",
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

/** Tier color mapping for Tailwind classes */
export const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  gray:   { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-300" },
  slate:  { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300" },
  amber:  { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300" },
  violet: { bg: "bg-violet-100 dark:bg-violet-900", text: "text-violet-700 dark:text-violet-400", border: "border-violet-300" },
  cyan:   { bg: "bg-cyan-100 dark:bg-cyan-900", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-300" },
  rose:   { bg: "bg-rose-100 dark:bg-rose-900", text: "text-rose-700 dark:text-rose-400", border: "border-rose-300" },
  emerald:{ bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-300" },
  blue:   { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-400", border: "border-blue-300" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-400", border: "border-orange-300" },
};
