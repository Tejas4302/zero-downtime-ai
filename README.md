# Zero Downtime

AI-powered industrial operations intelligence platform for the AI Builder Cup 2026 Manufacturing challenge.

## Architecture

- **Frontend:** Next.js, Firebase Authentication, Framer Motion, Recharts
- **Backend:** Node.js / Express on Cloud Run
- **Auth & tenancy:** Firebase Authentication + custom claims + Firestore
- **Analytics:** BigQuery
- **AI:** Gemini / BigQuery Conversational Analytics
- **Dataset:** AI4I 2020 Predictive Maintenance dataset, enriched into four fictional manufacturing tenants

## Demo tenants

- AutoMotion Motors
- PackPro Industries
- FlowCore Manufacturing
- FreshLine Foods

Each client has:
- 1 client admin account
- 1 standard account

Zero Downtime also has a super admin account with cross-client access.

## Repository structure

```
frontend/          Next.js web application
backend/           Cloud Run API
sql/               BigQuery transformation scripts
scripts/           Firebase user/claim setup utilities
firestore.rules    Firestore access-control rules
```

## Security model

The frontend never queries BigQuery directly.

```
Firebase Login
  -> Firebase ID token
  -> Cloud Run API
  -> Token verification
  -> role + client_id enforcement
  -> tenant-filtered BigQuery query
```

Client users cannot query another tenant by changing frontend parameters because tenant scope is enforced server-side.

## Backend deployment

From the `backend` folder:

```bash
npm install
gcloud run deploy zero-downtime-api \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

Protected API routes still require a valid Firebase ID token.

Current service URL:

```
https://zero-downtime-api-1052752541109.asia-south1.run.app
```

## Frontend setup

Copy:

```
frontend/.env.example
```

to:

```
frontend/.env.local
```

and populate the Firebase web configuration values.

Then:

```bash
cd frontend
npm install
npm run dev
```

## BigQuery pipeline

Run the SQL files in order:

1. `sql/01_asset_operations.sql`
2. `sql/02_asset_observations.sql`
3. `sql/03_current_asset_health.sql`
4. `sql/04_client_summary_and_alerts.sql`

The final serving tables are:

- `current_asset_health`
- `client_summary`
- `active_alerts`
- `asset_observations`

## Important

Do not commit passwords, Firebase private credentials, service-account keys, or `.env.local`.


## One-command deployment

GitHub is the source of truth for the application code.

In Cloud Shell:

```bash
cd ~/zero-downtime-ai-github
git pull origin main
bash scripts/deploy-all.sh
```

The deployment script validates the backend, builds the frontend, and deploys both Cloud Run services.

The frontend still requires a local `frontend/.env.local` file because Firebase web configuration is injected during the Next.js build. This file remains outside Git and must not contain private service-account credentials.

## GitHub validation

Every push to `main` now runs a GitHub Actions workflow that:

- checks backend JavaScript syntax
- installs backend dependencies
- builds the Next.js frontend
- catches syntax/type/build failures before the code is pulled into GCP
