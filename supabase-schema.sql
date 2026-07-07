-- ============================================
-- COWORKING MANAGEMENT PLATFORM — FULL SCHEMA
-- Pega todo esto en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- LIMPIEZA PREVIA
-- ============================================
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP VIEW IF EXISTS space_utilization CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.user_org_id() CASCADE;
DROP FUNCTION IF EXISTS public.user_role() CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS space_type CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;

-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('office_manager', 'member');
CREATE TYPE space_type AS ENUM ('desk', 'meeting_room', 'phone_booth', 'event_space');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'cancelled');

-- ============================================
-- TABLA: ORGANIZATIONS
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: SPACES
-- ============================================
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type space_type NOT NULL DEFAULT 'desk',
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- TABLA: RESERVATIONS
-- ============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status reservation_status NOT NULL DEFAULT 'confirmed',
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Evitar solapamiento de reservas confirmadas en un mismo espacio
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
EXCLUDE USING GIST (
  space_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status = 'confirmed');

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_reservations_space_time ON reservations(space_id, start_time, end_time);
CREATE INDEX idx_reservations_org ON reservations(org_id);
CREATE INDEX idx_spaces_org ON spaces(org_id);
CREATE INDEX idx_profiles_org ON profiles(org_id);

-- ============================================
-- VISTA: SPACE UTILIZATION (últimos 30 días)
-- ============================================
CREATE VIEW space_utilization AS
SELECT
  s.id AS space_id,
  s.name,
  s.org_id,
  s.type AS space_type,
  COUNT(r.id) AS total_reservations,
  COALESCE(SUM(EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600), 0) AS total_hours_booked,
  CASE
    WHEN COUNT(r.id) = 0 THEN NULL
    ELSE ROUND((COALESCE(SUM(EXTRACT(EPOCH FROM (r.end_time - r.start_time)) / 3600), 0) / (12.0 * 30)) * 100, 1)
  END AS occupancy_rate
FROM spaces s
LEFT JOIN reservations r
  ON r.space_id = s.id
  AND r.status = 'confirmed'
  AND r.start_time >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name, s.org_id, s.type;

-- ============================================
-- TRIGGER: auto-crear organización + perfil al registrarse
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
BEGIN
  v_org_name := NEW.raw_user_meta_data ->> 'organization_name';
  IF v_org_name IS NULL OR v_org_name = '' THEN
    v_org_name := 'Mi Organización';
  END IF;

  -- Crear la organización
  INSERT INTO public.organizations (name)
  VALUES (v_org_name)
  RETURNING id INTO v_org_id;

  -- Crear el perfil como office_manager
  INSERT INTO public.profiles (id, org_id, full_name, email, role)
  VALUES (
    NEW.id,
    v_org_id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    'office_manager'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCIONES HELPER
-- ============================================
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- POLÍTICAS RLS: ORGANIZATIONS
-- ============================================
CREATE POLICY "Ver mi organización"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================
-- POLÍTICAS RLS: PROFILES
-- ============================================
CREATE POLICY "Ver perfiles de mi organización"
  ON profiles FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Usuario actualiza su propio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ============================================
-- POLÍTICAS RLS: SPACES
-- ============================================
CREATE POLICY "Ver espacios de mi organización"
  ON spaces FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Manager crea espacios"
  ON spaces FOR INSERT
  WITH CHECK (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

CREATE POLICY "Manager edita espacios"
  ON spaces FOR UPDATE
  USING (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

CREATE POLICY "Manager elimina espacios"
  ON spaces FOR DELETE
  USING (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

-- ============================================
-- POLÍTICAS RLS: RESERVATIONS
-- ============================================
CREATE POLICY "Ver reservas de mi organización"
  ON reservations FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Usuario crea sus propias reservas"
  ON reservations FOR INSERT
  WITH CHECK (org_id = public.user_org_id() AND user_id = auth.uid());

CREATE POLICY "Usuario o manager cancela reservas"
  ON reservations FOR UPDATE
  USING (
    org_id = public.user_org_id()
    AND (user_id = auth.uid() OR public.user_role() = 'office_manager')
  );
