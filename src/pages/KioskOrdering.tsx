import React, { useState } from "react";
import { type MenuItem } from "@/data/mock-data";
import { useKioskStore, addToKioskCart, clearKioskCart, getNextCollectionNumber } from "@/state/kiosk-store";
import { KioskWelcome } from "@/components/kiosk/KioskWelcome";
import { KioskMenu } from "@/components/kiosk/KioskMenu";
import { KioskItemDetail } from "@/components/kiosk/KioskItemDetail";
import { KioskCart } from "@/components/kiosk/KioskCart";
import { KioskPayment } from "@/components/kiosk/KioskPayment";
import { KioskComplete } from "@/components/kiosk/KioskComplete";

type Screen = "welcome" | "menu" | "cart" | "payment" | "complete";

const KioskOrdering: React.FC = () => {
  const { cart } = useKioskStore();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [serviceMode, setServiceMode] = useState<"dine-in" | "takeaway">("dine-in");
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [collectionNumber, setCollectionNumber] = useState("");

  const handleStart = (mode: "dine-in" | "takeaway") => {
    setServiceMode(mode);
    clearKioskCart();
    setScreen("menu");
  };

  const handleSelectItem = (item: MenuItem) => {
    if ((item.modifierGroups && item.modifierGroups.length > 0) || item.isCombo) {
      setDetailItem(item);
    } else {
      addToKioskCart({ menuItemId: item.id, name: item.name, nameZh: item.nameZh, price: item.price, quantity: 1, modifiers: [] });
    }
  };

  const handleAddFromDetail = (modifiers: { name: string; price: number }[], notes?: string, comboItems?: { name: string; groupName: string }[]) => {
    if (!detailItem) return;
    addToKioskCart({ menuItemId: detailItem.id, name: detailItem.name, nameZh: detailItem.nameZh, price: detailItem.price, quantity: 1, modifiers, notes, comboItems });
  };

  const handlePaymentComplete = (_method: string) => {
    const num = getNextCollectionNumber();
    setCollectionNumber(num);
    setScreen("complete");
  };

  const handleNewOrder = () => {
    clearKioskCart();
    setCollectionNumber("");
    setScreen("welcome");
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = Math.round(cart.reduce((s, i) => s + (i.price + i.modifiers.reduce((a, m) => a + m.price, 0)) * i.quantity, 0) * 100) / 100;
  const sc = Math.round(subtotal * 0.1 * 100) / 100;
  const gst = Math.round((subtotal + sc) * 0.09 * 100) / 100;
  const total = Math.round((subtotal + sc + gst) * 100) / 100;

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {screen === "welcome" && <KioskWelcome onStart={handleStart} />}
      {screen === "menu" && (
        <>
          <KioskMenu onSelectItem={handleSelectItem} onViewCart={() => setScreen("cart")} cartCount={cartCount} />
          {detailItem && <KioskItemDetail item={detailItem} onAdd={handleAddFromDetail} onClose={() => setDetailItem(null)} />}
        </>
      )}
      {screen === "cart" && <KioskCart cart={cart} onBack={() => setScreen("menu")} onPay={() => setScreen("payment")} />}
      {screen === "payment" && <KioskPayment total={total} onComplete={handlePaymentComplete} onBack={() => setScreen("cart")} />}
      {screen === "complete" && <KioskComplete collectionNumber={collectionNumber} onNewOrder={handleNewOrder} />}
    </div>
  );
};

export default KioskOrdering;
