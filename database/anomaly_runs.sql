-- Anomaly service audit trail (inserted by service-anomaly-python with service role).
-- Apply in Supabase SQL editor or via migration tooling.

create table if not exists public.anomaly_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  worker_id uuid not null references public.profiles (id) on delete cascade,
  shift_log_id uuid references public.earnings (id) on delete set null,
  triggered_by_user_id uuid references public.profiles (id) on delete set null,
  triggered_by_role text not null,

  platform text,
  current_shift_date date not null,

  ready boolean not null,
  insufficient_reason text,
  is_anomaly boolean,

  explanation text,
  method text,
  data_source text,

  net_z_score double precision,
  percent_drop double precision,
  is_net_anomaly boolean,

  deduction_share_z_score double precision,
  current_deduction_ratio double precision,
  mean_deduction_ratio double precision,
  is_deduction_anomaly boolean,

  history_count integer not null default 0,
  thresholds jsonb,
  detail jsonb
);

create index if not exists idx_anomaly_runs_worker_created
  on public.anomaly_runs (worker_id, created_at desc);

create index if not exists idx_anomaly_runs_triggered_by
  on public.anomaly_runs (triggered_by_user_id, created_at desc);

create index if not exists idx_anomaly_runs_shift
  on public.anomaly_runs (shift_log_id)
  where shift_log_id is not null;

comment on table public.anomaly_runs is 'Per-request outputs from the FastAPI anomaly detection service (net + deduction signals).';

alter table public.anomaly_runs enable row level security;

-- Authenticated users read their own runs as subject worker; staff roles read all.
create policy "anomaly_runs_select_own_worker"
  on public.anomaly_runs
  for select
  to authenticated
  using (
    worker_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('verifier', 'advocate', 'analyst')
    )
  );

-- Inserts/updates are performed with service role (bypasses RLS). No insert policy for JWT clients.
