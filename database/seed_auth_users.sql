-- FairGiG — seed Auth users + profiles (run in Supabase SQL Editor, dev/staging only).
--
-- 25 users: 20 workers, 3 verifiers, 2 advocates.
-- Emails: seed.worker.NN@fairgig.dev, seed.verifier.NN@fairgig.dev, seed.advocate.NN@fairgig.dev
-- Password for ALL seeded users: FairGigDev123!
--
-- Emails use a normal-looking domain so GoTrue accepts them (avoid odd TLDs like .seed).
-- For email provider, auth.identities.provider_id MUST equal the email string (not the user UUID).
--
-- Re-run safe: deletes previous rows for these emails + legacy @fairgig.seed seeds, then reinserts.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Remove old demo data tied to seed users (FK order)
-- ---------------------------------------------------------------------------
delete from public.grievances
where worker_id in (
  select id from auth.users
  where email like 'seed.%@fairgig.dev'
     or email in (
       'worker@fairgig.seed',
       'verifier@fairgig.seed',
       'advocate@fairgig.seed'
     )
);

delete from public.earnings
where worker_id in (
  select id from auth.users
  where email like 'seed.%@fairgig.dev'
     or email in (
       'worker@fairgig.seed',
       'verifier@fairgig.seed',
       'advocate@fairgig.seed'
     )
);

delete from public.profiles
where id in (
  select id from auth.users
  where email like 'seed.%@fairgig.dev'
     or email in (
       'worker@fairgig.seed',
       'verifier@fairgig.seed',
       'advocate@fairgig.seed'
     )
);

delete from auth.identities
where user_id in (
  select id from auth.users
  where email like 'seed.%@fairgig.dev'
     or email in (
       'worker@fairgig.seed',
       'verifier@fairgig.seed',
       'advocate@fairgig.seed'
     )
);

delete from auth.users
where email like 'seed.%@fairgig.dev'
   or email in (
     'worker@fairgig.seed',
     'verifier@fairgig.seed',
     'advocate@fairgig.seed'
   );

-- ---------------------------------------------------------------------------
-- auth.users + auth.identities (password: FairGigDev123!)
-- ---------------------------------------------------------------------------

-- Workers 01–20
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
)
values
  ('fa000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.01@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 01"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.02@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 02"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.03@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 03"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.04@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 04"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.05@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 05"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.06@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 06"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.07@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 07"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.08@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 08"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.09@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 09"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.10@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 10"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.11@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 11"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.12@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 12"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.13@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 13"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.14@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 14"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.15@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 15"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000016', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.16@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 16"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000017', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.17@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 17"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000018', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.18@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 18"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000019', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.19@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 19"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.worker.20@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Worker 20"}', now(), now(), '', '');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('fa000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000001', 'email', 'seed.worker.01@fairgig.dev'),
   'email', 'seed.worker.01@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000002', 'fa000000-0000-4000-8000-000000000002',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000002', 'email', 'seed.worker.02@fairgig.dev'),
   'email', 'seed.worker.02@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000003', 'fa000000-0000-4000-8000-000000000003',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000003', 'email', 'seed.worker.03@fairgig.dev'),
   'email', 'seed.worker.03@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000004', 'fa000000-0000-4000-8000-000000000004',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000004', 'email', 'seed.worker.04@fairgig.dev'),
   'email', 'seed.worker.04@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000005', 'fa000000-0000-4000-8000-000000000005',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000005', 'email', 'seed.worker.05@fairgig.dev'),
   'email', 'seed.worker.05@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000006', 'fa000000-0000-4000-8000-000000000006',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000006', 'email', 'seed.worker.06@fairgig.dev'),
   'email', 'seed.worker.06@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000007', 'fa000000-0000-4000-8000-000000000007',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000007', 'email', 'seed.worker.07@fairgig.dev'),
   'email', 'seed.worker.07@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000008', 'fa000000-0000-4000-8000-000000000008',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000008', 'email', 'seed.worker.08@fairgig.dev'),
   'email', 'seed.worker.08@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000009', 'fa000000-0000-4000-8000-000000000009',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000009', 'email', 'seed.worker.09@fairgig.dev'),
   'email', 'seed.worker.09@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000010', 'fa000000-0000-4000-8000-000000000010',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000010', 'email', 'seed.worker.10@fairgig.dev'),
   'email', 'seed.worker.10@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000011', 'fa000000-0000-4000-8000-000000000011',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000011', 'email', 'seed.worker.11@fairgig.dev'),
   'email', 'seed.worker.11@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000012', 'fa000000-0000-4000-8000-000000000012',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000012', 'email', 'seed.worker.12@fairgig.dev'),
   'email', 'seed.worker.12@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000013', 'fa000000-0000-4000-8000-000000000013',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000013', 'email', 'seed.worker.13@fairgig.dev'),
   'email', 'seed.worker.13@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000014', 'fa000000-0000-4000-8000-000000000014',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000014', 'email', 'seed.worker.14@fairgig.dev'),
   'email', 'seed.worker.14@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000015', 'fa000000-0000-4000-8000-000000000015',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000015', 'email', 'seed.worker.15@fairgig.dev'),
   'email', 'seed.worker.15@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000016', 'fa000000-0000-4000-8000-000000000016',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000016', 'email', 'seed.worker.16@fairgig.dev'),
   'email', 'seed.worker.16@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000017', 'fa000000-0000-4000-8000-000000000017',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000017', 'email', 'seed.worker.17@fairgig.dev'),
   'email', 'seed.worker.17@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000018', 'fa000000-0000-4000-8000-000000000018',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000018', 'email', 'seed.worker.18@fairgig.dev'),
   'email', 'seed.worker.18@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000019', 'fa000000-0000-4000-8000-000000000019',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000019', 'email', 'seed.worker.19@fairgig.dev'),
   'email', 'seed.worker.19@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000020', 'fa000000-0000-4000-8000-000000000020',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000020', 'email', 'seed.worker.20@fairgig.dev'),
   'email', 'seed.worker.20@fairgig.dev', now(), now(), now());

-- Verifiers 01–03
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
)
values
  ('fa000000-0000-4000-8000-000000000021', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.verifier.01@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Verifier 01"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000022', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.verifier.02@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Verifier 02"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000023', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.verifier.03@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Verifier 03"}', now(), now(), '', '');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('fa000000-0000-4000-8000-000000000021', 'fa000000-0000-4000-8000-000000000021',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000021', 'email', 'seed.verifier.01@fairgig.dev'),
   'email', 'seed.verifier.01@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000022', 'fa000000-0000-4000-8000-000000000022',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000022', 'email', 'seed.verifier.02@fairgig.dev'),
   'email', 'seed.verifier.02@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000023', 'fa000000-0000-4000-8000-000000000023',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000023', 'email', 'seed.verifier.03@fairgig.dev'),
   'email', 'seed.verifier.03@fairgig.dev', now(), now(), now());

-- Advocates 01–02
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
)
values
  ('fa000000-0000-4000-8000-000000000024', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.advocate.01@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Advocate 01"}', now(), now(), '', ''),
  ('fa000000-0000-4000-8000-000000000025', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'seed.advocate.02@fairgig.dev', crypt('FairGigDev123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Seed Advocate 02"}', now(), now(), '', '');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
values
  ('fa000000-0000-4000-8000-000000000024', 'fa000000-0000-4000-8000-000000000024',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000024', 'email', 'seed.advocate.01@fairgig.dev'),
   'email', 'seed.advocate.01@fairgig.dev', now(), now(), now()),
  ('fa000000-0000-4000-8000-000000000025', 'fa000000-0000-4000-8000-000000000025',
   jsonb_build_object('sub', 'fa000000-0000-4000-8000-000000000025', 'email', 'seed.advocate.02@fairgig.dev'),
   'email', 'seed.advocate.02@fairgig.dev', now(), now(), now());

-- ---------------------------------------------------------------------------
-- public.profiles (app roles; trigger would use worker only — we set real mix here)
-- ---------------------------------------------------------------------------
insert into public.profiles (id, full_name, role, city_zone)
values
  ('fa000000-0000-4000-8000-000000000001', 'Seed Worker 01', 'worker', 'Gulberg'),
  ('fa000000-0000-4000-8000-000000000002', 'Seed Worker 02', 'worker', 'Faisal Town'),
  ('fa000000-0000-4000-8000-000000000003', 'Seed Worker 03', 'worker', 'Johar Town'),
  ('fa000000-0000-4000-8000-000000000004', 'Seed Worker 04', 'worker', 'Model Town'),
  ('fa000000-0000-4000-8000-000000000005', 'Seed Worker 05', 'worker', 'DHA'),
  ('fa000000-0000-4000-8000-000000000006', 'Seed Worker 06', 'worker', 'Gulberg'),
  ('fa000000-0000-4000-8000-000000000007', 'Seed Worker 07', 'worker', 'Faisal Town'),
  ('fa000000-0000-4000-8000-000000000008', 'Seed Worker 08', 'worker', 'Johar Town'),
  ('fa000000-0000-4000-8000-000000000009', 'Seed Worker 09', 'worker', 'Model Town'),
  ('fa000000-0000-4000-8000-000000000010', 'Seed Worker 10', 'worker', 'DHA'),
  ('fa000000-0000-4000-8000-000000000011', 'Seed Worker 11', 'worker', 'Gulberg'),
  ('fa000000-0000-4000-8000-000000000012', 'Seed Worker 12', 'worker', 'Faisal Town'),
  ('fa000000-0000-4000-8000-000000000013', 'Seed Worker 13', 'worker', 'Johar Town'),
  ('fa000000-0000-4000-8000-000000000014', 'Seed Worker 14', 'worker', 'Model Town'),
  ('fa000000-0000-4000-8000-000000000015', 'Seed Worker 15', 'worker', 'DHA'),
  ('fa000000-0000-4000-8000-000000000016', 'Seed Worker 16', 'worker', 'Gulberg'),
  ('fa000000-0000-4000-8000-000000000017', 'Seed Worker 17', 'worker', 'Faisal Town'),
  ('fa000000-0000-4000-8000-000000000018', 'Seed Worker 18', 'worker', 'Johar Town'),
  ('fa000000-0000-4000-8000-000000000019', 'Seed Worker 19', 'worker', 'Model Town'),
  ('fa000000-0000-4000-8000-000000000020', 'Seed Worker 20', 'worker', 'DHA'),
  ('fa000000-0000-4000-8000-000000000021', 'Seed Verifier 01', 'verifier', 'Gulberg'),
  ('fa000000-0000-4000-8000-000000000022', 'Seed Verifier 02', 'verifier', 'Johar Town'),
  ('fa000000-0000-4000-8000-000000000023', 'Seed Verifier 03', 'verifier', 'DHA'),
  ('fa000000-0000-4000-8000-000000000024', 'Seed Advocate 01', 'advocate', 'Lahore'),
  ('fa000000-0000-4000-8000-000000000025', 'Seed Advocate 02', 'advocate', 'Lahore')
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  city_zone = excluded.city_zone;

-- ---------------------------------------------------------------------------
-- Safety: keep provider_id = email for all email identities (idempotent)
-- ---------------------------------------------------------------------------
update auth.identities i
set provider_id = u.email
from auth.users u
where i.user_id = u.id
  and i.provider = 'email'
  and i.provider_id is distinct from u.email;
