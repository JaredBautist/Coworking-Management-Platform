-- ============================================================
-- COWORKING MANAGEMENT PLATFORM — SCHEMA COMPLETO
-- Pega TODO esto en el SQL Editor de Supabase y dale Run.
-- Crea el esquema completo desde cero (borra lo anterior).
-- ============================================================

-- ============================================================
-- 0. ASEGURAR EL ESQUEMA public (por si fue borrado)
--    Recrea public con la propiedad y permisos por defecto de Supabase.
-- ============================================================
CREATE SCHEMA IF NOT EXISTS public;
ALTER SCHEMA public OWNER TO postgres;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON SCHEMA public TO postgres, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================================
-- 1. LIMPIEZA PREVIA (orden inverso de dependencias)
-- ============================================================
DROP TABLE IF EXISTS reservation_attendees CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
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

-- ============================================================
-- 2. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- 3. ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('office_manager', 'member');
CREATE TYPE space_type AS ENUM ('desk', 'meeting_room', 'phone_booth', 'event_space');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'cancelled');

-- ============================================================
-- 4. TABLAS
-- ============================================================

-- ORGANIZATIONS
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SPACES
CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type space_type NOT NULL DEFAULT 'desk',
  capacity INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RESERVATIONS
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

-- Evita solapamiento de reservas confirmadas en un mismo espacio
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
EXCLUDE USING GIST (
  space_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status = 'confirmed');

-- INVITATIONS (invitar miembros a una org existente)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RESERVATION_ATTENDEES (asistentes de una reunión)
CREATE TABLE reservation_attendees (
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (reservation_id, user_id)
);

-- ============================================================
-- 5. ÍNDICES
-- ============================================================
CREATE INDEX idx_reservations_space_time ON reservations(space_id, start_time, end_time);
CREATE INDEX idx_reservations_org ON reservations(org_id);
CREATE INDEX idx_spaces_org ON spaces(org_id);
CREATE INDEX idx_profiles_org ON profiles(org_id);
CREATE UNIQUE INDEX uniq_invitation_org_email ON invitations (org_id, lower(email));
CREATE INDEX idx_invitations_email ON invitations (lower(email));
CREATE INDEX idx_attendees_user ON reservation_attendees (user_id);

-- ============================================================
-- 6. VISTA: SPACE UTILIZATION (últimos 30 días)
-- ============================================================
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

-- ============================================================
-- 7. FUNCIONES HELPER (usadas por las políticas RLS)
--    SECURITY DEFINER para evitar recursión de RLS sobre profiles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 8. TRIGGER: auto-crear organización/perfil al registrarse,
--    respetando invitaciones pendientes.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
  v_invite public.invitations%ROWTYPE;
BEGIN
  -- ¿Hay una invitación pendiente para este email? → unirse a esa org.
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE lower(email) = lower(NEW.email) AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite.id IS NOT NULL THEN
    INSERT INTO public.profiles (id, org_id, full_name, email, role)
    VALUES (
      NEW.id,
      v_invite.org_id,
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.email,
      v_invite.role
    );

    UPDATE public.invitations SET status = 'accepted' WHERE id = v_invite.id;

    RETURN NEW;
  END IF;

  -- Sin invitación: crear una organización nueva como office_manager.
  v_org_name := NEW.raw_user_meta_data ->> 'organization_name';
  IF v_org_name IS NULL OR v_org_name = '' THEN
    v_org_name := 'Mi Organización';
  END IF;

  INSERT INTO public.organizations (name)
  VALUES (v_org_name)
  RETURNING id INTO v_org_id;

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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- GoTrue ejecuta el trigger como supabase_auth_admin: necesita poder
-- ejecutar la función (imprescindible tras recrear el esquema public).
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_attendees ENABLE ROW LEVEL SECURITY;

-- ---- ORGANIZATIONS ----
CREATE POLICY "Ver mi organización"
  ON organizations FOR SELECT
  USING (id = public.user_org_id());

CREATE POLICY "Manager actualiza su organización"
  ON organizations FOR UPDATE
  USING (id = public.user_org_id() AND public.user_role() = 'office_manager');

-- ---- PROFILES ----
CREATE POLICY "Ver perfiles de mi organización"
  ON profiles FOR SELECT
  USING (org_id = public.user_org_id());

CREATE POLICY "Usuario actualiza su propio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Manager actualiza perfiles de su org"
  ON profiles FOR UPDATE
  USING (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

-- ---- SPACES ----
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

-- ---- RESERVATIONS ----
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

-- ---- INVITATIONS (solo office_manager de la org) ----
CREATE POLICY "Manager ve invitaciones de su org"
  ON invitations FOR SELECT
  USING (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

CREATE POLICY "Manager crea invitaciones"
  ON invitations FOR INSERT
  WITH CHECK (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

CREATE POLICY "Manager elimina invitaciones"
  ON invitations FOR DELETE
  USING (org_id = public.user_org_id() AND public.user_role() = 'office_manager');

-- ---- RESERVATION_ATTENDEES ----
CREATE POLICY "Ver asistentes de mi organización"
  ON reservation_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id AND r.org_id = public.user_org_id()
    )
  );

CREATE POLICY "Organizador agrega asistentes"
  ON reservation_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.org_id = public.user_org_id()
        AND (r.user_id = auth.uid() OR public.user_role() = 'office_manager')
    )
  );

CREATE POLICY "Organizador elimina asistentes"
  ON reservation_attendees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.id = reservation_id
        AND r.org_id = public.user_org_id()
        AND (r.user_id = auth.uid() OR public.user_role() = 'office_manager')
    )
  );

-- ============================================================
-- 10. REALTIME (reflejar cambios de reservas en tiempo real)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'reservations'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;
END $$;
