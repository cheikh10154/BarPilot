-- ============================================================================
-- BarPilot Super Admin Enterprise Database Schema for Supabase
-- Versione Ufficiale Conforme alle Specifiche:
-- Tabella 1 — bars
-- Tabella 2 — bar_members
-- Tabella 3 — subscriptions
-- Tabella 4 — subscription_plans
-- Tabella 5 — invoices
-- Tabella 6 — payments
-- Tabella 7 — support_tickets
-- Tabella 8 — support_messages
-- Tabella 9 — admin_settings
-- Tabella 10 — admin_audit_logs
-- Tabella 11 — webhook_events
-- Vista: admin_overview_live
--
-- Esegui questo script completo nell'editor SQL di Supabase:
-- https://supabase.com/dashboard/project/cprxxxlgaofopmogeuer/sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABELLA: subscription_plans
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 59.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  billing_interval TEXT NOT NULL DEFAULT 'month',
  stripe_price_id TEXT,
  trial_days INT NOT NULL DEFAULT 14,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subscription_plans (id, name, description, price, currency, billing_interval, trial_days, active)
VALUES (
  'plan_barpilot_pro',
  'BarPilot Pro',
  'Piano professionale completo: comande, KDS cucina, sala, magazzino e pagamenti digitali',
  59.00,
  'EUR',
  'month',
  14,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  trial_days = EXCLUDED.trial_days;

-- ----------------------------------------------------------------------------
-- 2. TABELLA: bars
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY DEFAULT ('bar_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  business_name TEXT,
  vat_number TEXT,
  tax_code TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'IT',
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'trial', -- trial, active, past_due, suspended, cancelled
  subscription_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'IT';
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ----------------------------------------------------------------------------
-- 3. TABELLA: bar_members
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bar_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id TEXT NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- owner, manager, waiter, bartender, cashier
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bar_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. TABELLA: subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  bar_id TEXT NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, unpaid, canceled, incomplete, paused
  trial_start TIMESTAMPTZ DEFAULT now(),
  trial_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'Stripe / Carta',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days');
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 5. TABELLA: invoices
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY DEFAULT ('inv_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  invoice_number TEXT NOT NULL,
  amount_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  amount_total NUMERIC(10,2) NOT NULL DEFAULT 59.00,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'open', -- draft, open, paid, void, uncollectible
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_subtotal NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_tax NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_total NUMERIC(10,2) DEFAULT 59.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;

-- ----------------------------------------------------------------------------
-- 6. TABELLA: payments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_id TEXT REFERENCES public.invoices(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'succeeded', -- pending, succeeded, failed, refunded, partially_refunded
  payment_method_type TEXT NOT NULL DEFAULT 'card',
  paid_at TIMESTAMPTZ DEFAULT now(),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method_type TEXT DEFAULT 'card';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- ----------------------------------------------------------------------------
-- 7. TABELLA: support_tickets
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY DEFAULT ('tkt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'KDS Banco',
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, waiting_customer, resolved, closed
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 8. TABELLA: support_messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. TABELLA: admin_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT ('set_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by TEXT DEFAULT 'Cheikh Gueye',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.admin_settings (id, setting_key, setting_value, updated_by)
VALUES
  ('set_01', 'platform_name', 'BarPilot', 'Cheikh Gueye'),
  ('set_02', 'support_email', 'admin@barpilot.eu', 'Cheikh Gueye'),
  ('set_03', 'trial_days', '14', 'Cheikh Gueye'),
  ('set_04', 'default_plan', 'BarPilot Pro', 'Cheikh Gueye'),
  ('set_05', 'default_price', '59.00', 'Cheikh Gueye'),
  ('set_06', 'currency', 'EUR', 'Cheikh Gueye'),
  ('set_07', 'timezone', 'Europe/Rome', 'Cheikh Gueye'),
  ('set_08', 'maintenance_mode', 'false', 'Cheikh Gueye'),
  ('set_09', 'admin_notifications', 'true', 'Cheikh Gueye'),
  ('set_10', 'require_card_upfront', 'false', 'Cheikh Gueye'),
  ('set_11', 'company_name', 'BarPilot · Gestionale per Bar & Ristoranti', 'Cheikh Gueye'),
  ('set_12', 'company_piva', '02799820036', 'Cheikh Gueye'),
  ('set_13', 'billing_email', 'admin@barpilot.eu', 'Cheikh Gueye'),
  ('set_14', 'company_website', 'www.barpilot.eu', 'Cheikh Gueye')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 10. TABELLA: admin_audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('log_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  admin_id TEXT DEFAULT 'cheikh_superadmin',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 11. TABELLA: webhook_events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id TEXT PRIMARY KEY DEFAULT ('evt_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  provider TEXT NOT NULL DEFAULT 'stripe',
  external_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received', -- received, processed, failed, ignored
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- ----------------------------------------------------------------------------
-- LIVE METRICS VIEW PER SUPER ADMIN
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.admin_overview_live AS
SELECT
  (SELECT count(*)::int FROM public.bars) AS total_bars,
  (SELECT count(*)::int FROM public.bars WHERE status = 'trial') AS trial_bars,
  (SELECT count(*)::int FROM public.bars WHERE status = 'active') AS active_bars,
  (SELECT count(*)::int FROM public.bars WHERE status = 'past_due') AS past_due_bars,
  (SELECT count(*)::int FROM public.bars WHERE status = 'suspended') AS suspended_bars,
  (SELECT count(*)::int FROM public.bars WHERE status = 'cancelled') AS cancelled_bars,
  (SELECT count(*)::int FROM public.subscriptions WHERE status = 'active') AS active_subscriptions,
  COALESCE(
    (SELECT sum(p.price)::numeric(10,2)
     FROM public.subscriptions s
     JOIN public.subscription_plans p ON s.plan_id = p.id
     WHERE s.status = 'active'),
    0.00
  ) AS mrr,
  COALESCE(
    (SELECT sum(p.price * 12)::numeric(10,2)
     FROM public.subscriptions s
     JOIN public.subscription_plans p ON s.plan_id = p.id
     WHERE s.status = 'active'),
    0.00
  ) AS arr,
  COALESCE(
    (SELECT sum(amount)::numeric(10,2)
     FROM public.payments
     WHERE status = 'succeeded'),
    0.00
  ) AS total_collected,
  (SELECT count(*)::int FROM public.payments WHERE status = 'failed') AS failed_payments_count,
  (SELECT count(*)::int FROM public.support_tickets WHERE status IN ('open', 'in_progress', 'waiting_customer')) AS open_tickets_count;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'subscription_plans',
    'bars',
    'bar_members',
    'subscriptions',
    'invoices',
    'payments',
    'support_tickets',
    'support_messages',
    'admin_settings',
    'admin_audit_logs',
    'webhook_events'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public select on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public select on %I" ON public.%I FOR SELECT USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Public insert on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public insert on %I" ON public.%I FOR INSERT WITH CHECK (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Public update on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public update on %I" ON public.%I FOR UPDATE USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Public delete on %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public delete on %I" ON public.%I FOR DELETE USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- SEED INIZIALE REALE DI ESEMPIO (Garantisce che il Super Admin veda subito i dati)
-- ----------------------------------------------------------------------------
INSERT INTO public.bars (id, name, business_name, vat_number, email, phone, city, address, status)
VALUES
  ('bar_centrale_01', 'Bar Centrale', 'Bar Centrale S.r.l.', 'IT09876543210', 'marco@barcentrale.it', '+39 02 87654321', 'Milano', 'Via Roma 123', 'active'),
  ('bar_porto_02', 'Caffè del Porto', 'Porto Cafè D.I.', 'IT01234567890', 'giulia@caffedelporto.it', '+39 010 3344556', 'Genova', 'Calata Molo Vecchio 4', 'active'),
  ('bar_dolce_03', 'La Dolce Vita', 'Dolce Vita Bar SAS', 'IT04567891234', 'alessandro@ladolcevita.it', '+39 081 7766554', 'Napoli', 'Piazza Plebiscito 12', 'trial'),
  ('bar_moderno_04', 'Bar Moderno', 'Moderno Bistrot Snc', 'IT07891234567', 'sara@barmoderno.it', '+39 051 9988776', 'Bologna', 'Via Indipendenza 45', 'past_due')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

INSERT INTO public.subscriptions (id, bar_id, plan_id, status, trial_start, trial_end, current_period_end)
VALUES
  ('sub_01', 'bar_centrale_01', 'plan_barpilot_pro', 'active', now() - INTERVAL '30 days', now() - INTERVAL '16 days', now() + INTERVAL '14 days'),
  ('sub_02', 'bar_porto_02', 'plan_barpilot_pro', 'active', now() - INTERVAL '20 days', now() - INTERVAL '6 days', now() + INTERVAL '24 days'),
  ('sub_03', 'bar_dolce_03', 'plan_barpilot_pro', 'trialing', now() - INTERVAL '4 days', now() + INTERVAL '10 days', now() + INTERVAL '10 days'),
  ('sub_04', 'bar_moderno_04', 'plan_barpilot_pro', 'past_due', now() - INTERVAL '45 days', now() - INTERVAL '31 days', now() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.invoices (id, bar_id, subscription_id, invoice_number, amount_total, amount_paid, status, invoice_date)
VALUES
  ('inv_01', 'bar_centrale_01', 'sub_01', '#2026-0001', 59.00, 59.00, 'paid', now() - INTERVAL '16 days'),
  ('inv_02', 'bar_porto_02', 'sub_02', '#2026-0002', 59.00, 59.00, 'paid', now() - INTERVAL '6 days'),
  ('inv_03', 'bar_moderno_04', 'sub_04', '#2026-0003', 59.00, 0.00, 'open', now() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.payments (id, bar_id, subscription_id, invoice_id, amount, currency, status, payment_method_type)
VALUES
  ('pay_01', 'bar_centrale_01', 'sub_01', 'inv_01', 59.00, 'EUR', 'succeeded', 'card'),
  ('pay_02', 'bar_porto_02', 'sub_02', 'inv_02', 59.00, 'EUR', 'succeeded', 'google_pay'),
  ('pay_03', 'bar_moderno_04', 'sub_04', 'inv_03', 59.00, 'EUR', 'failed', 'card')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.support_tickets (id, bar_id, subject, description, category, priority, status)
VALUES
  ('tkt_01', 'bar_centrale_01', 'Configurazione stampante KDS cucina', 'Vorremmo affiancare un secondo tablet per il forno pizze', 'KDS Banco', 'medium', 'resolved'),
  ('tkt_02', 'bar_moderno_04', 'Aggiornamento carta di credito aziendale', 'Abbiamo sostituito la carta di debito aziendale, come aggiorniamo il pagamento?', 'Pagamenti', 'high', 'open'),
  ('tkt_03', 'bar_dolce_03', 'Personalizzazione comande aperitivi', 'Come raggruppare cocktail alcolici e analcolici nei filtri?', 'Software', 'low', 'in_progress')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Realtime Publication
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bars; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
