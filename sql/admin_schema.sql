-- ============================================================================
-- BarPilot Super Admin Enterprise Database Schema for Supabase
-- Console: https://www.barpilot.eu/administration.html
-- Esegui questo script completo nell'editor SQL di Supabase:
-- https://supabase.com/dashboard/project/cprxxxlgaofopmogeuer/sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PANORAMICA (KPI & Metriche Live Dashboard)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_overview_metrics (
  id TEXT PRIMARY KEY DEFAULT 'current',
  mrr NUMERIC(10,2) DEFAULT 12480.00,
  arr NUMERIC(10,2) DEFAULT 149760.00,
  active_bars INT DEFAULT 64,
  trial_bars INT DEFAULT 18,
  late_bars INT DEFAULT 11,
  canceled_bars INT DEFAULT 3,
  total_bars INT DEFAULT 96,
  paid_invoices INT DEFAULT 132,
  pending_invoices INT DEFAULT 13,
  success_rate NUMERIC(5,2) DEFAULT 95.10,
  growth_rate NUMERIC(5,2) DEFAULT 16.00,
  churn_rate NUMERIC(5,2) DEFAULT 1.80,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. BAR ISCRITTI (Multi-Tenant Bars Directory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  "Città" TEXT,
  plan TEXT DEFAULT 'Pro', -- Basic (38€), Pro (59€), Premium (99€)
  status TEXT DEFAULT 'active', -- active, trial, late, canceled
  next_invoice TEXT,
  monthly_revenue NUMERIC(10,2) DEFAULT 59.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_access TEXT,
  avatar TEXT,
  photo TEXT,
  piva TEXT,
  "Partita IVA" TEXT,
  notes TEXT
);

ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS "Partita IVA" TEXT;
ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS "Città" TEXT;

-- ----------------------------------------------------------------------------
-- 3. ABBONAMENTI (Subscriptions Lifecycle & Renewals)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE CASCADE,
  bar_name TEXT NOT NULL,
  plan TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, yearly
  status TEXT NOT NULL, -- active, trial, late, canceled
  payment_method TEXT DEFAULT 'Google Pay / Carta',
  current_period_start TEXT,
  current_period_end TEXT,
  trial_end TEXT,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. FATTURE (Invoices & Billing History)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  bar_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  plan TEXT DEFAULT 'Pro',
  status TEXT DEFAULT 'paid', -- paid, pending, canceled
  period TEXT,
  download_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. PAGAMENTI (Transactions & Gateway Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  bar_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  method TEXT NOT NULL, -- 'Google Pay', 'Carta (Stripe)', 'SEPA Direct'
  status TEXT NOT NULL, -- 'completed', 'pending', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. STATISTICHE (SaaS Analytics & Cohorts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_stats (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  mrr NUMERIC(10,2) NOT NULL,
  arr NUMERIC(10,2) NOT NULL,
  arpu NUMERIC(10,2) NOT NULL,
  clv NUMERIC(10,2) NOT NULL,
  conversion_rate NUMERIC(5,2) DEFAULT 78.4,
  retention_rate NUMERIC(5,2) DEFAULT 98.2,
  basic_count INT DEFAULT 18,
  pro_count INT DEFAULT 52,
  premium_count INT DEFAULT 26,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. SUPPORTO (Helpdesk & Client Tickets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id TEXT PRIMARY KEY,
  bar_id TEXT REFERENCES public.bars(id) ON DELETE SET NULL,
  bar_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT DEFAULT 'KDS Banco',
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. IMPOSTAZIONI (Super Admin Profile & Company Configuration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  super_admin_name TEXT DEFAULT 'Cheikh Gueye',
  super_admin_email TEXT DEFAULT 'cheikh@barpilot.it',
  super_admin_avatar TEXT,
  access_pin TEXT DEFAULT '101540',
  company_name TEXT DEFAULT 'BarPilot Inc. · Gestione Bar & Ristoranti',
  company_piva TEXT DEFAULT 'IT 12345678901',
  billing_email TEXT DEFAULT 'billing@barpilot.app',
  auto_reminders BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. ATTIVITÀ RECENTI (Audit Log)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- reg, pay, inv, late, cancel, support
  title TEXT NOT NULL,
  description TEXT,
  time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Accesso Sicuro e Aperto via Anon Key
-- ============================================================================
ALTER TABLE public.admin_overview_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

-- Policy per tutte le tabelle (SELECT, INSERT, UPDATE, DELETE)
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['admin_overview_metrics', 'bars', 'subscriptions', 'invoices', 'payments', 'admin_stats', 'support_tickets', 'admin_settings', 'admin_activities']
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

-- ============================================================================
-- SEED DATA INIZIALE (Popolamento Immediato di tutte le sezioni)
-- ============================================================================

-- 1. Panoramica
INSERT INTO public.admin_overview_metrics (id, mrr, arr, active_bars, trial_bars, late_bars, canceled_bars, total_bars, paid_invoices, pending_invoices, success_rate, growth_rate)
VALUES ('current', 12480.00, 149760.00, 64, 18, 11, 3, 96, 132, 13, 95.10, 16.00)
ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 2. Bar Iscritti
INSERT INTO public.bars (id, name, owner, email, phone, address, city, plan, status, next_invoice, monthly_revenue, avatar, piva, notes)
VALUES
('bp-bar-01', 'Bar Centrale', 'Marco Bianchi', 'marco@barcentrale.it', '+39 02 87654321', 'Via Roma 123, Milano', 'Milano', 'Pro', 'active', '15 nov 2025', 59.00, 'BC', 'IT09876543210', 'Cliente storico. Richiede fatturazione elettronica.'),
('bp-bar-02', 'Caffè del Porto', 'Giulia Rossi', 'giulia@caffedelporto.it', '+39 010 3344556', 'Calata Molo Vecchio 4, Genova', 'Genova', 'Basic', 'active', '28 nov 2025', 38.00, 'CP', 'IT01234567890', 'Locale stagionale estivo, attivo tutto l''anno.'),
('bp-bar-03', 'La Dolce Vita', 'Alessandro Conti', 'alessandro@ladolcevita.it', '+39 081 7766554', 'Piazza Plebiscito 12, Napoli', 'Napoli', 'Pro', 'trial', '10 nov 2025', 0.00, 'DV', 'IT04567891234', 'In prova gratuita (giorno 4 di 14).'),
('bp-bar-04', 'Bar Moderno', 'Sara Romano', 'sara@barmoderno.it', '+39 051 9988776', 'Via Indipendenza 45, Bologna', 'Bologna', 'Pro', 'late', '10 ott 2025', 59.00, 'BM', 'IT07891234567', 'Carta scaduta nel Google Wallet. Sollecito inviato.'),
('bp-bar-05', 'Lounge 21', 'Luca Moretti', 'luca@lounge21.it', '+39 02 44332211', 'Corso Como 21, Milano', 'Milano', 'Premium', 'active', '22 nov 2025', 99.00, 'L2', 'IT03216549870', 'Piano Premium con 4 tablet KDS contemporanei.'),
('bp-bar-06', 'Bar Nettuno', 'Martina Gallo', 'martina@barnettuno.it', '+39 0541 234567', 'Lungomare Tintori 8, Rimini', 'Rimini', 'Basic', 'canceled', '-', 0.00, 'BN', 'IT06549873210', 'Chiusura stagionale invernale.'),
('bp-bar-07', 'Il Ritrovo', 'Federico Neri', 'federico@ilritrovo.it', '+39 06 65432109', 'Via Appia Nuova 88, Roma', 'Roma', 'Pro', 'active', '18 nov 2025', 59.00, 'IR', 'IT08765432109', 'Locale ad alto volume colazioni e aperitivi.'),
('bp-bar-08', 'Bar Firenze', 'Elena Russo', 'elena@barfirenze.it', '+39 055 7654321', 'Borgo San Frediano 19, Firenze', 'Firenze', 'Basic', 'late', '05 ott 2025', 38.00, 'BF', 'IT09812345678', 'Pagamento respinto dalla banca.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;

-- 3. Abbonamenti
INSERT INTO public.subscriptions (id, bar_id, bar_name, plan, price, billing_cycle, status, payment_method, current_period_end)
VALUES
('sub-01', 'bp-bar-01', 'Bar Centrale', 'Pro', 59.00, 'monthly', 'active', 'Google Pay', '15/11/2025'),
('sub-02', 'bp-bar-02', 'Caffè del Porto', 'Basic', 38.00, 'monthly', 'active', 'Carta di Credito (Stripe)', '28/11/2025'),
('sub-03', 'bp-bar-03', 'La Dolce Vita', 'Pro', 59.00, 'monthly', 'trial', 'Google Pay (In Prova)', '10/11/2025'),
('sub-04', 'bp-bar-04', 'Bar Moderno', 'Pro', 59.00, 'monthly', 'late', 'Carta Scaduta (Stripe)', '10/10/2025'),
('sub-05', 'bp-bar-05', 'Lounge 21', 'Premium', 99.00, 'monthly', 'active', 'Google Pay', '22/11/2025'),
('sub-06', 'bp-bar-06', 'Bar Nettuno', 'Basic', 38.00, 'monthly', 'canceled', 'Nessuno', '28/10/2025'),
('sub-07', 'bp-bar-07', 'Il Ritrovo', 'Pro', 59.00, 'monthly', 'active', 'SEPA Direct Debit', '18/11/2025'),
('sub-08', 'bp-bar-08', 'Bar Firenze', 'Basic', 38.00, 'monthly', 'late', 'Carta di Credito (Stripe)', '05/10/2025')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 4. Fatture
INSERT INTO public.invoices (id, number, bar_id, bar_name, owner_name, date, due_date, amount, plan, status, period)
VALUES
('inv-2025-0145', '#2025-0145', 'bp-bar-01', 'Bar Centrale', 'Marco Bianchi', '15 ott 2025', '15 ott 2025', 59.00, 'Pro', 'paid', '15/10/2025 - 14/11/2025'),
('inv-2025-0144', '#2025-0144', 'bp-bar-05', 'Lounge 21', 'Luca Moretti', '15 ott 2025', '15 ott 2025', 99.00, 'Premium', 'paid', '15/10/2025 - 14/11/2025'),
('inv-2025-0143', '#2025-0143', 'bp-bar-02', 'Caffè del Porto', 'Giulia Rossi', '15 ott 2025', '15 ott 2025', 38.00, 'Basic', 'paid', '15/10/2025 - 14/11/2025'),
('inv-2025-0142', '#2025-0142', 'bp-bar-03', 'La Dolce Vita', 'Alessandro Conti', '10 ott 2025', '24 ott 2025', 59.00, 'Pro', 'pending', '24/10/2025 - 23/11/2025'),
('inv-2025-0141', '#2025-0141', 'bp-bar-04', 'Bar Moderno', 'Sara Romano', '05 ott 2025', '10 ott 2025', 59.00, 'Pro', 'pending', '10/10/2025 - 09/11/2025'),
('inv-2025-0140', '#2025-0140', 'bp-bar-08', 'Bar Firenze', 'Elena Russo', '01 ott 2025', '05 ott 2025', 38.00, 'Basic', 'paid', '05/10/2025 - 04/11/2025'),
('inv-2025-0139', '#2025-0139', 'bp-bar-07', 'Il Ritrovo', 'Federico Neri', '01 ott 2025', '01 ott 2025', 59.00, 'Pro', 'paid', '01/10/2025 - 31/10/2025'),
('inv-2025-0138', '#2025-0138', 'bp-bar-06', 'Bar Nettuno', 'Martina Gallo', '28 set 2025', '28 set 2025', 38.00, 'Basic', 'canceled', '28/09/2025 - 27/10/2025')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 5. Pagamenti
INSERT INTO public.payments (id, transaction_id, bar_id, bar_name, amount, method, status)
VALUES
('pay-01', 'txn_gpay_9823412', 'bp-bar-01', 'Bar Centrale', 59.00, 'Google Pay', 'completed'),
('pay-02', 'txn_strp_8849201', 'bp-bar-05', 'Lounge 21', 99.00, 'Carta (Stripe)', 'completed'),
('pay-03', 'txn_strp_7739102', 'bp-bar-02', 'Caffè del Porto', 38.00, 'Carta (Stripe)', 'completed'),
('pay-04', 'txn_sepa_1192840', 'bp-bar-07', 'Il Ritrovo', 59.00, 'SEPA Direct', 'completed'),
('pay-05', 'txn_gpay_3329104', 'bp-bar-04', 'Bar Moderno', 59.00, 'Google Pay', 'failed')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 6. Statistiche
INSERT INTO public.admin_stats (id, period, mrr, arr, arpu, clv, conversion_rate, retention_rate, basic_count, pro_count, premium_count)
VALUES
('stats-2025-10', 'Ottobre 2025', 12480.00, 149760.00, 58.86, 1420.00, 78.4, 98.2, 18, 52, 26)
ON CONFLICT (id) DO UPDATE SET mrr = EXCLUDED.mrr;

-- 7. Supporto
INSERT INTO public.support_tickets (id, bar_id, bar_name, contact_email, subject, category, priority, status, message, response)
VALUES
('tkt-01', 'bp-bar-01', 'Bar Centrale', 'marco@barcentrale.it', 'Richiesta configurazione secondo tablet KDS cucina', 'KDS Banco', 'medium', 'resolved', 'Vorremmo affiancare un secondo tablet per le pizze oltre a quello delle bevande.', 'Configurazione abilitata su multi-schermo KDS.'),
('tkt-02', 'bp-bar-04', 'Bar Moderno', 'sara@barmoderno.it', 'Aggiornamento carta di credito aziendale', 'Pagamenti', 'high', 'open', 'Abbiamo sostituito la carta di credito. Come possiamo aggiornare il Google Wallet per il pagamento automatico?', NULL),
('tkt-03', 'bp-bar-05', 'Lounge 21', 'luca@lounge21.it', 'Integrazione stampante termica comande Bluetooth', 'Hardware', 'low', 'in_progress', 'Avremmo bisogno del supporto per collegare la stampante termica Epson da 80mm.', 'Guida inviata, in attesa di test del gestore.')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 8. Impostazioni
INSERT INTO public.admin_settings (id, super_admin_name, super_admin_email, access_pin, company_name, company_piva, billing_email, auto_reminders)
VALUES
('global_config', 'Cheikh Gueye', 'cheikh@barpilot.it', '101540', 'BarPilot Inc. · Gestione Bar & Ristoranti', 'IT 12345678901', 'billing@barpilot.app', true)
ON CONFLICT (id) DO UPDATE SET super_admin_name = EXCLUDED.super_admin_name, access_pin = EXCLUDED.access_pin;

-- 9. Attività Recenti
INSERT INTO public.admin_activities (id, type, title, description, time)
VALUES
('act-01', 'reg', 'Nuovo bar registrato', 'Caffè del Porto (Genova)', '2 min fa'),
('act-02', 'pay', 'Pagamento ricevuto', 'Bar Centrale - 59,00 €', '15 min fa'),
('act-03', 'inv', 'Fattura generata', 'La Dolce Vita - n. #2025-0142', '1 ora fa'),
('act-04', 'late', 'Pagamento in ritardo', 'Bar Moderno', '2 ore fa'),
('act-05', 'cancel', 'Abbonamento cancellato', 'Bar Nettuno', '3 ore fa'),
('act-06', 'support', 'Ticket assistenza aperto', 'Bar Moderno - Aggiornamento carta', '4 ore fa')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
