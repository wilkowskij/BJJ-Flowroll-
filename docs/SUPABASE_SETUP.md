# Supabase Setup Guide

## 1. Auth Hook — JWT Custom Claims

FlowMat uses a Postgres Auth Hook to inject `gym_id` and `role` into every Supabase JWT.
The API reads these claims directly from the token — **no DB lookup per request**.

### Deploy the hook

Run this SQL in the **Supabase SQL editor** (or via `supabase db push`):

```sql
-- Function: inject gym_id + role into JWT claims
CREATE OR REPLACE FUNCTION public.custom_jwt_claims(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_gym_id text;
  user_role text;
BEGIN
  claims := event -> 'claims';

  SELECT u.gym_id::text, u.role::text
    INTO user_gym_id, user_role
    FROM public."User" u
   WHERE u.supabase_uid = (event ->> 'user_id')
   LIMIT 1;

  IF user_gym_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{gym_id}', to_jsonb(user_gym_id));
    claims := jsonb_set(claims, '{role}',   to_jsonb(user_role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;
```

Then in the Supabase Dashboard → **Authentication → Hooks**:
- Hook type: **Customize access token (JWT claims)**
- Function: `public.custom_jwt_claims`

### How the API reads claims

`apps/api/src/auth/auth.guard.ts` decodes the JWT and reads:
```
req.user.gymId  = token.gym_id
req.user.role   = token.role
req.user.supabaseUid = token.sub
```

The guard **never queries the database** — all tenant context comes from the JWT.

---

## 2. Row-Level Security (future)

Once the Auth Hook is deployed and validated, add RLS policies to all tenant-scoped tables:

```sql
-- Example: techniques table
ALTER TABLE "Technique" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gym_isolation" ON "Technique"
  USING (gym_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'gym_id'));
```

Apply the same pattern to: User, Flowchart, WeeklyPost, BeltTrack, TechniqueLog, ClassSchedule, Attendance, Subscription.

---

## 3. Environment Variables

### apps/api/.env
```
SUPABASE_JWT_SECRET=<from Supabase Dashboard → Settings → API → JWT Secret>
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

### apps/portal/.env.local
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<from Supabase Dashboard → Settings → API → anon public>
```

### apps/mobile/.env
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

---

## 4. First Gym Setup

After deploying the Auth Hook, create the first gym and user manually:

```sql
-- 1. Create gym
INSERT INTO public."Gym" (id, name, slug, primary_color, secondary_color)
VALUES (gen_random_uuid(), 'Demo Gym', 'demo-gym', '#1B4FD8', '#F59E0B');

-- 2. After signing up via Supabase Auth, link user to gym
UPDATE public."User"
   SET gym_id = '<gym-id-from-above>', role = 'INSTRUCTOR'
 WHERE supabase_uid = '<uid-from-supabase-auth>';
```
