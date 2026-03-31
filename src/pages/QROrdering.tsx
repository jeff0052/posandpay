import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { QRTableSelect } from "@/components/qr/QRTableSelect";
import { QRMemberAuth } from "@/components/qr/QRMemberAuth";
import { QRMenuBrowser, type QRCartItem } from "@/components/qr/QRMenuBrowser";
import { QRCart } from "@/components/qr/QRCart";
import { QRPayment } from "@/components/qr/QRPayment";
import { QRComplete } from "@/components/qr/QRComplete";
import { useSettings } from "@/state/settings-store";
import { updateCustomer, type CustomerFull } from "@/state/customer-store";
import { insertOrder, insertOrderItems } from "@/lib/db-orders";

type Screen = "table" | "auth" | "menu" | "cart" | "payment" | "complete";

const QROrdering: React.FC = () => {
  const [searchParams] = useSearchParams();
  const settings = useSettings();
  const initialTable = searchParams.get("table") || "";

  const [screen, setScreen] = useState<Screen>(initialTable ? "auth" : "table");
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [customer, setCustomer] = useState<CustomerFull | null>(null);
  const [cart, setCart] = useState<QRCartItem[]>([]);
  const [isPaid, setIsPaid] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const handleTableConfirm = (num: string) => {
    setTableNumber(num);
    setScreen("auth");
  };

  const handleAuth = (c: CustomerFull | null) => {
    setCustomer(c);
    setScreen("menu");
  };

  const handleAddToCart = (item: QRCartItem) => {
    setCart(prev => [...prev, item]);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const handleRemove = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const subtotal = Math.round(cart.reduce((s, i) => s + (i.price + i.modifiers.reduce((a, m) => a + m.price, 0)) * i.quantity, 0) * 100) / 100;
  const sc = Math.round(subtotal * 0.1 * 100) / 100;
  const gst = Math.round((subtotal + sc) * 0.09 * 100) / 100;
  const total = Math.round((subtotal + sc + gst) * 100) / 100;

  const generateOrderNumber = () => {
    return `QR${Date.now().toString(36).slice(-4).toUpperCase()}`;
  };

  const finalizeOrder = async (paid: boolean) => {
    const num = generateOrderNumber();
    setOrderNumber(num);
    setIsPaid(paid);

    // Persist to database
    const orderId = `qr-${Date.now()}`;
    await insertOrder({
      id: orderId,
      table_number: tableNumber,
      service_mode: "qr",
      status: paid ? "paid" : "open",
      guest_count: 1,
      subtotal,
      service_charge: sc,
      gst,
      total,
      customer_id: customer?.id || undefined,
    });

    const items = cart.map((item, idx) => ({
      id: `${orderId}-i${idx}`,
      order_id: orderId,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      status: "new",
    }));

    const modifiers = cart.flatMap((item, idx) =>
      item.modifiers.map(m => ({
        order_item_id: `${orderId}-i${idx}`,
        name: m.name,
        price: m.price,
      }))
    );

    await insertOrderItems(items, modifiers);

    // Award points to member (1 point per $1)
    if (customer) {
      const pointsEarned = Math.floor(subtotal);
      updateCustomer(customer.id, {
        points: customer.points + pointsEarned,
        visits: customer.visits + 1,
        totalSpend: Math.round((customer.totalSpend + total) * 100) / 100,
        lastVisit: new Date().toISOString().slice(0, 10),
      });
    }

    setScreen("complete");
  };

  const handlePaymentComplete = (_method: string) => {
    finalizeOrder(true);
  };

  const handlePayLater = () => {
    finalizeOrder(false);
  };

  const showPayLater = settings.qrPaymentMode === "post-pay" || settings.qrPaymentMode === "choice";
  const showPayNow = settings.qrPaymentMode === "pre-pay" || settings.qrPaymentMode === "choice";

  return (
    <div className="min-h-screen bg-background">
      {screen === "table" && <QRTableSelect initialTable={initialTable} onConfirm={handleTableConfirm} />}
      {screen === "auth" && <QRMemberAuth onAuth={handleAuth} />}
      {screen === "menu" && <QRMenuBrowser cart={cart} onAddToCart={handleAddToCart} onViewCart={() => setScreen("cart")} />}
      {screen === "cart" && (
        <QRCart
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onRemove={handleRemove}
          onBack={() => setScreen("menu")}
          onPay={() => showPayNow ? setScreen("payment") : handlePayLater()}
          onPayLater={handlePayLater}
          showPayLater={showPayLater}
        />
      )}
      {screen === "payment" && <QRPayment total={total} onComplete={handlePaymentComplete} onBack={() => setScreen("cart")} />}
      {screen === "complete" && <QRComplete tableNumber={tableNumber} orderNumber={orderNumber} isPaid={isPaid} />}
    </div>
  );
};

export default QROrdering;
