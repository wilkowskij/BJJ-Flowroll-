-- Migration: enable_rls_gym_scoped_policies
-- Enables Row-Level Security on all tenant-scoped tables and creates
-- gym-scoped policies. The NestJS API connects via the postgres superuser
-- (bypasses RLS); these policies are a defense-in-depth layer for any
-- direct Supabase client access.

-- Enable RLS on all tenant-scoped tables (skip non-existent ones)
DO $$
DECLARE
  tbl text;
  tables_to_enable text[] := ARRAY[
    'Gym','User','Technique','Flowchart','WeeklyPost',
    'BeltTrack','TechniqueLog','ClassSchedule','Attendance',
    'Subscription','GamePlan','Announcement'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_to_enable LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- Helper function: extract gym_id from JWT custom claims
CREATE OR REPLACE FUNCTION auth.gym_id() RETURNS text AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'gym_id',
    auth.jwt() ->> 'gym_id'
  );
$$ LANGUAGE sql STABLE;

-- Helper function: extract role from JWT
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role'
  );
$$ LANGUAGE sql STABLE;

-- Drop existing policies before recreating (idempotent)
DO $$
DECLARE
  pair text[];
  tables_policies text[][] := ARRAY[
    ['Technique',     'gym_scoped_read'],
    ['Technique',     'gym_scoped_write'],
    ['WeeklyPost',    'gym_scoped_read'],
    ['WeeklyPost',    'gym_scoped_write'],
    ['Flowchart',     'gym_scoped'],
    ['TechniqueLog',  'gym_scoped'],
    ['Attendance',    'gym_scoped'],
    ['ClassSchedule', 'gym_scoped'],
    ['BeltTrack',     'gym_scoped'],
    ['Subscription',  'gym_scoped'],
    ['GamePlan',      'gym_scoped'],
    ['Announcement',  'gym_scoped'],
    ['User',          'gym_scoped'],
    ['User',          'self_write'],
    ['Gym',           'gym_scoped_read'],
    ['Gym',           'gym_admin_write']
  ];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY tables_policies LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = pair[1]
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pair[2], pair[1]);
    END IF;
  END LOOP;
END $$;

-- Technique policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Technique') THEN
    CREATE POLICY "gym_scoped_read" ON public."Technique"
      FOR SELECT USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
    CREATE POLICY "gym_scoped_write" ON public."Technique"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- WeeklyPost policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='WeeklyPost') THEN
    CREATE POLICY "gym_scoped_read" ON public."WeeklyPost"
      FOR SELECT USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
    CREATE POLICY "gym_scoped_write" ON public."WeeklyPost"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- Flowchart policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Flowchart') THEN
    CREATE POLICY "gym_scoped" ON public."Flowchart"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- TechniqueLog policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='TechniqueLog') THEN
    CREATE POLICY "gym_scoped" ON public."TechniqueLog"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- Attendance policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Attendance') THEN
    CREATE POLICY "gym_scoped" ON public."Attendance"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- ClassSchedule policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ClassSchedule') THEN
    CREATE POLICY "gym_scoped" ON public."ClassSchedule"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- BeltTrack policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='BeltTrack') THEN
    CREATE POLICY "gym_scoped" ON public."BeltTrack"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- Subscription policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Subscription') THEN
    CREATE POLICY "gym_scoped" ON public."Subscription"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- GamePlan policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='GamePlan') THEN
    CREATE POLICY "gym_scoped" ON public."GamePlan"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- Announcement policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Announcement') THEN
    CREATE POLICY "gym_scoped" ON public."Announcement"
      FOR ALL USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- User table policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='User') THEN
    CREATE POLICY "gym_scoped" ON public."User"
      FOR SELECT USING ("gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
    CREATE POLICY "self_write" ON public."User"
      FOR ALL USING (id = auth.uid()::text OR "gymId" = auth.gym_id() OR auth.user_role() = 'platform_admin');
  END IF;
END $$;

-- Gym table policies
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Gym') THEN
    CREATE POLICY "gym_scoped_read" ON public."Gym"
      FOR SELECT USING (id = auth.gym_id() OR auth.user_role() = 'platform_admin');
    CREATE POLICY "gym_admin_write" ON public."Gym"
      FOR ALL USING (id = auth.gym_id() AND auth.user_role() IN ('owner', 'instructor', 'platform_admin'));
  END IF;
END $$;
