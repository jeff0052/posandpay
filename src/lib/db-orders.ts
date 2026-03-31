import { supabase } from "@/integrations/supabase/client";

interface OrderInsert {
  id: string;
  table_id?: string;
  table_number?: string;
  service_mode: string;
  status: string;
  guest_count: number;
  subtotal: number;
  service_charge: number;
  gst: number;
  total: number;
  customer_id?: string;
}

interface OrderItemInsert {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  status: string;
  fired_at?: string;
  seat?: number;
  combo_items?: { name: string; groupName: string }[];
}

interface ModifierInsert {
  order_item_id: string;
  name: string;
  price: number;
}

export async function insertOrder(order: OrderInsert) {
  const { error } = await supabase.from("orders").insert({
    id: order.id,
    table_id: order.table_id || null,
    table_number: order.table_number || null,
    service_mode: order.service_mode as any,
    status: order.status as any,
    guest_count: order.guest_count,
    subtotal: order.subtotal,
    service_charge: order.service_charge,
    gst: order.gst,
    total: order.total,
    customer_id: order.customer_id || null,
  });
  if (error) console.error("insertOrder error:", error);
  return !error;
}

export async function insertOrderItems(
  items: OrderItemInsert[],
  modifiers: ModifierInsert[]
) {
  if (items.length > 0) {
    const { error: itemErr } = await supabase.from("order_items").insert(
      items.map(i => ({
        id: i.id,
        order_id: i.order_id,
        menu_item_id: i.menu_item_id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        notes: i.notes || null,
        status: i.status as any,
        fired_at: i.fired_at || null,
        seat: i.seat || null,
        combo_items: i.combo_items || null,
      }))
    );
    if (itemErr) console.error("insertOrderItems error:", itemErr);
  }

  if (modifiers.length > 0) {
    const { error: modErr } = await supabase.from("order_item_modifiers").insert(
      modifiers.map(m => ({
        order_item_id: m.order_item_id,
        name: m.name,
        price: m.price,
      }))
    );
    if (modErr) console.error("insertOrderItemModifiers error:", modErr);
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status: status as any })
    .eq("id", orderId);
  if (error) console.error("updateOrderStatus error:", error);
  return !error;
}

export async function updateOrderTotals(orderId: string, totals: {
  subtotal: number;
  service_charge: number;
  gst: number;
  total: number;
}) {
  const { error } = await supabase
    .from("orders")
    .update(totals)
    .eq("id", orderId);
  if (error) console.error("updateOrderTotals error:", error);
}

export async function fetchActiveOrders() {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .not("status", "in", '("paid","void")')
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchActiveOrders error:", error);
    return [];
  }

  const orderIds = (orders || []).map(o => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  const itemIds = (items || []).map(i => i.id);
  let mods: any[] = [];
  if (itemIds.length > 0) {
    const { data } = await supabase
      .from("order_item_modifiers")
      .select("*")
      .in("order_item_id", itemIds);
    mods = data || [];
  }

  return (orders || []).map(order => ({
    ...order,
    items: (items || [])
      .filter(i => i.order_id === order.id)
      .map(item => ({
        ...item,
        modifiers: mods.filter(m => m.order_item_id === item.id),
      })),
  }));
}

export async function fetchOrdersInRange(from: string, to: string) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", from)
    .lte("created_at", to)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("fetchOrdersInRange error:", error);
    return [];
  }

  const orderIds = (orders || []).map(o => o.id);
  if (orderIds.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);

  return (orders || []).map(order => ({
    ...order,
    items: (items || []).filter(i => i.order_id === order.id),
  }));
}
