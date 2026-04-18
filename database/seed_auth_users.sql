-- FairGiG — seed Auth users + profiles (run in Supabase SQL Editor, dev/staging only).
-- Password for all three below: FairGigDev123!
-- Change emails/passwords before any shared environment.

create extension if not exists "pgcrypto";

-- Optional dev cleanup (only these emails). Comment out if you prefer not to delete.
-- Order: app tables referencing profiles → profiles → identities → users.
delete from public.grievances
where worker_id in (
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222202',
  '33333333-3333-3333-3333-333333333303'
);
delete from public.earnings
where worker_id in (
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222202',
  '33333333-3333-3333-3333-333333333303'
);
delete from public.profiles
where id in (
  '11111111-1111-1111-1111-111111111101',
  '22222222-2222-2222-2222-222222222202',
  '33333333-3333-3333-3333-333333333303'
);
delete from auth.identities
where user_id in (select id from auth.users where email in (
  'worker@fairgig.seed',
  'verifier@fairgig.seed',
  'advocate@fairgig.seed'
));
delete from auth.users where email in (
  'worker@fairgig.seed',
  'verifier@fairgig.seed',
  'advocate@fairgig.seed'
);

-- Stable UUIDs so you can reference them in tests / manual SQL.
-- worker
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
values (
  '11111111-1111-1111-1111-111111111101',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'worker@fairgig.seed',
  crypt('FairGigDev123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Seed Worker"}',
  now(),
  now(),
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111101',
  jsonb_build_object(
    'sub', '11111111-1111-1111-1111-111111111101',
    'email', 'worker@fairgig.seed'
  ),
  'email',
  '11111111-1111-1111-1111-111111111101',
  now(),
  now(),
  now()
);

-- verifier
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
values (
  '22222222-2222-2222-2222-222222222202',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'verifier@fairgig.seed',
  crypt('FairGigDev123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Seed Verifier"}',
  now(),
  now(),
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '22222222-2222-2222-2222-222222222202',
  '22222222-2222-2222-2222-222222222202',
  jsonb_build_object(
    'sub', '22222222-2222-2222-2222-222222222202',
    'email', 'verifier@fairgig.seed'
  ),
  'email',
  '22222222-2222-2222-2222-222222222202',
  now(),
  now(),
  now()
);

-- advocate
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
values (
  '33333333-3333-3333-3333-333333333303',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'advocate@fairgig.seed',
  crypt('FairGigDev123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Seed Advocate"}',
  now(),
  now(),
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '33333333-3333-3333-3333-333333333303',
  '33333333-3333-3333-3333-333333333303',
  jsonb_build_object(
    'sub', '33333333-3333-3333-3333-333333333303',
    'email', 'advocate@fairgig.seed'
  ),
  'email',
  '33333333-3333-3333-3333-333333333303',
  now(),
  now(),
  now()
);

-- Profiles (upsert so this works whether or not on_auth_user_created trigger ran)
insert into public.profiles (id, full_name, role, city_zone)
values
  ('11111111-1111-1111-1111-111111111101', 'Seed Worker', 'worker', 'Gulberg'),
  ('22222222-2222-2222-2222-222222222202', 'Seed Verifier', 'verifier', 'Gulberg'),
  ('33333333-3333-3333-3333-333333333303', 'Seed Advocate', 'advocate', 'Lahore')
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  city_zone = excluded.city_zone;
