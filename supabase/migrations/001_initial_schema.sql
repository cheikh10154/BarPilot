-- ============================================================================
-- BarPilot – Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Complete multi-tenant schema for bar/restaurant management SaaS
-- ============================================================================

-- ============================================================================
-- 0. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CUSTOM ENUM TYPES
-- ============================================================================

CREATE TYPE membership_role   AS ENUM ('owner', 'manager', 'server', 'bartender');
CREATE TYPE membership_status AS ENUM ('active', 'invited', 'disabled');
CREATE TYPE order_status      AS ENUM ('draft', 'sent', 'preparing', 'ready', 'served', 'closed', 'cancelled');
CREATE TYPE order_item_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');
CREATE TYPE stock_reason      AS ENUM ('purchase', 'sale', 'waste', 'correction', 'return');
CREATE TYPE purchase_status   AS ENUM ('draft', 'sent', 'received', 'partial', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled');
CREATE TYPE preferred_locale  AS ENUM ('it', 'fr');

-- ============================================================================
-- 2. UTILITY FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-create a profile row when a new auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, preferred_locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'preferred_locale')::preferred_locale, 'it')
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 3.1 ORGANIZATIONS
-- --------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  country    VARCHAR(2)   NOT NULL DEFAULT 'IT',
  timezone   VARCHAR(64)  NOT NULL DEFAULT 'Europe/Rome',
  logo_url   TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.organizations IS 'Top-level tenant entity representing a business/company.';

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.2 LOCATIONS
-- --------------------------------------------------------------------------
CREATE TABLE public.locations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  address         TEXT,
  city            VARCHAR(128),
  currency        VARCHAR(3)   NOT NULL DEFAULT 'EUR',
  phone           VARCHAR(32),
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.locations IS 'Physical venue (bar, restaurant) belonging to an organization.';

CREATE INDEX idx_locations_organization_id ON public.locations(organization_id);

CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.3 PROFILES
-- --------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        VARCHAR(255) NOT NULL DEFAULT '',
  email            VARCHAR(320) NOT NULL DEFAULT '',
  avatar_url       TEXT,
  preferred_locale preferred_locale NOT NULL DEFAULT 'it',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Public profile data linked 1:1 with auth.users.';

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Wire up auto-profile creation on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------------
-- 3.4 MEMBERSHIPS
-- --------------------------------------------------------------------------
CREATE TABLE public.memberships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID              NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id     UUID              REFERENCES public.locations(id) ON DELETE SET NULL,
  profile_id      UUID              NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            membership_role   NOT NULL DEFAULT 'server',
  status          membership_status NOT NULL DEFAULT 'invited',
  invited_email   VARCHAR(320),
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),

  UNIQUE (organization_id, profile_id, location_id)
);
COMMENT ON TABLE public.memberships IS 'Links profiles to organizations/locations with a role.';

CREATE INDEX idx_memberships_org_id     ON public.memberships(organization_id);
CREATE INDEX idx_memberships_profile_id ON public.memberships(profile_id);
CREATE INDEX idx_memberships_location   ON public.memberships(location_id);
CREATE INDEX idx_memberships_status     ON public.memberships(status);

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.5 AREAS
-- --------------------------------------------------------------------------
CREATE TABLE public.areas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID         NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name        VARCHAR(128) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.areas IS 'Named zones within a location (e.g. terrace, bar counter).';

CREATE INDEX idx_areas_location_id ON public.areas(location_id);

CREATE TRIGGER trg_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.6 DINING TABLES
-- --------------------------------------------------------------------------
CREATE TABLE public.dining_tables (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID         NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  area_id     UUID         REFERENCES public.areas(id) ON DELETE SET NULL,
  number      VARCHAR(16)  NOT NULL,
  capacity    INT          NOT NULL DEFAULT 4 CHECK (capacity > 0),
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  UNIQUE (location_id, number)
);
COMMENT ON TABLE public.dining_tables IS 'Physical tables available for seating in a location.';

CREATE INDEX idx_dining_tables_location_id ON public.dining_tables(location_id);
CREATE INDEX idx_dining_tables_area_id     ON public.dining_tables(area_id);

CREATE TRIGGER trg_dining_tables_updated_at
  BEFORE UPDATE ON public.dining_tables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.7 CATEGORIES
-- --------------------------------------------------------------------------
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID         NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name_it     VARCHAR(128) NOT NULL,
  name_fr     VARCHAR(128) NOT NULL DEFAULT '',
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.categories IS 'Product categories (e.g. Cocktails, Wines, Beers) per location.';

CREATE INDEX idx_categories_location_id ON public.categories(location_id);

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.8 PRODUCTS
-- --------------------------------------------------------------------------
CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id     UUID         NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  category_id     UUID         NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name_it         VARCHAR(255) NOT NULL,
  name_fr         VARCHAR(255) NOT NULL DEFAULT '',
  description_it  TEXT,
  description_fr  TEXT,
  price_cents     INT          NOT NULL CHECK (price_cents >= 0),
  is_available    BOOLEAN      NOT NULL DEFAULT true,
  is_composed     BOOLEAN      NOT NULL DEFAULT false,
  image_url       TEXT,
  allergens       TEXT[]       DEFAULT '{}',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.products IS 'Items available for sale. is_composed=true means a recipe defines ingredients.';

CREATE INDEX idx_products_location_id ON public.products(location_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_available   ON public.products(location_id, is_available);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.9 ORDERS
-- --------------------------------------------------------------------------
CREATE TABLE public.orders (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id        UUID         NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  table_id           UUID         REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  created_by         UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status             order_status NOT NULL DEFAULT 'draft',
  total_cents        INT          NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  notes              TEXT,
  idempotency_key    VARCHAR(128) UNIQUE,
  closed_at          TIMESTAMPTZ,
  cancelled_at       TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.orders IS 'Customer orders. idempotency_key prevents duplicate submissions.';

CREATE INDEX idx_orders_location_id ON public.orders(location_id);
CREATE INDEX idx_orders_status      ON public.orders(location_id, status);
CREATE INDEX idx_orders_table_id    ON public.orders(table_id);
CREATE INDEX idx_orders_created_by  ON public.orders(created_by);
CREATE INDEX idx_orders_created_at  ON public.orders(created_at DESC);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.10 ORDER ITEMS
-- --------------------------------------------------------------------------
CREATE TABLE public.order_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID             NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id       UUID             NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name     VARCHAR(255)     NOT NULL,
  quantity         INT              NOT NULL CHECK (quantity > 0),
  unit_price_cents INT              NOT NULL CHECK (unit_price_cents >= 0),
  status           order_item_status NOT NULL DEFAULT 'pending',
  notes            TEXT,
  cancelled_reason TEXT,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.order_items IS 'Line items within an order. product_name/unit_price_cents are snapshots.';

CREATE INDEX idx_order_items_order_id   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_order_items_status     ON public.order_items(status);

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.11 ORDER EVENTS (append-only audit trail)
-- --------------------------------------------------------------------------
CREATE TABLE public.order_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_type  VARCHAR(64) NOT NULL,
  payload     JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.order_events IS 'Immutable event log tracking every state change of an order.';

CREATE INDEX idx_order_events_order_id  ON public.order_events(order_id);
CREATE INDEX idx_order_events_actor_id  ON public.order_events(actor_id);
CREATE INDEX idx_order_events_type      ON public.order_events(event_type);

-- --------------------------------------------------------------------------
-- 3.12 INVENTORY ITEMS
-- --------------------------------------------------------------------------
CREATE TABLE public.inventory_items (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id        UUID           NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name_it            VARCHAR(255)   NOT NULL,
  name_fr            VARCHAR(255)   NOT NULL DEFAULT '',
  base_unit          VARCHAR(16)    NOT NULL DEFAULT 'ml' CHECK (base_unit IN ('g', 'ml', 'unit', 'kg', 'l')),
  current_quantity   DECIMAL(12,3)  NOT NULL DEFAULT 0,
  reorder_level      DECIMAL(12,3)  NOT NULL DEFAULT 0,
  average_cost_cents INT            NOT NULL DEFAULT 0 CHECK (average_cost_cents >= 0),
  category           VARCHAR(128),
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ    NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.inventory_items IS 'Raw ingredients and stock-keeping items tracked per location.';

CREATE INDEX idx_inventory_items_location_id ON public.inventory_items(location_id);
CREATE INDEX idx_inventory_items_category    ON public.inventory_items(location_id, category);

CREATE TRIGGER trg_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.13 STOCK MOVEMENTS
-- --------------------------------------------------------------------------
CREATE TABLE public.stock_movements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID          NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  location_id       UUID          NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity_delta    DECIMAL(12,3) NOT NULL,
  reason            stock_reason  NOT NULL,
  reference_type    VARCHAR(64),
  reference_id      UUID,
  notes             TEXT,
  created_by        UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.stock_movements IS 'Ledger of all stock quantity changes with full traceability.';

CREATE INDEX idx_stock_movements_item_id     ON public.stock_movements(inventory_item_id);
CREATE INDEX idx_stock_movements_location_id ON public.stock_movements(location_id);
CREATE INDEX idx_stock_movements_reason      ON public.stock_movements(reason);
CREATE INDEX idx_stock_movements_created_at  ON public.stock_movements(created_at DESC);

-- --------------------------------------------------------------------------
-- 3.14 RECIPES
-- --------------------------------------------------------------------------
CREATE TABLE public.recipes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID    NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version    INT     NOT NULL DEFAULT 1,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (product_id, version)
);
COMMENT ON TABLE public.recipes IS 'Versioned recipe definitions for composed products.';

CREATE INDEX idx_recipes_product_id ON public.recipes(product_id);

CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.15 RECIPE ITEMS
-- --------------------------------------------------------------------------
CREATE TABLE public.recipe_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id         UUID          NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID          NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity          DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (recipe_id, inventory_item_id)
);
COMMENT ON TABLE public.recipe_items IS 'Ingredient lines within a recipe.';

CREATE INDEX idx_recipe_items_recipe_id ON public.recipe_items(recipe_id);
CREATE INDEX idx_recipe_items_inv_item  ON public.recipe_items(inventory_item_id);

CREATE TRIGGER trg_recipe_items_updated_at
  BEFORE UPDATE ON public.recipe_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.16 SUPPLIERS
-- --------------------------------------------------------------------------
CREATE TABLE public.suppliers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID         NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  contact_name    VARCHAR(255),
  email           VARCHAR(320),
  phone           VARCHAR(32),
  address         TEXT,
  notes           TEXT,
  is_active       BOOLEAN      NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.suppliers IS 'Vendor/supplier contacts shared across an organization.';

CREATE INDEX idx_suppliers_org_id ON public.suppliers(organization_id);

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.17 PURCHASE ORDERS
-- --------------------------------------------------------------------------
CREATE TABLE public.purchase_orders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID            NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  supplier_id UUID            NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status      purchase_status NOT NULL DEFAULT 'draft',
  total_cents INT             NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  ordered_at  TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes       TEXT,
  created_by  UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.purchase_orders IS 'Orders placed to suppliers for restocking inventory.';

CREATE INDEX idx_purchase_orders_location_id ON public.purchase_orders(location_id);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status      ON public.purchase_orders(status);

CREATE TRIGGER trg_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.18 PURCHASE ORDER ITEMS
-- --------------------------------------------------------------------------
CREATE TABLE public.purchase_order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID          NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID          NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  quantity_ordered  DECIMAL(12,3) NOT NULL CHECK (quantity_ordered > 0),
  quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  unit_cost_cents   INT           NOT NULL DEFAULT 0 CHECK (unit_cost_cents >= 0),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.purchase_order_items IS 'Line items within a purchase order.';

CREATE INDEX idx_po_items_po_id    ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_inv_item ON public.purchase_order_items(inventory_item_id);

CREATE TRIGGER trg_purchase_order_items_updated_at
  BEFORE UPDATE ON public.purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.19 EXTERNAL SETTLEMENTS (payments)
-- --------------------------------------------------------------------------
CREATE TABLE public.external_settlements (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id           UUID        NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  amount_cents       INT         NOT NULL CHECK (amount_cents > 0),
  method             VARCHAR(32) NOT NULL,
  external_reference VARCHAR(255),
  settled_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.external_settlements IS 'Payment records for orders (cash, card, etc.). Not a full payment gateway.';

CREATE INDEX idx_ext_settlements_order_id ON public.external_settlements(order_id);

CREATE TRIGGER trg_external_settlements_updated_at
  BEFORE UPDATE ON public.external_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- 3.20 AUDIT LOGS (append-only)
-- --------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action          VARCHAR(64) NOT NULL,
  entity_type     VARCHAR(64) NOT NULL,
  entity_id       UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      VARCHAR(45),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.audit_logs IS 'Tamper-resistant log of significant data changes for compliance.';

CREATE INDEX idx_audit_logs_org_id      ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor_id    ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity      ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at  ON public.audit_logs(created_at DESC);

-- --------------------------------------------------------------------------
-- 3.21 SUBSCRIPTIONS
-- --------------------------------------------------------------------------
CREATE TABLE public.subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id        UUID                NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan                   VARCHAR(64)         NOT NULL DEFAULT 'free',
  stripe_customer_id     VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status                 subscription_status NOT NULL DEFAULT 'trialing',
  trial_ends_at          TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ         NOT NULL DEFAULT now(),

  UNIQUE (organization_id)
);
COMMENT ON TABLE public.subscriptions IS 'Billing/subscription state per organization, synced with Stripe.';

CREATE INDEX idx_subscriptions_stripe_cust ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status      ON public.subscriptions(status);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE public.organizations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_tables        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions        ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- Helper: get all organization IDs the current user belongs to
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.memberships
  WHERE profile_id = auth.uid()
    AND status = 'active';
$$;

-- --------------------------------------------------------------------------
-- Helper: get all location IDs the current user can access
-- (owner/manager without location_id set → all locations in their org)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_location_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id
  FROM public.locations l
  INNER JOIN public.memberships m ON m.organization_id = l.organization_id
  WHERE m.profile_id = auth.uid()
    AND m.status = 'active'
    AND (m.location_id IS NULL OR m.location_id = l.id);
$$;

-- --------------------------------------------------------------------------
-- 4.1 PROFILES
-- --------------------------------------------------------------------------
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- --------------------------------------------------------------------------
-- 4.2 ORGANIZATIONS
-- --------------------------------------------------------------------------
CREATE POLICY org_select ON public.organizations
  FOR SELECT USING (id IN (SELECT public.user_org_ids()));

CREATE POLICY org_insert ON public.organizations
  FOR INSERT WITH CHECK (true);  -- anyone can create; membership enforces access later

CREATE POLICY org_update ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'manager')
    )
  );

-- --------------------------------------------------------------------------
-- 4.3 LOCATIONS
-- --------------------------------------------------------------------------
CREATE POLICY locations_select ON public.locations
  FOR SELECT USING (id IN (SELECT public.user_location_ids()));

CREATE POLICY locations_insert ON public.locations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY locations_update ON public.locations
  FOR UPDATE USING (
    id IN (SELECT public.user_location_ids())
    AND organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'manager')
    )
  );

-- --------------------------------------------------------------------------
-- 4.4 MEMBERSHIPS
-- --------------------------------------------------------------------------
CREATE POLICY memberships_select ON public.memberships
  FOR SELECT USING (
    organization_id IN (SELECT public.user_org_ids())
  );

CREATE POLICY memberships_insert ON public.memberships
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY memberships_update ON public.memberships
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'manager')
    )
  );

CREATE POLICY memberships_delete ON public.memberships
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role = 'owner'
    )
  );

-- --------------------------------------------------------------------------
-- 4.5 LOCATION-SCOPED TABLES (areas, dining_tables, categories, products,
--     orders, inventory, recipes, purchase_orders, settlements)
-- --------------------------------------------------------------------------

-- Macro-style: SELECT by location membership
-- AREAS
CREATE POLICY areas_select ON public.areas
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY areas_insert ON public.areas
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY areas_update ON public.areas
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY areas_delete ON public.areas
  FOR DELETE USING (location_id IN (SELECT public.user_location_ids()));

-- DINING TABLES
CREATE POLICY dining_tables_select ON public.dining_tables
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY dining_tables_insert ON public.dining_tables
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY dining_tables_update ON public.dining_tables
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY dining_tables_delete ON public.dining_tables
  FOR DELETE USING (location_id IN (SELECT public.user_location_ids()));

-- CATEGORIES
CREATE POLICY categories_select ON public.categories
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY categories_insert ON public.categories
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY categories_update ON public.categories
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY categories_delete ON public.categories
  FOR DELETE USING (location_id IN (SELECT public.user_location_ids()));

-- PRODUCTS
CREATE POLICY products_select ON public.products
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY products_insert ON public.products
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY products_update ON public.products
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY products_delete ON public.products
  FOR DELETE USING (location_id IN (SELECT public.user_location_ids()));

-- ORDERS
CREATE POLICY orders_select ON public.orders
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY orders_insert ON public.orders
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY orders_update ON public.orders
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));

-- ORDER ITEMS (through order → location)
CREATE POLICY order_items_select ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY order_items_insert ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY order_items_update ON public.order_items
  FOR UPDATE USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );

-- ORDER EVENTS (through order → location)
CREATE POLICY order_events_select ON public.order_events
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY order_events_insert ON public.order_events
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );

-- INVENTORY ITEMS
CREATE POLICY inventory_items_select ON public.inventory_items
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY inventory_items_insert ON public.inventory_items
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY inventory_items_update ON public.inventory_items
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY inventory_items_delete ON public.inventory_items
  FOR DELETE USING (location_id IN (SELECT public.user_location_ids()));

-- STOCK MOVEMENTS
CREATE POLICY stock_movements_select ON public.stock_movements
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY stock_movements_insert ON public.stock_movements
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));

-- RECIPES (through product → location)
CREATE POLICY recipes_select ON public.recipes
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY recipes_insert ON public.recipes
  FOR INSERT WITH CHECK (
    product_id IN (
      SELECT id FROM public.products
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY recipes_update ON public.recipes
  FOR UPDATE USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY recipes_delete ON public.recipes
  FOR DELETE USING (
    product_id IN (
      SELECT id FROM public.products
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );

-- RECIPE ITEMS (through recipe → product → location)
CREATE POLICY recipe_items_select ON public.recipe_items
  FOR SELECT USING (
    recipe_id IN (
      SELECT r.id FROM public.recipes r
      INNER JOIN public.products p ON p.id = r.product_id
      WHERE p.location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY recipe_items_insert ON public.recipe_items
  FOR INSERT WITH CHECK (
    recipe_id IN (
      SELECT r.id FROM public.recipes r
      INNER JOIN public.products p ON p.id = r.product_id
      WHERE p.location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY recipe_items_update ON public.recipe_items
  FOR UPDATE USING (
    recipe_id IN (
      SELECT r.id FROM public.recipes r
      INNER JOIN public.products p ON p.id = r.product_id
      WHERE p.location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY recipe_items_delete ON public.recipe_items
  FOR DELETE USING (
    recipe_id IN (
      SELECT r.id FROM public.recipes r
      INNER JOIN public.products p ON p.id = r.product_id
      WHERE p.location_id IN (SELECT public.user_location_ids())
    )
  );

-- PURCHASE ORDERS
CREATE POLICY purchase_orders_select ON public.purchase_orders
  FOR SELECT USING (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY purchase_orders_insert ON public.purchase_orders
  FOR INSERT WITH CHECK (location_id IN (SELECT public.user_location_ids()));
CREATE POLICY purchase_orders_update ON public.purchase_orders
  FOR UPDATE USING (location_id IN (SELECT public.user_location_ids()));

-- PURCHASE ORDER ITEMS (through PO → location)
CREATE POLICY po_items_select ON public.purchase_order_items
  FOR SELECT USING (
    purchase_order_id IN (
      SELECT id FROM public.purchase_orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY po_items_insert ON public.purchase_order_items
  FOR INSERT WITH CHECK (
    purchase_order_id IN (
      SELECT id FROM public.purchase_orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY po_items_update ON public.purchase_order_items
  FOR UPDATE USING (
    purchase_order_id IN (
      SELECT id FROM public.purchase_orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );

-- EXTERNAL SETTLEMENTS (through order → location)
CREATE POLICY settlements_select ON public.external_settlements
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );
CREATE POLICY settlements_insert ON public.external_settlements
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders
      WHERE location_id IN (SELECT public.user_location_ids())
    )
  );

-- --------------------------------------------------------------------------
-- 4.6 ORGANIZATION-SCOPED TABLES (suppliers, audit_logs, subscriptions)
-- --------------------------------------------------------------------------

-- SUPPLIERS
CREATE POLICY suppliers_select ON public.suppliers
  FOR SELECT USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY suppliers_insert ON public.suppliers
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY suppliers_update ON public.suppliers
  FOR UPDATE USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY suppliers_delete ON public.suppliers
  FOR DELETE USING (organization_id IN (SELECT public.user_org_ids()));

-- AUDIT LOGS (read-only for members)
CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.user_org_ids()));

-- SUBSCRIPTIONS
CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT USING (organization_id IN (SELECT public.user_org_ids()));
CREATE POLICY subscriptions_update ON public.subscriptions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE profile_id = auth.uid()
        AND status = 'active'
        AND role = 'owner'
    )
  );

-- ============================================================================
-- 5. REALTIME (enable for order-related tables)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
