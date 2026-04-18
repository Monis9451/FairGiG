-- Allow verifiers to mark a shift log as unverifiable (cannot confirm from evidence).
alter table public.earnings drop constraint if exists earnings_status_check;

alter table public.earnings add constraint earnings_status_check
  check (
    status = any (
      array[
        'pending'::text,
        'verified'::text,
        'flagged'::text,
        'unverifiable'::text
      ]
    )
  );
