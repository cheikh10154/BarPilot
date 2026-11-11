-- ==============================================================================
-- Migration 006: Sistema Automatico di Affiliazione BarPilot (+5,00 € & Realtime)
-- Usa esclusivamente le tabelle esistenti:
--   public.affiliates, public.affiliate_referrals, public.affiliate_commissions,
--   public.bars, public.subscriptions, public.admin_settings, public.admin_audit_logs
-- ==============================================================================

-- 1. AGGIORNAMENTO COLONNE SU TABELLE ESISTENTI (nessun duplicato)
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS available_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payout_method JSONB;

ALTER TABLE public.affiliates
  ALTER COLUMN commission_rate SET DEFAULT 5.00;

ALTER TABLE public.affiliate_referrals
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_bar_id TEXT,
  ADD COLUMN IF NOT EXISTS referred_bar_name TEXT,
  ADD COLUMN IF NOT EXISTS referred_user_id TEXT,
  ADD COLUMN IF NOT EXISTS referred_email TEXT,
  ADD COLUMN IF NOT EXISTS referred_vat TEXT,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bonus_amount NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS fraud_flag BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fraud_reason TEXT,
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.affiliate_commissions
  ADD COLUMN IF NOT EXISTS affiliate_code TEXT,
  ADD COLUMN IF NOT EXISTS bonus_type TEXT NOT NULL DEFAULT 'registration',
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bars') THEN
    ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
    ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS invite_code TEXT;
    ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS referred_by_affiliate_id TEXT;
  END IF;
END $$;

-- 2. VINCOLI UNIVOCI ANTI-DUPLICATO E ANTI-FRODE
CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliates_code_upper
  ON public.affiliates (upper(code));

CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_referrals_referred_bar
  ON public.affiliate_referrals (referred_bar_id)
  WHERE referred_bar_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_referrals_referred_email
  ON public.affiliate_referrals (lower(referred_email))
  WHERE referred_email IS NOT NULL AND referred_email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_commissions_reg_referral
  ON public.affiliate_commissions (referral_id, bonus_type)
  WHERE referral_id IS NOT NULL AND bonus_type = 'registration';

CREATE UNIQUE INDEX IF NOT EXISTS uq_affiliate_commissions_reg_bar
  ON public.affiliate_commissions (bar_id, bonus_type)
  WHERE bar_id IS NOT NULL AND bonus_type = 'registration';

-- Imposta bonus registrazione predefinito = 5.00 EUR in admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, updated_by)
VALUES ('affiliate_registration_bonus', '5.00', 'Super Admin')
ON CONFLICT (setting_key) DO NOTHING;

-- 3. FUNZIONE DI RICALCOLO SICURO SALDI DA COMMISSIONI REALI
CREATE OR REPLACE FUNCTION public.recalculate_affiliate_balances(p_affiliate_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available NUMERIC(10,2) := 0.00;
  v_pending NUMERIC(10,2) := 0.00;
  v_paid NUMERIC(10,2) := 0.00;
  v_earned NUMERIC(10,2) := 0.00;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN status IN ('available', 'pending', 'paid') THEN amount ELSE 0 END), 0.00)
  INTO v_available, v_pending, v_paid, v_earned
  FROM public.affiliate_commissions
  WHERE affiliate_id = p_affiliate_id;

  UPDATE public.affiliates
  SET
    available_balance = v_available,
    pending_balance = v_pending,
    total_earned = v_earned,
    updated_at = now()
  WHERE id = p_affiliate_id;

  RETURN jsonb_build_object(
    'available_balance', v_available,
    'pending_balance', v_pending,
    'paid_balance', v_paid,
    'total_earned', v_earned
  );
END;
$$;

-- 4. VERIFICA PUBBLICA SICURA CODICE PARTNER (6 CARATTERI)
CREATE OR REPLACE FUNCTION public.verify_affiliate_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_code TEXT := upper(trim(COALESCE(p_code, '')));
  v_aff RECORD;
BEGIN
  IF length(v_clean_code) < 4 THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Inserisci un codice valido.');
  END IF;

  SELECT id, code, status, name
  INTO v_aff
  FROM public.affiliates
  WHERE upper(code) = v_clean_code
    AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'code', v_clean_code, 'message', 'Codice partner inesistente o non attivo.');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_aff.code,
    'affiliate_id', v_aff.id,
    'message', 'Codice partner valido (+14 giorni prova inclusi).'
  );
END;
$$;

-- 5. TRANSAZIONE ATOMICA E IDEMPOTENTE: REGISTRAZIONE BAR + BONUS +5,00 € + PROVA (+1)
CREATE OR REPLACE FUNCTION public.process_affiliate_registration_bonus(
  p_affiliate_code TEXT,
  p_bar_id TEXT,
  p_bar_name TEXT,
  p_user_id TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT '',
  p_vat TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := upper(trim(COALESCE(p_affiliate_code, '')));
  v_email TEXT := lower(trim(COALESCE(p_email, '')));
  v_phone TEXT := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_vat TEXT := upper(regexp_replace(COALESCE(p_vat, ''), '\s+', '', 'g'));
  v_aff RECORD;
  v_existing_ref_id TEXT;
  v_referral_id TEXT;
  v_comm_id TEXT;
  v_trial_start TIMESTAMPTZ := now();
  v_trial_end TIMESTAMPTZ := now() + interval '14 days';
  v_bonus NUMERIC(10,2) := 5.00;
  v_balances JSONB;
BEGIN
  IF v_code = '' OR p_bar_id IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'missing_params', 'bonus_credited', 0.00);
  END IF;

  -- Lock sull'affiliato per serializzare accreditamenti concorrenti
  SELECT * INTO v_aff
  FROM public.affiliates
  WHERE upper(code) = v_code AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_code', 'bonus_credited', 0.00);
  END IF;

  -- Controllo anti auto-affiliazione (email, user_id o telefono uguale)
  IF lower(COALESCE(v_aff.email, '')) = v_email
     OR (p_user_id IS NOT NULL AND p_user_id <> '' AND COALESCE(v_aff.user_id, '') = p_user_id)
     OR (v_phone <> '' AND regexp_replace(COALESCE(v_aff.phone, ''), '\D', '', 'g') = v_phone) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'self_affiliation', 'bonus_credited', 0.00);
  END IF;

  -- Controllo idempotenza: già referenziato per bar_id o email o P.IVA
  SELECT id INTO v_existing_ref_id
  FROM public.affiliate_referrals
  WHERE referred_bar_id = p_bar_id
     OR lower(referred_email) = v_email
     OR (v_vat <> '' AND upper(regexp_replace(COALESCE(referred_vat, ''), '\s+', '', 'g')) = v_vat)
  LIMIT 1;

  IF v_existing_ref_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_credited', true,
      'reason', 'already_referred',
      'referral_id', v_existing_ref_id,
      'bonus_credited', 0.00
    );
  END IF;

  -- Bonus fisso configurato (default 5.00 EUR)
  SELECT COALESCE(NULLIF(setting_value, '')::NUMERIC(10,2), 5.00) INTO v_bonus
  FROM public.admin_settings
  WHERE setting_key = 'affiliate_registration_bonus'
  LIMIT 1;
  IF v_bonus IS NULL OR v_bonus <= 0 THEN
    v_bonus := 5.00;
  END IF;

  v_referral_id := 'ref_' || substr(md5(p_bar_id || v_email || clock_timestamp()::text), 1, 16);
  v_comm_id := 'comm_' || substr(md5(v_referral_id || v_aff.id || clock_timestamp()::text), 1, 16);

  INSERT INTO public.affiliate_referrals (
    id, affiliate_id, affiliate_code, referred_bar_id, referred_bar_name,
    referred_user_id, referred_email, referred_vat, status,
    trial_start_date, trial_end_date, cancel_at_period_end, bonus_amount,
    registered_at, created_at, updated_at
  ) VALUES (
    v_referral_id, v_aff.id, v_aff.code, p_bar_id, COALESCE(NULLIF(trim(p_bar_name), ''), 'Nuovo Bar'),
    p_user_id, v_email, NULLIF(v_vat, ''), 'trial',
    v_trial_start, v_trial_end, false, v_bonus,
    v_trial_start, v_trial_start, v_trial_start
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO public.affiliate_commissions (
    id, affiliate_id, affiliate_code, referral_id, bar_id, bar_name,
    bonus_type, amount, currency, status, available_at, trial_end_date,
    notes, created_at, updated_at
  ) VALUES (
    v_comm_id, v_aff.id, v_aff.code, v_referral_id, p_bar_id, COALESCE(NULLIF(trim(p_bar_name), ''), 'Nuovo Bar'),
    'registration', v_bonus, 'EUR', 'available', v_trial_start, v_trial_end,
    'Bonus registrazione +5,00 € (Prova gratuita 14 giorni avviata)', v_trial_start, v_trial_start
  )
  ON CONFLICT DO NOTHING;

  v_balances := public.recalculate_affiliate_balances(v_aff.id);

  RETURN jsonb_build_object(
    'success', true,
    'already_credited', false,
    'referral_id', v_referral_id,
    'commission_id', v_comm_id,
    'affiliate_id', v_aff.id,
    'affiliate_code', v_aff.code,
    'bonus_credited', v_bonus,
    'trial_start_date', v_trial_start,
    'trial_end_date', v_trial_end,
    'balances', v_balances
  );
END;
$$;

-- 6. AGGIORNAMENTO AUTOMATICO STATI PROVA / ATTIVO / SCADUTO / CANCELLATO
CREATE OR REPLACE FUNCTION public.sync_affiliate_trial_lifecycle()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  -- Se il bar è passato a pagamento attivo -> 'active'
  UPDATE public.affiliate_referrals r
  SET status = 'active', updated_at = now()
  FROM public.bars b
  WHERE r.referred_bar_id = b.id
    AND r.status IN ('trial', 'registered')
    AND r.fraud_flag = false
    AND (lower(COALESCE(b.status, '')) = 'active' OR lower(COALESCE(b.subscription_status, '')) = 'active')
    AND COALESCE(r.cancel_at_period_end, false) = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Se prova scaduta (>= 14 giorni) e disdetta richiesta durante la prova -> 'cancelled'
  UPDATE public.affiliate_referrals
  SET status = 'cancelled', updated_at = now()
  WHERE status IN ('trial', 'registered')
    AND trial_end_date IS NOT NULL
    AND now() >= trial_end_date
    AND (cancel_at_period_end = true OR cancelled_at IS NOT NULL);

  -- Se prova scaduta (>= 14 giorni) senza pagamento attivo -> 'expired'
  UPDATE public.affiliate_referrals
  SET status = 'expired', updated_at = now()
  WHERE status IN ('trial', 'registered')
    AND trial_end_date IS NOT NULL
    AND now() >= trial_end_date
    AND cancel_at_period_end = false
    AND cancelled_at IS NULL;

  RETURN v_updated;
END;
$$;

-- 7. SICUREZZA RLS RIGOROSA (Protezione contro modifiche saldo dal browser)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates can view own affiliate record" ON public.affiliates;
CREATE POLICY "Affiliates can view own affiliate record" ON public.affiliates
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id OR lower(auth.jwt()->>'email') = lower(email));

DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.affiliate_referrals;
CREATE POLICY "Affiliates can view own referrals" ON public.affiliate_referrals
  FOR SELECT TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()::text OR lower(email) = lower(auth.jwt()->>'email')
  ));

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()::text OR lower(email) = lower(auth.jwt()->>'email')
  ));

-- Revoca scritture dirette da browser su commissioni/saldi (solo RPC SECURITY DEFINER o service_role)
REVOKE INSERT, UPDATE, DELETE ON public.affiliate_commissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.affiliate_referrals FROM anon, authenticated;
REVOKE DELETE ON public.affiliates FROM anon, authenticated;

GRANT SELECT ON public.affiliates TO authenticated;
GRANT SELECT ON public.affiliate_referrals TO authenticated;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_affiliate_code(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_affiliate_registration_bonus(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_affiliate_balances(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_affiliate_trial_lifecycle() TO anon, authenticated, service_role;

-- 8. SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliates; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_referrals; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bars') THEN
      BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bars; EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
  END IF;
END $$;
