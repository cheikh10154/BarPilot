-- ============================================================================
-- BarPilot Super Admin Enterprise Complete Database Schema
-- Integrazione completa tra Applicazione, Super Amministrazione, Supabase e Stripe
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
  invite_code TEXT,
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
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS invite_code TEXT;
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
  cancellation_reason TEXT,
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
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Stripe / Carta';

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
  response TEXT,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 8. TABELLA: support_messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ----------------------------------------------------------------------------
-- 9. TABELLA: admin_notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, danger
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 10. TABELLA: promo_codes & promo_redemptions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id TEXT PRIMARY KEY DEFAULT ('prm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_percent NUMERIC(5,2) DEFAULT 0.00,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  max_uses INT DEFAULT 1000,
  current_uses INT DEFAULT 0,
  partner_name TEXT,
  partner_email TEXT,
  commission_percent NUMERIC(5,2) DEFAULT 10.00,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id TEXT PRIMARY KEY DEFAULT ('red_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  promo_code_id TEXT REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10,2) DEFAULT 0.00,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 11. TABELLA: affiliates & affiliate_referrals
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliates (
  id TEXT PRIMARY KEY DEFAULT ('aff_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(5,2) DEFAULT 15.00,
  total_earnings NUMERIC(10,2) DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  affiliate_id TEXT REFERENCES public.affiliates(id) ON DELETE CASCADE,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  commission_amount NUMERIC(10,2) DEFAULT 8.85,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 12. TABELLA: admin_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT ('set_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by TEXT DEFAULT 'Cheikh Gueye',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 13. TABELLA: admin_audit_logs
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
-- 14. TABELLA: webhook_events
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
-- 15. ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
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
    'admin_notifications',
    'promo_codes',
    'promo_redemptions',
    'affiliates',
    'affiliate_referrals',
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
-- 16. REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bars; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.promo_codes; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_settings; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
