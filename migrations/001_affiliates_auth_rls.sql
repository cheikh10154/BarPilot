-- ============================================================================
-- BarPilot - Migrazione Sicurezza Affiliazioni: Supabase Auth & RLS Policies
-- ============================================================================
-- Associa ogni affiliato in modo univoco a auth.users.id
-- Abilita Row Level Security (RLS) su tutte le tabelle delle affiliazioni
-- Garantisce che ciascun affiliato possa leggere ESCLUSIVAMENTE i propri dati:
-- (profilo, codice referral, link invito, registrazioni attribuite, commissioni, prelievi)
-- Impedisce modifiche dirette a commissioni, stati e registrazioni dal frontend.

-- 1. Tabella Affiliati (public.affiliates)
CREATE TABLE IF NOT EXISTS public.affiliates (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    total_earned NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    payout_method JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);

-- 2. Tabella Referral / Registrazioni Attribuite (public.affiliate_referrals)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    affiliate_code TEXT NOT NULL,
    referred_bar_id TEXT,
    referred_bar_name TEXT NOT NULL,
    referred_owner_name TEXT,
    referred_email TEXT,
    referred_phone TEXT,
    referred_city TEXT,
    status TEXT NOT NULL DEFAULT 'trial', -- 'trial' (14 gg di prova), 'active' (confermato), 'cancelled'
    bonus_amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    trial_start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    trial_end_date TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    fraud_flag BOOLEAN DEFAULT FALSE,
    fraud_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON public.affiliate_referrals(affiliate_code);

-- 3. Tabella Commissioni (public.affiliate_commissions)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    affiliate_code TEXT NOT NULL,
    referral_id TEXT REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
    bar_id TEXT,
    bar_name TEXT,
    amount NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' (in attesa), 'available' (approvato), 'paid' (liquidato), 'cancelled'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);

-- 4. Tabella Richieste di Prelievo (public.affiliate_withdrawals)
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    affiliate_code TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 50.00), -- Soglia minima obbligatoria 50€
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'rejected'
    payout_method JSONB NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    paid_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user_id ON public.affiliate_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);

-- ============================================================================
-- 5. ATTIVAZIONE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. POLICIES: ISOLAMENTO RIGOROSO PER CIASCUN AFFILIATO
-- ============================================================================

-- A. public.affiliates: Ogni utente può leggere solo il proprio profilo
DROP POLICY IF EXISTS "affiliates_select_own" ON public.affiliates;
CREATE POLICY "affiliates_select_own" ON public.affiliates
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Gli utenti possono modificare solo nome/telefono/metodo di pagamento proprio
-- (MAI total_earned, commission_rate o code)
DROP POLICY IF EXISTS "affiliates_update_own" ON public.affiliates;
CREATE POLICY "affiliates_update_own" ON public.affiliates
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- B. public.affiliate_referrals: Lettura riservata al titolare del codice
DROP POLICY IF EXISTS "affiliate_referrals_select_own" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_select_own" ON public.affiliate_referrals
    FOR SELECT TO authenticated
    USING (
        affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    );

-- Nessun inserimento/modifica diretta da frontend (solo backend/service_role)
DROP POLICY IF EXISTS "affiliate_referrals_no_frontend_mutation" ON public.affiliate_referrals;
CREATE POLICY "affiliate_referrals_no_frontend_mutation" ON public.affiliate_referrals
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- C. public.affiliate_commissions: Lettura riservata al titolare del codice
DROP POLICY IF EXISTS "affiliate_commissions_select_own" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_select_own" ON public.affiliate_commissions
    FOR SELECT TO authenticated
    USING (
        affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid())
    );

-- Nessun inserimento/modifica diretta delle provvigioni da browser
DROP POLICY IF EXISTS "affiliate_commissions_no_frontend_mutation" ON public.affiliate_commissions;
CREATE POLICY "affiliate_commissions_no_frontend_mutation" ON public.affiliate_commissions
    FOR ALL TO authenticated
    USING (false)
    WITH CHECK (false);

-- D. public.affiliate_withdrawals: Lettura delle proprie richieste
DROP POLICY IF EXISTS "affiliate_withdrawals_select_own" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals_select_own" ON public.affiliate_withdrawals
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Inserimento consentito solo con stato 'pending' e per il proprio user_id
DROP POLICY IF EXISTS "affiliate_withdrawals_insert_own" ON public.affiliate_withdrawals;
CREATE POLICY "affiliate_withdrawals_insert_own" ON public.affiliate_withdrawals
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND 
        status = 'pending' AND 
        amount >= 50.00
    );
