import { useSyncExternalStore } from "react";

export type CustomerSegment = "new" | "regular" | "vip" | "at_risk" | "churned";

export interface CustomerFull {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  tags: string[];
  visits: number;
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  totalSpend: number;
  averageTicket: number;
  preferredItems: string[];
  notes?: string;
  lastVisit: string;
  createdAt: string;
  segment: CustomerSegment;
}

type Listener = () => void;

const classifySegment = (c: { visits: number; lastVisit: string; totalSpend: number }): CustomerSegment => {
  const daysSinceVisit = Math.floor((Date.now() - new Date(c.lastVisit).getTime()) / 86400000);
  if (c.visits <= 2) return "new";
  if (daysSinceVisit > 90) return "churned";
  if (daysSinceVisit > 45) return "at_risk";
  if (c.totalSpend > 500 || c.visits > 20) return "vip";
  return "regular";
};

const initialCustomers: CustomerFull[] = [
  { id: "c1", name: "Tan Wei Ming", phone: "+65 9123 4567", email: "weiming@email.com", dateOfBirth: "1985-06-15", tags: ["regular", "spicy-lover"], visits: 24, points: 1250, tier: "gold", totalSpend: 1680.50, averageTicket: 70.02, preferredItems: ["Laksa", "Chilli Crab"], notes: "Prefers table by window", lastVisit: "2026-03-28", createdAt: "2025-03-10", segment: "vip" },
  { id: "c2", name: "Sarah Lim", phone: "+65 8234 5678", tags: ["lunch-regular"], visits: 8, points: 420, tier: "silver", totalSpend: 380.00, averageTicket: 47.50, preferredItems: ["Chicken Rice", "Teh Tarik"], lastVisit: "2026-03-25", createdAt: "2025-09-20", segment: "regular" },
  { id: "c3", name: "Ahmad bin Hassan", phone: "+65 9345 6789", dateOfBirth: "1990-04-02", tags: ["halal"], visits: 3, points: 150, tier: "bronze", totalSpend: 95.00, averageTicket: 31.67, preferredItems: ["Nasi Lemak"], lastVisit: "2026-03-10", createdAt: "2026-02-01", segment: "new" },
  { id: "c4", name: "Priya Sharma", phone: "+65 8456 7890", email: "priya@email.com", dateOfBirth: "1978-12-25", tags: ["vip", "vegetarian-options"], visits: 45, points: 3200, tier: "platinum", totalSpend: 4250.80, averageTicket: 94.46, preferredItems: ["Curry Fish Head", "Kangkong"], notes: "Birthday coming up in Dec", lastVisit: "2026-03-29", createdAt: "2024-06-15", segment: "vip" },
  { id: "c5", name: "Jason Ng", phone: "+65 9876 5432", email: "jason.ng@corp.com", tags: ["corporate"], visits: 12, points: 680, tier: "silver", totalSpend: 720.00, averageTicket: 60.00, preferredItems: ["Bak Kut Teh", "Tiger Beer"], lastVisit: "2026-01-15", createdAt: "2025-05-10", segment: "at_risk" },
  { id: "c6", name: "Linda Koh", phone: "+65 8765 4321", tags: [], visits: 1, points: 50, tier: "bronze", totalSpend: 42.50, averageTicket: 42.50, preferredItems: [], lastVisit: "2025-11-20", createdAt: "2025-11-20", segment: "churned" },
];

let customersState = initialCustomers.map(c => ({ ...c, segment: classifySegment(c) }));
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useCustomers = () => useSyncExternalStore(subscribe, () => customersState, () => customersState);

export const updateCustomer = (id: string, updates: Partial<CustomerFull>) => {
  customersState = customersState.map(c => {
    if (c.id !== id) return c;
    const updated = { ...c, ...updates };
    return { ...updated, segment: classifySegment(updated) };
  });
  emit();
};

export const addCustomer = (customer: CustomerFull) => {
  customersState = [...customersState, { ...customer, segment: classifySegment(customer) }];
  emit();
};
