-- ============================================================================
-- BarPilot Administration Database Schema for Supabase
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cprxxxlgaofopmogeuer/sql
-- ============================================================================

-- 1. Bars Table
CREATE TABLE IF NOT EXISTS public.bars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  plan TEXT DEFAULT 'Pro',
  status TEXT DEFAULT 'active', -- active, trial, late, canceled
  next_invoice TEXT,
  monthly_revenue NUMERIC(10,2) DEFAULT 59.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_access TEXT,
  avatar TEXT,
  photo TEXT,
  piva TEXT,
  notes TEXT
);

-- 2. Invoices Table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Allow public read/write via Anon Key for BarPilot Admin Console
DROP POLICY IF EXISTS "Allow public read access on bars" ON public.bars;
CREATE POLICY "Allow public read access on bars" ON public.bars FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on bars" ON public.bars;
CREATE POLICY "Allow public insert on bars" ON public.bars FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on bars" ON public.bars;
CREATE POLICY "Allow public update on bars" ON public.bars FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on bars" ON public.bars;
CREATE POLICY "Allow public delete on bars" ON public.bars FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access on invoices" ON public.invoices;
CREATE POLICY "Allow public read access on invoices" ON public.invoices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on invoices" ON public.invoices;
CREATE POLICY "Allow public insert on invoices" ON public.invoices FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on invoices" ON public.invoices;
CREATE POLICY "Allow public update on invoices" ON public.invoices FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on invoices" ON public.invoices;
CREATE POLICY "Allow public delete on invoices" ON public.invoices FOR DELETE USING (true);

-- 4. Initial Seed Data
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
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;
