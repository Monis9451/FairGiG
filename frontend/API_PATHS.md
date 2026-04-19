FairGiG — developer quick reference (URLs + database)
=====================================================

Supabase (live project)
-----------------------
Organization (dashboard name): zadif
Project name: FairGig
Project ref: cylloibqpsqqcesmsigg

API URL (REST / Realtime base):
https://cylloibqpsqqcesmsigg.supabase.co

Useful dashboard pages:
- Project home:     https://supabase.com/dashboard/project/cylloibqpsqqcesmsigg
- API keys / URL:   https://supabase.com/dashboard/project/cylloibqpsqqcesmsigg/settings/api
- Table editor:     https://supabase.com/dashboard/project/cylloibqpsqqcesmsigg/editor
- SQL editor:       https://supabase.com/dashboard/project/cylloibqpsqqcesmsigg/sql/new
- Auth users:       https://supabase.com/dashboard/project/cylloibqpsqqcesmsigg/auth/users

Repo SQL (paste into SQL editor as needed):
- database/on_auth_user_create_profile.sql — auto-create profile on sign-up
- database/seed_auth_users.sql — dev users (worker / verifier / advocate) + auth + profiles; password in file header

Tables in schema "public" (from Supabase; RLS enabled on all)
--------------------------------------------------------------
1) profiles
   - id (uuid, PK), full_name, role (worker|verifier|advocate), city_zone, created_at
   - id references auth.users(id)
   - Referenced by: earnings.worker_id, grievances.worker_id

2) earnings
   - id (uuid, PK), worker_id → profiles.id, platform, date, hours_worked, gross_earned,
     deductions, net_received, screenshot_url, status (pending|verified|flagged),
     anomaly_explanation, created_at

3) grievances
   - id (uuid, PK), worker_id → profiles.id, platform, category, description,
     status (open|escalated|resolved), tags (text[]), created_at

4) market_benchmarks
   - id (uuid, PK), platform, city_zone, avg_hourly_pay, avg_deduction_rate, created_at

Row counts (snapshot; change as you seed data): profiles 0, earnings 0, grievances 0, market_benchmarks 3

Human-readable schema notes in repo: backend/schema.txt

Local services (default ports — override with .env)
----------------------------------------------------
API gateway (service-api-gateway-node), default PORT=5000 — browser calls this host only:
- Root / health:    http://localhost:5000/ , http://localhost:5000/health
- Downstream probe: http://localhost:5000/services/health
- Proxied auth: POST http://localhost:5000/api/v1/auth/signup , /login (see `service-auth-node` on 5010)
- On gateway: GET http://localhost:5000/api/v1/me , GET /api/v1/verifier/ping (Bearer)
- Swagger UI:       http://localhost:5000/api-docs
- OpenAPI file:     `service-api-gateway-node/docs/openapi.yaml` (`/openapi.yaml`, `/openapi.json`)
- Data APIs (Bearer): `/api/grievances`, `/api/community`, `/api/analytics/...`, `/api/certificates/...` (implemented in separate Node services; see repo `DEV_LINKS.txt`)

Python — Earnings (service-earnings-python), default PORT=8000:
- Swagger / docs:   http://localhost:8000/docs
- ReDoc:            http://localhost:8000/redoc

Python — Anomaly (service-anomaly-python), default PORT=8001:
- Swagger / docs:   http://localhost:8001/docs
- ReDoc:            http://localhost:8001/redoc

Frontend (when added; Vite default):
- http://localhost:5173

Environment templates
---------------------
service-api-gateway-node/.env.example (+ Node microservice `.env.example` files in repo root)
service-earnings-python/.env.example
service-anomaly-python/.env.example

Copy to .env in each service folder and paste Supabase keys from Project Settings → API.

GitHub
------
Use your team repo URL here (clone / PRs). Example pattern:
https://github.com/<org-or-user>/FairGiG
