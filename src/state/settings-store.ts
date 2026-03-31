import { useSyncExternalStore } from "react";

export type QRPaymentMode = "pre-pay" | "post-pay" | "choice";
export type ServiceFlow = "restaurant" | "fast-food";

export interface MerchantSettings {
  qrEnabled: boolean;
  qrPaymentMode: QRPaymentMode;
  kioskEnabled: boolean;
  kioskPaymentMethods: { card: boolean; qr: boolean };
  serviceFlow: ServiceFlow;
}

type Listener = () => void;

let state: MerchantSettings = {
  qrEnabled: true,
  qrPaymentMode: "choice",
  kioskEnabled: true,
  kioskPaymentMethods: { card: true, qr: true },
  serviceFlow: "restaurant" as ServiceFlow,
};

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useSettings = () => useSyncExternalStore(subscribe, () => state, () => state);

export const updateSettings = (updates: Partial<MerchantSettings>) => {
  state = { ...state, ...updates };
  emit();
};
