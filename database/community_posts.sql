-- FairGiG — worker community bulletin (anonymous to peers; advocates moderate).
-- Run in Supabase SQL Editor, or applied via Supabase migration / MCP.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'community_post_status') then
    create type public.community_post_status as enum ('pending', 'visible', 'hidden', 'removed');
  end if;
end
$$;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  body text not null,
  platform text,
  category text not null default 'general',
  tags text[] not null default '{}',
  status public.community_post_status not null default 'pending',
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_status_created_idx
  on public.community_posts (status, created_at desc);

create index if not exists community_posts_author_idx
  on public.community_posts (author_id);

alter table public.community_posts enable row level security;

-- Direct PostgREST access (optional). Node uses service role and bypasses RLS.
drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
  on public.community_posts for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "community_posts_select_own" on public.community_posts;
create policy "community_posts_select_own"
  on public.community_posts for select
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "community_posts_select_visible" on public.community_posts;
create policy "community_posts_select_visible"
  on public.community_posts for select
  to authenticated
  using (status = 'visible');

drop policy if exists "community_posts_advocate_select" on public.community_posts;
create policy "community_posts_advocate_select"
  on public.community_posts for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'advocate'
    )
  );

drop policy if exists "community_posts_advocate_update" on public.community_posts;
create policy "community_posts_advocate_update"
  on public.community_posts for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'advocate'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'advocate'
    )
  );

drop policy if exists "community_posts_update_own_pending" on public.community_posts;
create policy "community_posts_update_own_pending"
  on public.community_posts for update
  to authenticated
  using (author_id = auth.uid() and status = 'pending')
  with check (author_id = auth.uid());
