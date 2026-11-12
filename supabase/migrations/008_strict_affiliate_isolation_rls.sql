-- ==============================================================================
-- Migration 008: Rigorosa separazione account e RLS per affiliazioni BarPilot
-- Obiettivo: ogni utente autenticato vede ESCLUSIVAMENTE il proprio record
-- affiliato, le proprie provvigioni, i propri referral e i propri prelievi.
-- ==============================================================================

-- 1. ASSICURA PRESENZA COLONNA user_id SU TUTTE LE TABELLE AFFILIAZIONI
ALTER TABLE public.affiliates
  ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_affiliates_user_id_clean ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_email_clean ON public.affiliates(lower(email));

-- 2. ABILITA ROW LEVEL SECURITY (RLS) RIGOROSA
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES SU affiliates
DROP POLICY IF EXISTS "Affiliates can view own affiliate record" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates can update own affiliate record" ON public.affiliates;
DROP POLICY IF EXISTS "Service role full access on affiliates" ON public.affiliates;

CREATE POLICY "Affiliates can view own affiliate record" ON public.affiliates
  FOR SELECT TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
  );

CREATE POLICY "Affiliates can update own affiliate record" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
  );

CREATE POLICY "Service role full access on affiliates" ON public.affiliates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. POLICIES SU affiliate_referrals
DROP POLICY IF EXISTS "Affiliates can view own referrals" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "Service role full access on affiliate_referrals" ON public.affiliate_referrals;

CREATE POLICY "Affiliates can view own referrals" ON public.affiliate_referrals
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
         OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
    )
  );

CREATE POLICY "Service role full access on affiliate_referrals" ON public.affiliate_referrals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. POLICIES SU affiliate_commissions
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "Service role full access on affiliate_commissions" ON public.affiliate_commissions;

CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions
  FOR SELECT TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
         OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
    )
  );

CREATE POLICY "Service role full access on affiliate_commissions" ON public.affiliate_commissions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. POLICIES SU affiliate_withdrawals
DROP POLICY IF EXISTS "Affiliates can view own withdrawals" ON public.affiliate_withdrawals;
DROP POLICY IF EXISTS "Service role full access on affiliate_withdrawals" ON public.affiliate_withdrawals;

CREATE POLICY "Affiliates can view own withdrawals" ON public.affiliate_withdrawals
  FOR SELECT TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
    OR (auth.jwt()->>'email' IS NOT NULL AND lower(affiliate_email) = lower(auth.jwt()->>'email'))
    OR affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE (auth.uid() IS NOT NULL AND user_id = auth.uid()::text)
         OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
    )
  );

CREATE POLICY "Service role full access on affiliate_withdrawals" ON public.affiliate_withdrawals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. REVOCA SCRITTURE DIRETTE NON AUTORIZZATE DA CLIENT ANON/AUTHENTICATED
REVOKE INSERT, UPDATE, DELETE ON public.affiliate_commissions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.affiliate_referrals FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.affiliate_withdrawals FROM anon, authenticated;
REVOKE DELETE ON public.affiliates FROM anon, authenticated;

-- Permetti SELECT alle tabelle per authenticated
GRANT SELECT ON public.affiliates TO authenticated;
GRANT SELECT ON public.affiliate_referrals TO authenticated;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT SELECT ON public.affiliate_withdrawals TO authenticated;

-- 8. ASSICURA AGGIUNTA A SUPABASE_REALTIME
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliates; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_referrals; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_withdrawals; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
