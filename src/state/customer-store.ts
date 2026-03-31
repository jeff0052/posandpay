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
  { id: "c1", name: "David Wong", phone: "91234567", email: "david.wong@gmail.com", tags: ["regular", "lunch"], visits: 24, points: 480, tier: "gold", totalSpend: 1250.80, averageTicket: 52.12, preferredItems: ["Chicken Rice", "Teh Tarik"], notes: "Prefers window seat", lastVisit: new Date(Date.now() - 2 * 86400000).toISOString(), createdAt: "2024-03-15T00:00:00Z", segment: "vip" },
  { id: "c2", name: "Sarah Tan", phone: "98765432", email: "sarah.t@hotmail.com", tags: ["family"], visits: 12, points: 240, tier: "silver", totalSpend: 680.50, averageTicket: 56.71, preferredItems: ["Laksa", "Nasi Lemak"], lastVisit: new Date(Date.now() - 5 * 86400000).toISOString(), createdAt: "2024-06-01T00:00:00Z", segment: "regular" },
  { id: "c3", name: "Michael Lee", phone: "87654321", email: "mike.lee@yahoo.com", tags: ["business"], visits: 45, points: 1350, tier: "platinum", totalSpend: 3200.00, averageTicket: 71.11, preferredItems: ["Bak Kut Teh", "Char Kway Teow"], notes: "Corporate account — Song Fa Holdings", lastVisit: new Date(Date.now() - 1 * 86400000).toISOString(), createdAt: "2023-11-20T00:00:00Z", segment: "vip" },
  { id: "c4", name: "Lisa Chen", phone: "92223333", tags: ["vegetarian"], visits: 8, points: 120, tier: "bronze", totalSpend: 320.40, averageTicket: 40.05, preferredItems: ["Spring Rolls", "Popiah"], lastVisit: new Date(Date.now() - 10 * 86400000).toISOString(), createdAt: "2024-09-01T00:00:00Z", segment: "regular" },
  { id: "c5", name: "Ahmad bin Hassan", phone: "81112222", email: "ahmad.h@gmail.com", tags: ["halal"], visits: 3, points: 45, tier: "bronze", totalSpend: 95.50, averageTicket: 31.83, preferredItems: ["Nasi Lemak"], lastVisit: new Date(Date.now() - 20 * 86400000).toISOString(), createdAt: "2025-01-10T00:00:00Z", segment: "new" },
  { id: "c6", name: "Jennifer Lim", phone: "96667777", email: "jen.lim@outlook.com", tags: ["dessert-lover"], visits: 18, points: 360, tier: "silver", totalSpend: 890.00, averageTicket: 49.44, preferredItems: ["Chilli Crab", "Mango Pudding"], notes: "Allergic to peanuts", lastVisit: new Date(Date.now() - 3 * 86400000).toISOString(), createdAt: "2024-04-22T00:00:00Z", segment: "regular", dateOfBirth: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5).toISOString() },
  { id: "c7", name: "Raj Patel", phone: "88889999", tags: ["spicy"], visits: 6, points: 90, tier: "bronze", totalSpend: 210.30, averageTicket: 35.05, preferredItems: ["Laksa", "Satay"], lastVisit: new Date(Date.now() - 15 * 86400000).toISOString(), createdAt: "2024-11-05T00:00:00Z", segment: "regular" },
  { id: "c8", name: "Emily Ng", phone: "93334444", email: "emily.ng@gmail.com", tags: ["health-conscious"], visits: 31, points: 930, tier: "gold", totalSpend: 1580.00, averageTicket: 50.97, preferredItems: ["Chicken Rice", "Prawn Crackers"], lastVisit: new Date(Date.now() - 1 * 86400000).toISOString(), createdAt: "2024-01-15T00:00:00Z", segment: "vip" },
  { id: "c9", name: "Kevin Chua", phone: "85556666", visits: 1, points: 15, tier: "bronze", totalSpend: 42.50, averageTicket: 42.50, preferredItems: [], lastVisit: new Date(Date.now() - 45 * 86400000).toISOString(), createdAt: "2025-02-20T00:00:00Z", segment: "new" },
  { id: "c10", name: "Grace Ong", phone: "97778888", email: "grace.ong@icloud.com", tags: ["birthday-coming"], visits: 22, points: 660, tier: "gold", totalSpend: 1120.00, averageTicket: 50.91, preferredItems: ["Hokkien Mee", "Teh Tarik"], lastVisit: new Date(Date.now() - 4 * 86400000).toISOString(), createdAt: "2024-02-14T00:00:00Z", segment: "vip", dateOfBirth: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 12).toISOString() },
  { id: "c11", name: "Tommy Koh", phone: "82229999", visits: 2, points: 30, tier: "bronze", totalSpend: 68.00, averageTicket: 34.00, preferredItems: ["Satay"], lastVisit: new Date(Date.now() - 60 * 86400000).toISOString(), createdAt: "2025-01-05T00:00:00Z", segment: "at_risk" },
  { id: "c12", name: "Priya Sharma", phone: "91119999", email: "priya.s@gmail.com", tags: ["vegetarian", "regular"], visits: 15, points: 300, tier: "silver", totalSpend: 520.00, averageTicket: 34.67, preferredItems: ["Spring Rolls", "Popiah", "Teh Tarik"], lastVisit: new Date(Date.now() - 7 * 86400000).toISOString(), createdAt: "2024-07-10T00:00:00Z", segment: "regular" },
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

export const findByPhone = (phone: string): CustomerFull | undefined => {
  const normalized = phone.replace(/\s/g, "").slice(-8);
  return customersState.find(c => c.phone.replace(/\s/g, "").endsWith(normalized));
};

export const registerCustomer = (phone: string, email?: string, nickname?: string): CustomerFull => {
  const newCustomer: CustomerFull = {
    id: `c-${Date.now()}`,
    name: nickname || "Guest",
    phone: `+65 ${phone}`,
    email: email || undefined,
    tags: ["qr-signup"],
    visits: 0,
    points: 0,
    tier: "bronze",
    totalSpend: 0,
    averageTicket: 0,
    preferredItems: [],
    lastVisit: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString().slice(0, 10),
    segment: "new",
  };
  addCustomer(newCustomer);
  return newCustomer;
};

export const addPoints = (customerId: string, amount: number) => {
  const points = Math.floor(amount);
  customersState = customersState.map(c => c.id === customerId ? { ...c, points: c.points + points } : c);
  emit();
};
