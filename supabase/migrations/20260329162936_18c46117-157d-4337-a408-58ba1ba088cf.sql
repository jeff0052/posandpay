
-- Inventory Management Tables
CREATE TYPE public.inventory_category AS ENUM ('raw_ingredients', 'packaging', 'beverages', 'supplies');
CREATE TYPE public.inventory_unit AS ENUM ('kg', 'L', 'pcs', 'box', 'pack', 'bottle');
CREATE TYPE public.po_status AS ENUM ('draft', 'ordered', 'received', 'cancelled');
CREATE TYPE public.movement_type AS ENUM ('receive', 'waste', 'transfer', 'sale', 'adjustment');
CREATE TYPE public.queue_status AS ENUM ('waiting', 'called', 'seated', 'no_show', 'cancelled');

CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_zh TEXT,
  sku TEXT UNIQUE,
  category inventory_category NOT NULL DEFAULT 'raw_ingredients',
  unit inventory_unit NOT NULL DEFAULT 'pcs',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  reorder_point NUMERIC NOT NULL DEFAULT 10,
  cost_per_unit NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  last_restocked TIMESTAMPTZ,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier TEXT NOT NULL,
  status po_status NOT NULL DEFAULT 'draft',
  expected_delivery DATE,
  notes TEXT,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type movement_type NOT NULL,
  quantity NUMERIC NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.menu_item_ingredients (
  menu_item_id TEXT NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_per_serving NUMERIC NOT NULL DEFAULT 1,
  PRIMARY KEY (menu_item_id, inventory_item_id)
);

CREATE TABLE public.queue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_size INTEGER NOT NULL DEFAULT 2,
  customer_name TEXT,
  customer_phone TEXT,
  estimated_wait INTEGER NOT NULL DEFAULT 15,
  status queue_status NOT NULL DEFAULT 'waiting',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at TIMESTAMPTZ,
  seated_at TIMESTAMPTZ,
  notes TEXT,
  preferred_zone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies (public access for POS terminal)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on inventory_items" ON public.inventory_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on purchase_orders" ON public.purchase_orders FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on purchase_order_items" ON public.purchase_order_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on stock_movements" ON public.stock_movements FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on menu_item_ingredients" ON public.menu_item_ingredients FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on queue_entries" ON public.queue_entries FOR ALL TO public USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_entries;

-- Indexes
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_stock_movements_item ON public.stock_movements(inventory_item_id);
CREATE INDEX idx_queue_entries_status ON public.queue_entries(status);
