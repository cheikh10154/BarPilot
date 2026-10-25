-- ============================================================================
-- BarPilot – Migration 002: Advanced Auth, Profiles, Multi-tenant Roles & RLS
-- ============================================================================

-- 1. Ensure 'cashier' is in membership_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'membership_role' AND e.enumlabel = 'cashier'
  ) THEN
    ALTER TYPE membership_role ADD VALUE 'cashier';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extend/Ensure Profiles Table has first_name, last_name, email, avatar_url
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name       VARCHAR(128) DEFAULT '',
  last_name        VARCHAR(128) DEFAULT '',
  full_name        VARCHAR(255) DEFAULT '',
  email            VARCHAR(320) NOT NULL DEFAULT '',
  avatar_url       TEXT,
  preferred_locale VARCHAR(10)  NOT NULL DEFAULT 'it',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Add missing columns if profiles already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='first_name') THEN
    ALTER TABLE public.profiles ADD COLUMN first_name VARCHAR(128) DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='last_name') THEN
    ALTER TABLE public.profiles ADD COLUMN last_name VARCHAR(128) DEFAULT '';
  END IF;
END $$;

-- 3. Robust Trigger: Handle new signups from Google, Facebook or Email/Password
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  v_full_name TEXT := '';
  v_first_name TEXT := '';
  v_last_name TEXT := '';
  v_avatar TEXT := '';
  v_email TEXT := COALESCE(NEW.email, '');
BEGIN
  -- Extract names from Google / Facebook OAuth metadata or manual fields
  v_first_name := COALESCE(
    v_raw_meta ->> 'first_name',
    v_raw_meta ->> 'given_name',
    ''
  );
  v_last_name := COALESCE(
    v_raw_meta ->> 'last_name',
    v_raw_meta ->> 'family_name',
    ''
  );
  v_full_name := COALESCE(
    v_raw_meta ->> 'full_name',
    v_raw_meta ->> 'name',
    TRIM(v_first_name || ' ' || v_last_name),
    SPLIT_PART(v_email, '@', 1)
  );

  -- If full_name was provided but first/last were blank, split full_name
  IF (v_first_name = '' AND v_full_name <> '') THEN
    v_first_name := SPLIT_PART(v_full_name, ' ', 1);
    v_last_name := SUBSTRING(v_full_name FROM LENGTH(v_first_name) + 2);
  END IF;

  -- Extract avatar URL from OAuth (Google 'picture', Facebook 'avatar_url', etc.)
  v_avatar := COALESCE(
    v_raw_meta ->> 'avatar_url',
    v_raw_meta ->> 'picture',
    'https://ui-avatars.com/api/?name=' || REPLACE(v_full_name, ' ', '+') || '&background=FF8A24&color=fff&size=128'
  );

  -- Upsert profile record
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    full_name,
    email,
    avatar_url,
    preferred_locale,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    v_full_name,
    v_email,
    v_avatar,
    COALESCE(v_raw_meta ->> 'preferred_locale', 'it'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create Invitations Table (For safe team recruitment)
CREATE TABLE IF NOT EXISTS public.invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  location_id     UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  email           VARCHAR(320) NOT NULL,
  role            membership_role NOT NULL DEFAULT 'server',
  token           VARCHAR(64) NOT NULL UNIQUE,
  invited_by      UUID REFERENCES public.profiles(id),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org   ON public.invitations(organization_id);

-- 5. Helper Functions for Row Level Security (RLS)
CREATE OR REPLACE FUNCTION public.get_my_organization_ids()
RETURNS TABLE (organization_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.organization_id
  FROM public.memberships m
  WHERE m.profile_id = auth.uid()
    AND m.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner_or_manager(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.organization_id = org_id
      AND m.profile_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner', 'manager')
  );
$$;

-- 6. Enable Row Level Security (RLS) on Multi-Tenant Tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations   ENABLE ROW LEVEL SECURITY;

-- 7. Policies for Organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
CREATE POLICY "Users can view their own organizations" ON public.organizations
  FOR SELECT
  USING (id IN (SELECT organization_id FROM public.get_my_organization_ids()));

DROP POLICY IF EXISTS "Authenticated users can create an organization" ON public.organizations;
CREATE POLICY "Authenticated users can create an organization" ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners and managers can update their organization" ON public.organizations;
CREATE POLICY "Owners and managers can update their organization" ON public.organizations
  FOR UPDATE
  USING (public.is_org_owner_or_manager(id));

-- 8. Policies for Locations
DROP POLICY IF EXISTS "Users can view locations of their organizations" ON public.locations;
CREATE POLICY "Users can view locations of their organizations" ON public.locations
  FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM public.get_my_organization_ids()));

DROP POLICY IF EXISTS "Owners and managers can manage locations" ON public.locations;
CREATE POLICY "Owners and managers can manage locations" ON public.locations
  FOR ALL
  USING (public.is_org_owner_or_manager(organization_id));

-- 9. Policies for Memberships
DROP POLICY IF EXISTS "Users can view memberships in their organizations" ON public.memberships;
CREATE POLICY "Users can view memberships in their organizations" ON public.memberships
  FOR SELECT
  USING (
    profile_id = auth.uid() OR
    organization_id IN (SELECT organization_id FROM public.get_my_organization_ids())
  );

DROP POLICY IF EXISTS "Owners can manage memberships in their organization" ON public.memberships;
CREATE POLICY "Owners can manage memberships in their organization" ON public.memberships
  FOR ALL
  USING (public.is_org_owner_or_manager(organization_id));

-- 10. Policies for Profiles
DROP POLICY IF EXISTS "Users can view profiles in same organization" ON public.profiles;
CREATE POLICY "Users can view profiles in same organization" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT m.profile_id FROM public.memberships m
      WHERE m.organization_id IN (SELECT organization_id FROM public.get_my_organization_ids())
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- 11. Policies for Invitations
DROP POLICY IF EXISTS "Owners can view and create invitations" ON public.invitations;
CREATE POLICY "Owners can view and create invitations" ON public.invitations
  FOR ALL
  USING (public.is_org_owner_or_manager(organization_id));

DROP POLICY IF EXISTS "Anyone can look up an invitation by token" ON public.invitations;
CREATE POLICY "Anyone can look up an invitation by token" ON public.invitations
  FOR SELECT
  USING (true);
