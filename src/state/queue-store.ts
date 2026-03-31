import { useSyncExternalStore } from "react";

export type QueueStatus = "waiting" | "called" | "seated" | "no_show" | "cancelled";

export interface QueueEntry {
  id: string;
  partySize: number;
  customerName?: string;
  customerPhone?: string;
  estimatedWait: number;
  status: QueueStatus;
  joinedAt: string;
  calledAt?: string;
  seatedAt?: string;
  notes?: string;
  preferredZone?: string;
}

type Listener = () => void;

const now = new Date();
const initialEntries: QueueEntry[] = [
  { id: "q1", partySize: 4, customerName: "Daniel Loh", customerPhone: "91234000", estimatedWait: 15, status: "waiting", joinedAt: new Date(now.getTime() - 15 * 60000).toISOString(), preferredZone: "Main Hall" },
  { id: "q2", partySize: 2, customerName: "Mary Goh", customerPhone: "98761111", estimatedWait: 10, status: "waiting", joinedAt: new Date(now.getTime() - 10 * 60000).toISOString() },
  { id: "q3", partySize: 6, customerName: "James Teo", customerPhone: "87652222", estimatedWait: 25, status: "waiting", joinedAt: new Date(now.getTime() - 22 * 60000).toISOString(), preferredZone: "Private" },
  { id: "q4", partySize: 3, customerName: "Anna Sim", customerPhone: "92223000", estimatedWait: 20, status: "called", joinedAt: new Date(now.getTime() - 25 * 60000).toISOString(), calledAt: new Date(now.getTime() - 2 * 60000).toISOString(), preferredZone: "Patio" },
  { id: "q5", partySize: 2, customerName: "Steven Tan", customerPhone: "81114000", estimatedWait: 10, status: "seated", joinedAt: new Date(now.getTime() - 35 * 60000).toISOString(), calledAt: new Date(now.getTime() - 20 * 60000).toISOString(), seatedAt: new Date(now.getTime() - 18 * 60000).toISOString(), preferredZone: "Bar" },
  { id: "q6", partySize: 5, customerName: "Linda Yeo", estimatedWait: 5, status: "waiting", joinedAt: new Date(now.getTime() - 5 * 60000).toISOString() },
  { id: "q7", partySize: 2, customerName: "Patrick Low", customerPhone: "96665000", estimatedWait: 10, status: "no_show", joinedAt: new Date(now.getTime() - 40 * 60000).toISOString() },
  { id: "q8", partySize: 4, customerName: "Rachel Foo", customerPhone: "93336000", estimatedWait: 15, status: "seated", joinedAt: new Date(now.getTime() - 30 * 60000).toISOString(), calledAt: new Date(now.getTime() - 15 * 60000).toISOString(), seatedAt: new Date(now.getTime() - 12 * 60000).toISOString(), preferredZone: "Main Hall" },
];

let entriesState = [...initialEntries];
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const sub = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useQueueEntries = () => useSyncExternalStore(sub, () => entriesState, () => entriesState);

export const addToQueue = (entry: Omit<QueueEntry, "id" | "status" | "joinedAt">) => {
  const newEntry: QueueEntry = {
    ...entry,
    id: `q-${Date.now()}`,
    status: "waiting",
    joinedAt: new Date().toISOString(),
  };
  entriesState = [...entriesState, newEntry];
  emit();
  return newEntry;
};

export const callNext = () => {
  const waiting = entriesState.filter(e => e.status === "waiting").sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
  if (waiting.length === 0) return null;
  const next = waiting[0];
  entriesState = entriesState.map(e => e.id === next.id ? { ...e, status: "called" as const, calledAt: new Date().toISOString() } : e);
  emit();
  return next;
};

export const updateQueueStatus = (id: string, status: QueueStatus) => {
  entriesState = entriesState.map(e => {
    if (e.id !== id) return e;
    const updates: Partial<QueueEntry> = { status };
    if (status === "called") updates.calledAt = new Date().toISOString();
    if (status === "seated") updates.seatedAt = new Date().toISOString();
    return { ...e, ...updates };
  });
  emit();
};

export const removeFromQueue = (id: string) => {
  entriesState = entriesState.filter(e => e.id !== id);
  emit();
};

export const getQueueStats = () => {
  const waiting = entriesState.filter(e => e.status === "waiting");
  const seated = entriesState.filter(e => e.status === "seated");
  const noShows = entriesState.filter(e => e.status === "no_show");
  const avgWait = seated.length > 0
    ? seated.reduce((sum, e) => sum + (new Date(e.seatedAt!).getTime() - new Date(e.joinedAt).getTime()), 0) / seated.length / 60000
    : 0;
  return {
    waitingCount: waiting.length,
    averageWait: Math.round(avgWait),
    noShowRate: entriesState.length > 0 ? Math.round(noShows.length / entriesState.length * 100) : 0,
    totalToday: entriesState.length,
  };
};
