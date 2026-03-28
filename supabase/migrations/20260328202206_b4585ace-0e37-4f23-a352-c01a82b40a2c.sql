
-- =============================================
-- POS System Database Schema
-- =============================================

-- Enums
CREATE TYPE public.table_status AS ENUM ('available', 'reserved', 'ordering', 'ordered', 'dirty', 'cleaning');
CREATE TYPE public.service_mode AS ENUM ('dine-in', 'takeaway', 'delivery', 'pickup');
CREATE TYPE public.order_status AS ENUM ('open', 'sent', 'preparing', 'ready', 'served', 'paid', 'void');
CREATE TYPE public.kds_status AS ENUM ('new', 'preparing', 'ready', 'served');
CREATE TYPE public.customer_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
CREATE TYPE public.staff_role AS ENUM ('server', 'cashier', 'manager', 'kitchen');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 1. Restaurant Tables (floor plan)
-- =============================================
CREATE TABLE public.restaurant_tables (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  zone TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 2,
  status public.table_status NOT NULL DEFAULT 'available',
  guest_count INTEGER,
  server TEXT,
  open_amount NUMERIC(10,2),
  elapsed_minutes INTEGER,
  order_id TEXT,
  merged_with TEXT[],
  reservation_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on restaurant_tables" ON public.restaurant_tables FOR SELECT USING (true);
CREATE POLICY "Allow public insert on restaurant_tables" ON public.restaurant_tables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on restaurant_tables" ON public.restaurant_tables FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on restaurant_tables" ON public.restaurant_tables FOR DELETE USING (true);

CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Menu Items
-- =============================================
CREATE TABLE public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_zh TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  popular BOOLEAN NOT NULL DEFAULT false,
  is_combo BOOLEAN NOT NULL DEFAULT false,
  is_flex_combo BOOLEAN NOT NULL DEFAULT false,
  combo_includes TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on menu_items" ON public.menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on menu_items" ON public.menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on menu_items" ON public.menu_items FOR DELETE USING (true);

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. Modifier Groups
-- =============================================
CREATE TABLE public.modifier_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_zh TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  multi_select BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on modifier_groups" ON public.modifier_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert on modifier_groups" ON public.modifier_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on modifier_groups" ON public.modifier_groups FOR UPDATE USING (true);

-- =============================================
-- 4. Modifier Options
-- =============================================
CREATE TABLE public.modifier_options (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_zh TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on modifier_options" ON public.modifier_options FOR SELECT USING (true);
CREATE POLICY "Allow public insert on modifier_options" ON public.modifier_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on modifier_options" ON public.modifier_options FOR UPDATE USING (true);

-- =============================================
-- 5. Menu Item ↔ Modifier Group junction
-- =============================================
CREATE TABLE public.menu_item_modifier_groups (
  menu_item_id TEXT NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  modifier_group_id TEXT NOT NULL REFERENCES public.modifier_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, modifier_group_id)
);

ALTER TABLE public.menu_item_modifier_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on menu_item_modifier_groups" ON public.menu_item_modifier_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert on menu_item_modifier_groups" ON public.menu_item_modifier_groups FOR INSERT WITH CHECK (true);

-- =============================================
-- 6. Combo Groups (for combo items)
-- =============================================
CREATE TABLE public.combo_groups (
  id TEXT PRIMARY KEY,
  menu_item_id TEXT NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_zh TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  max_select INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.combo_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on combo_groups" ON public.combo_groups FOR SELECT USING (true);
CREATE POLICY "Allow public insert on combo_groups" ON public.combo_groups FOR INSERT WITH CHECK (true);

-- =============================================
-- 7. Combo Group Allowed Items
-- =============================================
CREATE TABLE public.combo_group_items (
  combo_group_id TEXT NOT NULL REFERENCES public.combo_groups(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  PRIMARY KEY (combo_group_id, menu_item_id)
);

ALTER TABLE public.combo_group_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on combo_group_items" ON public.combo_group_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on combo_group_items" ON public.combo_group_items FOR INSERT WITH CHECK (true);

-- =============================================
-- 8. Customers
-- =============================================
CREATE TABLE public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  visits INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  tier public.customer_tier NOT NULL DEFAULT 'bronze',
  last_visit DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on customers" ON public.customers FOR UPDATE USING (true);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 9. Staff Members
-- =============================================
CREATE TABLE public.staff_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role public.staff_role NOT NULL,
  pin TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on staff_members" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert on staff_members" ON public.staff_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on staff_members" ON public.staff_members FOR UPDATE USING (true);

CREATE TRIGGER update_staff_members_updated_at
  BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 10. Orders
-- =============================================
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  table_id TEXT REFERENCES public.restaurant_tables(id),
  table_number TEXT,
  service_mode public.service_mode NOT NULL DEFAULT 'dine-in',
  status public.order_status NOT NULL DEFAULT 'open',
  guest_count INTEGER NOT NULL DEFAULT 1,
  customer_id TEXT REFERENCES public.customers(id),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  gst NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on orders" ON public.orders FOR DELETE USING (true);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 11. Order Items
-- =============================================
CREATE TABLE public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  seat INTEGER,
  status public.kds_status NOT NULL DEFAULT 'new',
  fired_at TIMESTAMPTZ,
  combo_items JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on order_items" ON public.order_items FOR DELETE USING (true);

-- =============================================
-- 12. Order Item Modifiers
-- =============================================
CREATE TABLE public.order_item_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id TEXT NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on order_item_modifiers" ON public.order_item_modifiers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_item_modifiers" ON public.order_item_modifiers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on order_item_modifiers" ON public.order_item_modifiers FOR DELETE USING (true);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_menu_items_category ON public.menu_items(category);
CREATE INDEX idx_menu_items_available ON public.menu_items(available);
CREATE INDEX idx_orders_table_id ON public.orders(table_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_modifier_options_group_id ON public.modifier_options(group_id);
CREATE INDEX idx_restaurant_tables_zone ON public.restaurant_tables(zone);
CREATE INDEX idx_restaurant_tables_status ON public.restaurant_tables(status);
