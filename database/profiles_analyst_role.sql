-- FairGiG — allow profiles.role = 'analyst' (same app permissions as advocate).
-- Apply on existing Supabase projects where profiles.role check excludes analyst.
-- Safe to re-run: drops and recreates the check constraint.

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles add constraint profiles_role_check
  check (
    role = any (
      array['worker'::text, 'verifier'::text, 'advocate'::text, 'analyst'::text]
    )
  );

-- Optional PostgREST RLS: analysts see/update all community_posts like advocates.
do $$
begin
  if to_regclass('public.community_posts') is not null then
    drop policy if exists "community_posts_advocate_select" on public.community_posts;
    create policy "community_posts_advocate_select"
      on public.community_posts for select
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('advocate', 'analyst')
        )
      );

    drop policy if exists "community_posts_advocate_update" on public.community_posts;
    create policy "community_posts_advocate_update"
      on public.community_posts for update
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('advocate', 'analyst')
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('advocate', 'analyst')
        )
      );
  end if;
end
$$;
