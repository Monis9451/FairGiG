-- FairGiG — upvotes + comments on visible community posts (anonymous in feed; author_id not exposed in public APIs).
-- Apply in Supabase SQL Editor after community_posts exists.

create table if not exists public.community_post_upvotes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists community_post_upvotes_user_idx
  on public.community_post_upvotes (user_id);

create table if not exists public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists community_post_comments_post_created_idx
  on public.community_post_comments (post_id, created_at);

alter table public.community_post_upvotes enable row level security;
alter table public.community_post_comments enable row level security;

drop policy if exists "community_upvotes_select" on public.community_post_upvotes;
create policy "community_upvotes_select"
  on public.community_post_upvotes for select
  to authenticated
  using (true);

drop policy if exists "community_upvotes_insert_own" on public.community_post_upvotes;
create policy "community_upvotes_insert_own"
  on public.community_post_upvotes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "community_upvotes_delete_own" on public.community_post_upvotes;
create policy "community_upvotes_delete_own"
  on public.community_post_upvotes for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "community_comments_select_visible" on public.community_post_comments;
create policy "community_comments_select_visible"
  on public.community_post_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'visible'
    )
  );

drop policy if exists "community_comments_insert_visible" on public.community_post_comments;
create policy "community_comments_insert_visible"
  on public.community_post_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.community_posts p
      where p.id = post_id and p.status = 'visible'
    )
  );

-- Batch stats for feed (Node calls with service role).
create or replace function public.community_feed_engagement(p_ids uuid[], p_viewer uuid)
returns table (
  post_id uuid,
  upvote_count bigint,
  comment_count bigint,
  viewer_upvoted boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select x.id,
    coalesce(uc.c, 0::bigint),
    coalesce(cc.c, 0::bigint),
    coalesce(vu.v, false)
  from unnest(p_ids) as x(id)
  left join (
    select u.post_id, count(*)::bigint as c
    from public.community_post_upvotes u
    where u.post_id = any(p_ids)
    group by u.post_id
  ) uc on uc.post_id = x.id
  left join (
    select c.post_id, count(*)::bigint as c
    from public.community_post_comments c
    where c.post_id = any(p_ids)
    group by c.post_id
  ) cc on cc.post_id = x.id
  left join (
    select distinct u.post_id, true as v
    from public.community_post_upvotes u
    where u.post_id = any(p_ids) and u.user_id = p_viewer
  ) vu on vu.post_id = x.id;
$$;

grant execute on function public.community_feed_engagement(uuid[], uuid) to service_role;
grant execute on function public.community_feed_engagement(uuid[], uuid) to authenticated;
