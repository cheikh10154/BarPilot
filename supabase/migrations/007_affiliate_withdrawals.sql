-- ==============================================================================
-- Migration 007: Sistema di Prelievo Affiliazioni BarPilot
-- Tabella: public.affiliate_withdrawals + Transazioni sicure + RLS + Realtime
-- ==============================================================================

-- 1. TABELLA: affiliate_withdrawals
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id TEXT PRIMARY KEY DEFAULT ('wd_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16)),
  affiliate_id TEXT NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id TEXT,
  affiliate_first_name TEXT,
  affiliate_last_name TEXT,
  affiliate_email TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'rejected')),
  payment_method_reference TEXT NOT NULL,
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_user_id ON public.affiliate_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON public.affiliate_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_requested_at ON public.affiliate_withdrawals(requested_at DESC);

-- 2. AGGIORNA RICALCOLO SALDO TENENDO CONTO DEI PRELIEVI RISERVATI / PAGATI
CREATE OR REPLACE FUNCTION public.recalculate_affiliate_balances(p_affiliate_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_comm_available NUMERIC(10,2) := 0.00;
  v_pending NUMERIC(10,2) := 0.00;
  v_paid_comm NUMERIC(10,2) := 0.00;
  v_earned NUMERIC(10,2) := 0.00;
  v_reserved_withdrawals NUMERIC(10,2) := 0.00;
  v_net_available NUMERIC(10,2) := 0.00;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0.00),
    COALESCE(SUM(CASE WHEN status IN ('available', 'pending', 'paid') THEN amount ELSE 0 END), 0.00)
  INTO v_comm_available, v_pending, v_paid_comm, v_earned
  FROM public.affiliate_commissions
  WHERE affiliate_id = p_affiliate_id;

  -- Somma tutti i prelievi non rifiutati (pending, approved, processing, paid)
  SELECT COALESCE(SUM(amount), 0.00)
  INTO v_reserved_withdrawals
  FROM public.affiliate_withdrawals
  WHERE affiliate_id = p_affiliate_id
    AND status IN ('pending', 'approved', 'processing', 'paid');

  v_net_available := GREATEST(0.00, v_comm_available - v_reserved_withdrawals);

  UPDATE public.affiliates
  SET
    available_balance = v_net_available,
    pending_balance = v_pending,
    total_earned = v_earned,
    updated_at = now()
  WHERE id = p_affiliate_id;

  RETURN jsonb_build_object(
    'available_balance', v_net_available,
    'pending_balance', v_pending,
    'paid_balance', v_paid_comm,
    'total_earned', v_earned,
    'reserved_withdrawals', v_reserved_withdrawals
  );
END;
$$;

-- 3. TRANSAZIONE ATOMICA RICHIESTA PRELIEVO (impedisce doppi prelievi e importi superiori al saldo)
CREATE OR REPLACE FUNCTION public.request_affiliate_withdrawal(
  p_affiliate_id TEXT,
  p_user_id TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_amount NUMERIC,
  p_payment_method_ref TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aff RECORD;
  v_balances JSONB;
  v_available NUMERIC(10,2);
  v_recent_dup TEXT;
  v_wd_id TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF p_amount IS NULL OR p_amount < 50.00 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Importo minimo per il prelievo: 50,00 €.');
  END IF;

  IF p_payment_method_ref IS NULL OR length(trim(p_payment_method_ref)) < 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Metodo di pagamento non configurato.');
  END IF;

  -- Lock riga affiliato per serializzare richieste concorrenti
  SELECT * INTO v_aff
  FROM public.affiliates
  WHERE id = p_affiliate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Affiliato non trovato.');
  END IF;

  -- Ricalcola saldo reale disponibile
  v_balances := public.recalculate_affiliate_balances(p_affiliate_id);
  v_available := COALESCE((v_balances->>'available_balance')::NUMERIC(10,2), 0.00);

  IF p_amount > v_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo disponibile insufficiente per questo importo.');
  END IF;

  -- Protezione anti-duplicato ravvicinato (entro 30 secondi)
  SELECT id INTO v_recent_dup
  FROM public.affiliate_withdrawals
  WHERE affiliate_id = p_affiliate_id
    AND status IN ('pending', 'processing')
    AND requested_at > (v_now - interval '30 seconds')
  LIMIT 1;

  IF v_recent_dup IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Richiesta di prelievo già inviata. Attendi qualche secondo.');
  END IF;

  v_wd_id := 'wd_' || substr(md5(p_affiliate_id || v_now::text || random()::text), 1, 16);

  INSERT INTO public.affiliate_withdrawals (
    id, affiliate_id, user_id, affiliate_first_name, affiliate_last_name,
    affiliate_email, amount, currency, status, payment_method_reference,
    requested_at, created_at, updated_at
  ) VALUES (
    v_wd_id, p_affiliate_id, NULLIF(trim(COALESCE(p_user_id, '')), ''),
    COALESCE(NULLIF(trim(p_first_name), ''), ''), COALESCE(NULLIF(trim(p_last_name), ''), ''),
    lower(trim(p_email)), p_amount, 'EUR', 'pending', trim(p_payment_method_ref),
    v_now, v_now, v_now
  );

  -- Riserva immediatamente l'importo dal saldo disponibile
  v_balances := public.recalculate_affiliate_balances(p_affiliate_id);

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_wd_id,
    'amount', p_amount,
    'status', 'pending',
    'requested_at', v_now,
    'balances', v_balances
  );
END;
$$;

-- 4. AGGIORNAMENTO STATO PRELIEVO DA SUPER ADMIN (se rifiutato, restituisce automaticamente l'importo)
CREATE OR REPLACE FUNCTION public.update_affiliate_withdrawal_status(
  p_withdrawal_id TEXT,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wd RECORD;
  v_now TIMESTAMPTZ := now();
  v_balances JSONB;
BEGIN
  IF p_new_status NOT IN ('pending', 'approved', 'processing', 'paid', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stato non valido.');
  END IF;

  SELECT * INTO v_wd
  FROM public.affiliate_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Richiesta di prelievo non trovata.');
  END IF;

  UPDATE public.affiliate_withdrawals
  SET
    status = p_new_status,
    notes = COALESCE(p_notes, notes),
    approved_at = CASE WHEN p_new_status = 'approved' AND approved_at IS NULL THEN v_now ELSE approved_at END,
    paid_at = CASE WHEN p_new_status = 'paid' THEN v_now ELSE paid_at END,
    rejected_at = CASE WHEN p_new_status = 'rejected' THEN v_now ELSE rejected_at END,
    updated_at = v_now
  WHERE id = p_withdrawal_id;

  -- Ricalcola saldo (se rejected, l'importo riservato torna automaticamente disponibile)
  v_balances := public.recalculate_affiliate_balances(v_wd.affiliate_id);

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', p_withdrawal_id,
    'status', p_new_status,
    'balances', v_balances
  );
END;
$$;

-- 5. SICUREZZA RLS (solo i propri prelievi visibili all'affiliato, nessuna modifica dal browser)
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates can view own withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Affiliates can view own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT TO authenticated
  USING (
    auth.uid()::text = user_id
    OR lower(auth.jwt()->>'email') = lower(affiliate_email)
    OR affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()::text OR lower(email) = lower(auth.jwt()->>'email')
    )
  );

DROP POLICY IF EXISTS "Service role full access on affiliate_withdrawals" ON public.affiliate_withdrawals;
CREATE POLICY "Service role full access on affiliate_withdrawals" ON public.affiliate_withdrawals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.affiliate_withdrawals FROM anon, authenticated;
GRANT SELECT ON public.affiliate_withdrawals TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_affiliate_withdrawal(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_affiliate_withdrawal_status(TEXT, TEXT, TEXT) TO service_role;

-- 6. SUPABASE REALTIME PUBLICATION
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_withdrawals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
