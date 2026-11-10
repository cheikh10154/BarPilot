-- ==============================================================================
-- Migration 005: Sistema Affiliazioni Completo BarPilot
-- Tabelle: affiliates, affiliate_referrals, affiliate_commissions, admin_settings
-- ==============================================================================

-- 1. TABELLA: affiliates
CREATE TABLE IF NOT EXISTS public.affiliates (
  id TEXT PRIMARY KEY DEFAULT ('aff_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  user_id TEXT,
  bar_id TEXT,
  name TEXT,
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
  commission_rate NUMERIC(5,2) DEFAULT NULL, -- Se NULL eredita la percentuale globale
  total_earned NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_bar_id ON public.affiliates(bar_id);

-- 2. TABELLA: affiliate_referrals
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  affiliate_id TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  referred_bar_id TEXT,
  referred_bar_name TEXT,
  referred_user_id TEXT,
  referred_email TEXT,
  status TEXT NOT NULL DEFAULT 'registered', -- 'registered', 'active', 'cancelled'
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_bar ON public.affiliate_referrals(referred_bar_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_code ON public.affiliate_referrals(affiliate_code);

-- 3. TABELLA: affiliate_commissions
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id TEXT PRIMARY KEY DEFAULT ('comm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  affiliate_id TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id TEXT REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  bar_id TEXT,
  bar_name TEXT,
  stripe_event_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'available', 'paid', 'cancelled'
  available_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_stripe_invoice ON public.affiliate_commissions(stripe_invoice_id);

-- 4. IMPOSTAZIONI GLOBALI SUPER ADMIN: percentuale commissioni
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT ('set_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by TEXT DEFAULT 'Super Admin',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.admin_settings (setting_key, setting_value, updated_by)
VALUES ('affiliate_commission_rate', '20.00', 'Super Admin')
ON CONFLICT (setting_key) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Policy di lettura per l'affiliato autenticato (vede solo i propri dati)
DROP POLICY IF EXISTS "Affiliates can view own affiliate record" ON public.affiliates;
CREATE POLICY "Affiliates can view own affiliate record" ON public.affiliates
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.jwt()->>'email' = email);

DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliates can view own referrals" ON public.affiliate_referrals
  FOR SELECT
  USING (affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()::text OR email = auth.jwt()->>'email'
  ));

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT
  USING (affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()::text OR email = auth.jwt()->>'email'
  ));

-- Service role bypass per API backend
DROP POLICY IF EXISTS "Service role full access on affiliates" ON public.affiliates;
CREATE POLICY "Service role full access on affiliates" ON public.affiliates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on affiliate_referrals" ON public.affiliate_referrals;
CREATE POLICY "Service role full access on affiliate_referrals" ON public.affiliate_referrals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on affiliate_commissions" ON public.affiliate_commissions;
CREATE POLICY "Service role full access on affiliate_commissions" ON public.affiliate_commissions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Permessi per anon e authenticated
GRANT SELECT, INSERT, UPDATE ON public.affiliates TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.affiliate_referrals TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.affiliate_commissions TO anon, authenticated, service_role;
