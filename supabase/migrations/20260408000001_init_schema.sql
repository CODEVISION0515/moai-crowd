-- ============================================================
-- MOAI Crowd 初期スキーマ
-- ユーザーは auth.users (Supabase Auth) を参照
-- ============================================================

-- 拡張
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUM 型
-- ============================================================
create type job_status as enum ('draft', 'open', 'in_progress', 'completed', 'canceled');
create type proposal_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');
create type contract_status as enum ('funded', 'working', 'submitted', 'released', 'disputed', 'refunded');
create type transaction_kind as enum ('escrow_fund', 'escrow_release', 'platform_fee', 'refund');

-- ============================================================
-- profiles
-- ============================================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  display_name text not null,
  avatar_url text,
  bio text,
  skills text[] default '{}',
  hourly_rate_jpy integer,
  location text,
  website text,
  is_client boolean default true,
  is_worker boolean default true,
  stripe_account_id text,          -- Stripe Connect 受注者用
  stripe_customer_id text,         -- 発注者用
  rating_avg numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 新規ユーザー登録時に profile 自動生成
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, handle, display_name)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'display_name', 'User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- jobs (案件)
-- ============================================================
create table jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  skills text[] default '{}',
  budget_min_jpy integer,
  budget_max_jpy integer,
  budget_type text check (budget_type in ('fixed', 'hourly')) default 'fixed',
  deadline date,
  status job_status default 'open',
  proposal_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on jobs (status, created_at desc);
create index on jobs (client_id);
create index on jobs using gin (skills);

-- ============================================================
-- proposals (応募)
-- ============================================================
create table proposals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  cover_letter text not null,
  proposed_amount_jpy integer not null,
  proposed_days integer,
  status proposal_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (job_id, worker_id)
);

create index on proposals (job_id, status);
create index on proposals (worker_id);

-- proposal追加時にjobのcount更新
create or replace function update_job_proposal_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update jobs set proposal_count = proposal_count + 1 where id = new.job_id;
  elsif TG_OP = 'DELETE' then
    update jobs set proposal_count = proposal_count - 1 where id = old.job_id;
  end if;
  return null;
end;
$$;
create trigger trg_update_job_proposal_count
  after insert or delete on proposals
  for each row execute function update_job_proposal_count();

-- ============================================================
-- contracts (成約 - エスクロー)
-- ============================================================
create table contracts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  proposal_id uuid not null references proposals(id),
  client_id uuid not null references profiles(id),
  worker_id uuid not null references profiles(id),
  amount_jpy integer not null,
  platform_fee_jpy integer not null,
  worker_payout_jpy integer not null,
  status contract_status default 'funded',
  stripe_payment_intent_id text,
  funded_at timestamptz,
  released_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on contracts (client_id, status);
create index on contracts (worker_id, status);

-- ============================================================
-- threads & messages (チャット)
-- ============================================================
create table threads (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete set null,
  client_id uuid not null references profiles(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (job_id, client_id, worker_id)
);

create index on threads (client_id, last_message_at desc);
create index on threads (worker_id, last_message_at desc);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index on messages (thread_id, created_at);

create or replace function touch_thread_on_message()
returns trigger language plpgsql as $$
begin
  update threads set last_message_at = new.created_at where id = new.thread_id;
  return new;
end;
$$;
create trigger trg_touch_thread after insert on messages
  for each row execute function touch_thread_on_message();

-- ============================================================
-- reviews (評価)
-- ============================================================
create table reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (contract_id, reviewer_id)
);

create index on reviews (reviewee_id);

-- 評価更新で profiles の平均を再計算
create or replace function recalc_profile_rating()
returns trigger language plpgsql as $$
declare target uuid;
begin
  target := coalesce(new.reviewee_id, old.reviewee_id);
  update profiles set
    rating_avg = coalesce((select avg(rating)::numeric(3,2) from reviews where reviewee_id = target), 0),
    rating_count = (select count(*) from reviews where reviewee_id = target)
  where id = target;
  return null;
end;
$$;
create trigger trg_recalc_rating
  after insert or update or delete on reviews
  for each row execute function recalc_profile_rating();

-- ============================================================
-- transactions (決済履歴)
-- ============================================================
create table transactions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete set null,
  kind transaction_kind not null,
  amount_jpy integer not null,
  stripe_ref text,
  note text,
  created_at timestamptz default now()
);

create index on transactions (contract_id);
