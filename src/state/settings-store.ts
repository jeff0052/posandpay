import { useSyncExternalStore } from "react";

export type QRPaymentMode = "pre-pay" | "post-pay" | "choice";

export interface MerchantSettings {
  qrEnabled: boolean;
  qrPaymentMode: QRPaymentMode;
  kioskEnabled: boolean;
  kioskPaymentMethods: { card: boolean; qr: boolean };
}

type Listener = () => void;

let state: MerchantSettings = {
  qrEnabled: true,
  qrPaymentMode: "choice",
  kioskEnabled: true,
  kioskPaymentMethods: { card: true, qr: true },
};

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useSettings = () => useSyncExternalStore(subscribe, () => state, () => state);

export const updateSettings = (updates: Partial<MerchantSettings>) => {
  state = { ...state, ...updates };
  emit();
};
