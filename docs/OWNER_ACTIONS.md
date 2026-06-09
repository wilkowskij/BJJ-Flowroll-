# FlowMat — Owner Action Items
> Things only you can do. Code is ready; these require accounts, credentials, or real-money decisions.

---

## 🔴 BLOCKING — Must complete before the app can run at all

### 1. Create Supabase project
**Why:** Auth, JWT, and the database all run on Supabase.

1. Go to https://supabase.com → New project
2. Name it `flowmat-prod` (or `flowmat-dev` for dev first)
3. Choose region: `us-east-1`
4. Copy the values you'll need:
   - **Project URL** → `VITE_SUPABASE_URL` (portal) + `EXPO_PUBLIC_SUPABASE_URL` (mobile)
   - **Anon/public key** → `VITE_SUPABASE_ANON_KEY` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **JWT Secret** (Settings → API → JWT Secret) → `SUPABASE_JWT_SECRET` (API)
   - **Database password** → part of `DATABASE_URL`

### 2. Deploy Supabase Auth Hook SQL
**Why:** Without this, `gym_id` and `role` are NOT in JWT tokens — the entire multi-tenant system breaks.

1. In Supabase Dashboard → SQL Editor
2. Paste the SQL from `docs/SUPABASE_SETUP.md` (the `custom_jwt_claims` function)
3. Run it
4. Go to Authentication → Hooks
5. Set **Customize access token** → `public.custom_jwt_claims`

### 3. Run database migration locally
**Why:** The `Announcement` table was added to the schema but not yet migrated.

```bash
cd apps/api
cp .env.example .env
# fill in DATABASE_URL with your Supabase DB connection string
npm install
npx prisma migrate dev --name add-announcement-table
npx prisma generate
```

### 4. Set all environment variables
Copy `apps/api/.env.example` → `apps/api/.env` and fill in every value.
Copy `apps/portal/.env.example` → `apps/portal/.env.local`.

---

## 🟡 HIGH PRIORITY — Needed before first paying gym

### 5. Create AWS account + S3 bucket
**Why:** Video uploads go to S3 before Mux processes them.

1. Go to https://aws.amazon.com → Create account
2. Create S3 bucket named `flowmat-videos` (region: `us-east-1`, **Block all public access**)
3. Create IAM user with policy: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::flowmat-videos/*`
4. Generate access key → add to `.env`:
   ```
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=flowmat-videos
   AWS_ACCESS_KEY_ID=<key>
   AWS_SECRET_ACCESS_KEY=<secret>
   ```

### 6. Create Mux account
**Why:** All video hosting and CDN delivery runs through Mux.

1. Go to https://mux.com → Sign up
2. Settings → API Access Tokens → Create new token (full access)
3. Settings → Webhooks → Add endpoint: `https://your-api-domain.com/api/v1/video/mux-webhook`
4. Copy the webhook signing secret
5. Add to `.env`:
   ```
   MUX_TOKEN_ID=<token id>
   MUX_TOKEN_SECRET=<token secret>
   MUX_WEBHOOK_SECRET=<webhook signing secret>
   ```

### 7. Create Stripe account
**Why:** Gym billing (monthly per-student charges) runs through Stripe.

1. Go to https://stripe.com → Create account (use your business name)
2. Developers → API keys → copy **Secret key** (live key for prod, test key for dev)
3. Developers → Webhooks → Add endpoint: `https://your-api-domain.com/api/v1/subscription/stripe-webhook`
   - Events to listen to: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
4. Copy the webhook signing secret
5. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
6. Create products in Stripe Dashboard:
   - "FlowMat Starter" — $4/unit (unit = student)
   - "FlowMat Growth" — $5/unit
   - "FlowMat Pro" — $6/unit

### 8. Create Firebase project (for push notifications)
**Why:** FCM sends push notifications to iOS and Android students.

1. Go to https://console.firebase.google.com → New project → `flowmat-prod`
2. Project Settings → Service accounts → Generate new private key
3. Download the JSON file — extract:
   ```
   FIREBASE_PROJECT_ID=<projectId>
   FIREBASE_CLIENT_EMAIL=<client_email>
   FIREBASE_PRIVATE_KEY=<private_key>  # keep the \n characters
   ```
4. Add Firebase to iOS app: Project Settings → iOS app → download `GoogleService-Info.plist`
5. Add Firebase to Android: Project Settings → Android app → download `google-services.json`
6. Place both files in `apps/mobile/` (they are gitignored)

---

## 🟢 BEFORE APP STORE SUBMISSION

### 9. Apple Developer Account
**Cost:** $99/year

1. Go to https://developer.apple.com → Enroll
2. You need: D-U-N-S number (for org accounts), or just Apple ID (individual)
3. Once enrolled, you'll need the **Team ID** for Expo EAS config
4. Create an App ID for FlowMat: bundle ID `com.flowmat.app`

### 10. Google Play Developer Account
**Cost:** $25 one-time

1. Go to https://play.google.com/console → Create account
2. Create app: `FlowMat — BJJ Training`
3. Package name: `com.flowmat.app`

### 11. Configure Expo EAS (for mobile builds + OTA updates)
```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build:configure
# This creates eas.json — commit it
```

### 12. Deploy Instructor Portal to Vercel
1. Go to https://vercel.com → Import Git repository
2. Select `wilkowskij/BJJ-Flowroll-`
3. Root directory: `apps/portal`
4. Framework: Vite
5. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (your API domain)
6. Deploy → note the URL for your domain DNS

### 13. Set up API hosting (AWS ECS or Railway for dev)
**For development (simpler):** Use Railway.app or Render.com — connect the repo, point to `apps/api`, add env vars.
**For production:** AWS ECS with ECR (code scaffolding ready in the checklist).

---

## 📋 COMPLETE ENV VAR REFERENCE

### `apps/api/.env`
```bash
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
REDIS_URL=redis://localhost:6379
SUPABASE_JWT_SECRET=<from Supabase Settings → API → JWT Secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=flowmat-videos
AWS_ACCESS_KEY_ID=<iam key>
AWS_SECRET_ACCESS_KEY=<iam secret>
MUX_TOKEN_ID=<mux token id>
MUX_TOKEN_SECRET=<mux token secret>
MUX_WEBHOOK_SECRET=<mux webhook secret>
FIREBASE_PROJECT_ID=<firebase project id>
FIREBASE_CLIENT_EMAIL=<service account email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=3000
```

### `apps/portal/.env.local`
```bash
VITE_SUPABASE_URL=https://[ref].supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_API_URL=https://api.flowmat.app
```

### `apps/mobile/.env`
```bash
EXPO_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
EXPO_PUBLIC_API_URL=https://api.flowmat.app
```
