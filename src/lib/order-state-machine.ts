import type { OrderStatus } from "@/data/mock-data";

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  open: ["sent", "void"],
  sent: ["preparing", "void"],
  preparing: ["ready", "void"],
  ready: ["served", "void"],
  served: ["paid", "void"],
  paid: [],
  void: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean => {
  return validTransitions[from]?.includes(to) ?? false;
};

export const getNextStatus = (current: OrderStatus): OrderStatus | null => {
  const transitions = validTransitions[current];
  if (!transitions || transitions.length === 0) return null;
  return transitions.find(s => s !== "void") ?? null;
};

export const requiresManagerPin = (to: OrderStatus): boolean => {
  return to === "void";
};

/** Round to 2 decimal places */
export const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Calculate totals with proper Singapore tax rules */
export const calcOrderTotals = (
  subtotal: number,
  discountAmt: number = 0
): { adjustedSubtotal: number; serviceCharge: number; gst: number; total: number } => {
  const adjustedSubtotal = round2(Math.max(0, subtotal - discountAmt));
  const serviceCharge = round2(adjustedSubtotal * 0.1);
  const gst = round2((adjustedSubtotal + serviceCharge) * 0.09);
  const total = round2(adjustedSubtotal + serviceCharge + gst);
  return { adjustedSubtotal, serviceCharge, gst, total };
};

/** Split bill with rounding correction on last share */
export const splitBill = (total: number, count: number): number[] => {
  if (count <= 1) return [round2(total)];
  const share = round2(total / count);
  const shares = Array(count - 1).fill(share);
  const lastShare = round2(total - share * (count - 1));
  shares.push(lastShare);
  return shares;
};
