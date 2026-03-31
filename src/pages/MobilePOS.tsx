import React, { useState } from "react";
import { MobileTablesScreen } from "@/components/mobile/MobileTablesScreen";
import { MobileDiningSheet } from "@/components/mobile/MobileDiningSheet";
import { MobileMenuScreen } from "@/components/mobile/MobileMenuScreen";
import { MobileReviewScreen } from "@/components/mobile/MobileReviewScreen";
import { MobilePaymentSheet } from "@/components/mobile/MobilePaymentSheet";
import { tables as mockTables, menuItems, type Table, type OrderItem, type ServiceMode } from "@/data/mock-data";
import { insertOrder, insertOrderItems, updateOrderStatus } from "@/lib/db-orders";

type MobileStep = "tables" | "dining" | "menu" | "review" | "payment";

const MobilePOS: React.FC = () => {
  const [step, setStep] = useState<MobileStep>("tables");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [serviceMode, setServiceMode] = useState<ServiceMode>("dine-in");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderId] = useState(() => `mob-${Date.now()}`);

  const recalc = (items: OrderItem[]) => {
    const subtotal = items.reduce((s, i) => s + (i.price + i.modifiers.reduce((ms, m) => ms + m.price, 0)) * i.quantity, 0);
    const sc = subtotal * 0.1;
    const gst = (subtotal + sc) * 0.09;
    return { subtotal: Math.round(subtotal * 100) / 100, serviceCharge: Math.round(sc * 100) / 100, gst: Math.round(gst * 100) / 100, total: Math.round((subtotal + sc + gst) * 100) / 100 };
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setStep("dining");
  };

  const handleSelectDining = (mode: ServiceMode) => {
    setServiceMode(mode);
    setStep("menu");
  };

  const handleAddItem = (menuItemId: string, modifiers: { name: string; price: number }[], notes?: string) => {
    const menuItem = menuItems.find(m => m.id === menuItemId);
    if (!menuItem) return;
    setOrderItems(prev => {
      const existing = prev.find(i => i.menuItemId === menuItemId && JSON.stringify(i.modifiers) === JSON.stringify(modifiers));
      if (existing) return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        id: `oi-${Date.now()}`, menuItemId, name: menuItem.name, price: menuItem.price,
        quantity: 1, modifiers, notes, status: "new" as const,
      }];
    });
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const handlePaymentComplete = async () => {
    const totals = recalc(orderItems);

    // Persist order to DB
    await insertOrder({
      id: orderId,
      table_id: selectedTable?.id,
      table_number: selectedTable?.number,
      service_mode: serviceMode,
      status: "paid",
      guest_count: 1,
      subtotal: totals.subtotal,
      service_charge: totals.serviceCharge,
      gst: totals.gst,
      total: totals.total,
    });

    const items = orderItems.map((item, idx) => ({
      id: `${orderId}-i${idx}`,
      order_id: orderId,
      menu_item_id: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      status: "new",
      notes: item.notes,
    }));

    const mods = orderItems.flatMap((item, idx) =>
      item.modifiers.map(m => ({
        order_item_id: `${orderId}-i${idx}`,
        name: m.name,
        price: m.price,
      }))
    );

    await insertOrderItems(items, mods);

    setStep("tables");
    setSelectedTable(null);
    setOrderItems([]);
  };

  const totals = recalc(orderItems);

  switch (step) {
    case "tables":
      return <MobileTablesScreen tables={mockTables} onSelectTable={handleSelectTable} />;
    case "dining":
      return <MobileDiningSheet table={selectedTable!} onSelect={handleSelectDining} onBack={() => setStep("tables")} />;
    case "menu":
      return (
        <MobileMenuScreen
          table={selectedTable!}
          serviceMode={serviceMode}
          orderItems={orderItems}
          onAddItem={handleAddItem}
          onReview={() => setStep("review")}
          onBack={() => setStep("dining")}
          total={totals.total}
          itemCount={orderItems.reduce((s, i) => s + i.quantity, 0)}
        />
      );
    case "review":
      return (
        <MobileReviewScreen
          table={selectedTable!}
          serviceMode={serviceMode}
          items={orderItems}
          totals={totals}
          onUpdateQty={handleUpdateQty}
          onPay={() => setStep("payment")}
          onBack={() => setStep("menu")}
        />
      );
    case "payment":
      return (
        <MobilePaymentSheet
          total={totals.total}
          onComplete={handlePaymentComplete}
          onBack={() => setStep("review")}
        />
      );
  }
};

export default MobilePOS;
