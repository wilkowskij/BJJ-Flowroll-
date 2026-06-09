-- Migration: enable_rls_gym_scoped_policies
-- Enables Row-Level Security on all tenant-scoped tables and creates
-- gym-scoped policies using inline JWT extraction.
-- The NestJS API connects via the postgres superuser (bypasses RLS);
-- these policies are a defense-in-depth layer for any direct Supabase client access.
--
-- NOTE: Policies use inline COALESCE(auth.jwt()->'app_metadata'->>'gym_id', auth.jwt()->>'gym_id')
-- rather than helper functions in the auth schema, since the migration runner
-- does not have CREATE permission on the auth schema.

-- Enable RLS on all tenant-scoped tables
ALTER TABLE public."Gym" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Technique" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Flowchart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WeeklyPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BeltTrack" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."BeltPromotion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ClassSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TechniqueLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GamePlan" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "gym_scoped_read" ON public."Technique";
DROP POLICY IF EXISTS "gym_scoped_write" ON public."Technique";
DROP POLICY IF EXISTS "gym_scoped_read" ON public."WeeklyPost";
DROP POLICY IF EXISTS "gym_scoped_write" ON public."WeeklyPost";
DROP POLICY IF EXISTS "gym_scoped" ON public."Flowchart";
DROP POLICY IF EXISTS "gym_scoped" ON public."TechniqueLog";
DROP POLICY IF EXISTS "gym_scoped" ON public."Attendance";
DROP POLICY IF EXISTS "gym_scoped" ON public."ClassSchedule";
DROP POLICY IF EXISTS "gym_scoped" ON public."BeltTrack";
DROP POLICY IF EXISTS "gym_scoped" ON public."Subscription";
DROP POLICY IF EXISTS "gym_scoped" ON public."GamePlan";
DROP POLICY IF EXISTS "gym_scoped" ON public."Announcement";
DROP POLICY IF EXISTS "gym_scoped" ON public."User";
DROP POLICY IF EXISTS "self_write" ON public."User";
DROP POLICY IF EXISTS "gym_scoped_read" ON public."Gym";
DROP POLICY IF EXISTS "gym_admin_write" ON public."Gym";
DROP POLICY IF EXISTS "gym_scoped" ON public."BeltPromotion";

-- Technique policies
CREATE POLICY "gym_scoped_read" ON public."Technique"
  FOR SELECT USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );
CREATE POLICY "gym_scoped_write" ON public."Technique"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- WeeklyPost policies
CREATE POLICY "gym_scoped_read" ON public."WeeklyPost"
  FOR SELECT USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );
CREATE POLICY "gym_scoped_write" ON public."WeeklyPost"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- Flowchart policies
CREATE POLICY "gym_scoped" ON public."Flowchart"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- TechniqueLog policies
CREATE POLICY "gym_scoped" ON public."TechniqueLog"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- Attendance policies
CREATE POLICY "gym_scoped" ON public."Attendance"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- ClassSchedule policies
CREATE POLICY "gym_scoped" ON public."ClassSchedule"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- BeltTrack policies
CREATE POLICY "gym_scoped" ON public."BeltTrack"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- Subscription policies
CREATE POLICY "gym_scoped" ON public."Subscription"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- GamePlan policies
CREATE POLICY "gym_scoped" ON public."GamePlan"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- Announcement policies
CREATE POLICY "gym_scoped" ON public."Announcement"
  FOR ALL USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- BeltPromotion policies (scoped via userId join to User table)
CREATE POLICY "gym_scoped" ON public."BeltPromotion"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."User" u
      WHERE u.id = "userId"
      AND u."gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    )
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- User table policies
CREATE POLICY "gym_scoped" ON public."User"
  FOR SELECT USING (
    "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );
CREATE POLICY "self_write" ON public."User"
  FOR ALL USING (
    id = auth.uid()::text
    OR "gymId" = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );

-- Gym table policies
CREATE POLICY "gym_scoped_read" ON public."Gym"
  FOR SELECT USING (
    id = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'platform_admin'
  );
CREATE POLICY "gym_admin_write" ON public."Gym"
  FOR ALL USING (
    id = COALESCE(auth.jwt() -> 'app_metadata' ->> 'gym_id', auth.jwt() ->> 'gym_id')
    AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') IN ('owner', 'instructor', 'platform_admin')
  );
