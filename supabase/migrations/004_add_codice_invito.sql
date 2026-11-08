-- ==============================================================================
-- Migration 004: Aggiunta colonna Codice Invito per User Profiles e Bars
-- ==============================================================================

-- Aggiunge la colonna Codice invito alla tabella public.profiles se esistente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "Codice invito" TEXT;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code TEXT;
        COMMENT ON COLUMN public.profiles."Codice invito" IS 'Codice sconto o invito inserito dall''utente durante la registrazione';
    END IF;
END $$;

-- Aggiunge la colonna Codice invito alla tabella public.bars se esistente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bars') THEN
        ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS "Codice invito" TEXT;
        ALTER TABLE public.bars ADD COLUMN IF NOT EXISTS invite_code TEXT;
        COMMENT ON COLUMN public.bars."Codice invito" IS 'Codice sconto o invito inserito durante la registrazione del bar';
    END IF;
END $$;

-- Assicura che la funzione trigger on_auth_user_created propaghi il Codice invito da raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, invite_code, "Codice invito")
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'authenticated'),
    COALESCE(NEW.raw_user_meta_data->>'invite_code', NEW.raw_user_meta_data->>'Codice invito', NEW.raw_user_meta_data->>'promo_code'),
    COALESCE(NEW.raw_user_meta_data->>'Codice invito', NEW.raw_user_meta_data->>'invite_code', NEW.raw_user_meta_data->>'promo_code')
  )
  ON CONFLICT (id) DO UPDATE SET
    invite_code = EXCLUDED.invite_code,
    "Codice invito" = EXCLUDED."Codice invito";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
