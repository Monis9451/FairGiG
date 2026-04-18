# FairGiG — Anomaly service (Python FastAPI)

Detects **unusually low net income** and **unusually high deduction share** (commission vs gross) for a worker, compared to their own **verified** earnings history in Supabase.

## Run locally

```bash
cd service-anomaly-python
cp .env.example .env
# Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role required for JWT validation + optional DB history).

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Open `http://localhost:8001/docs` for interactive API docs.

## Database

Apply `../database/anomaly_runs.sql` in the Supabase SQL editor so analyze results can be **persisted** (`run_id` in responses). Without this table, analysis still returns but `persist_warning` may be set.

## Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/status` | Service metadata |
| POST | `/api/v1/analyze` | Run detection (JWT). Default: **HTTP 200** with `data.ready=false` if verified history &lt; minimum; set `strict_history: true` for **HTTP 422** instead. |
| GET | `/api/v1/runs` | Paginated audit rows (`limit`/`offset`). Workers: self only; staff: optional `worker_id` filter or recent global list. |

## Auth & roles

Bearer JWT (Supabase access token). Profile roles: `worker`, `verifier`, `advocate`, `analyst`. Workers may only analyze **their** `worker_id`; staff may pass `worker_id` for another subject.

## Environment

See `.env.example`. Key tunables:

- `ANOMALY_ZSCORE_THRESHOLD` — net z-score guardrail (negative tail)
- `ANOMALY_PERCENT_DROP_THRESHOLD` — % drop vs mean net
- `ANOMALY_DEDUCTION_ZSCORE_THRESHOLD` — high deduction-share vs history
- `ANOMALY_MIN_HISTORY_POINTS` — minimum verified history rows (default 7)
- `ANOMALY_LIST_RUNS_MAX_LIMIT` — cap for `GET /runs` (max 100)

## BFF (browser)

The grievance Node service proxies `POST /api/v1/anomaly/analyze` and `GET /api/v1/anomaly/runs` under the same paths when `ANOMALY_SERVICE_URL` is set.
