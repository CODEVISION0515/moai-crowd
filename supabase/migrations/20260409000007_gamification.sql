-- ============================================================
-- ゲームフィケーション: XP・レベル・バッジ・連続ログイン・クエスト
-- ============================================================

-- profilesに追加
alter table profiles add column xp integer default 0;
alter table profiles add column level integer default 1;
alter table profiles add column streak_days integer default 0;
alter table profiles add column last_active_date date;

-- XPイベント履歴
create type xp_reason as enum (
  'signup', 'profile_complete', 'first_post', 'post_created', 'comment_created',
  'received_like', 'first_proposal', 'first_contract', 'contract_completed',
  'five_star_review', 'daily_login', 'streak_bonus', 'event_attended'
);

create table xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  reason xp_reason not null,
  amount integer not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index on xp_events (user_id, created_at desc);

alter table xp_events enable row level security;
create policy "xp events readable by owner"
  on xp_events for select using (user_id = auth.uid());

-- バッジ
create table badges (
  slug text primary key,
  name text not null,
  description text not null,
  icon text,
  tier text check (tier in ('bronze','silver','gold','platinum')) default 'bronze',
  xp_reward integer default 0
);

insert into badges (slug, name, description, icon, tier, xp_reward) values
  ('welcome', 'ようこそ', '初めてMOAI Crowdに登録', '👋', 'bronze', 10),
  ('profile_master', 'プロフィール達人', '自己紹介・スキル・アイコンをすべて設定', '📝', 'bronze', 20),
  ('first_post', '初投稿', '最初の投稿を公開', '✍️', 'bronze', 15),
  ('first_proposal', '初応募', '初めて案件に応募', '📨', 'bronze', 20),
  ('first_client', '初発注', '初めて案件を発注', '💼', 'bronze', 20),
  ('first_contract', '初成約', '初めての契約を獲得', '🤝', 'silver', 50),
  ('five_star', '完璧な納品', '★5レビューを獲得', '⭐', 'silver', 30),
  ('ten_contracts', 'ベテラン', '10件の契約を完了', '🏆', 'gold', 200),
  ('streak_7', '7日連続', '7日連続でログイン', '🔥', 'silver', 30),
  ('streak_30', '30日連続', '30日連続でログイン', '🔥', 'gold', 150),
  ('helpful', '助け合い上手', '10件のコメントで「参考になった」', '🤲', 'silver', 40),
  ('event_host', 'イベント主催者', '初めてイベントを主催', '🎤', 'silver', 50);

create table user_badges (
  user_id uuid not null references profiles(id) on delete cascade,
  badge_slug text not null references badges(slug),
  awarded_at timestamptz default now(),
  primary key (user_id, badge_slug)
);

alter table user_badges enable row level security;
alter table badges enable row level security;
create policy "badges readable" on badges for select using (true);
create policy "user badges readable" on user_badges for select using (true);

-- XP追加 & レベルアップ計算 RPC
create or replace function award_xp(p_user_id uuid, p_reason xp_reason, p_amount integer, p_meta jsonb default null)
returns void language plpgsql security definer as $$
declare
  v_new_xp integer;
  v_new_level integer;
begin
  insert into xp_events (user_id, reason, amount, metadata) values (p_user_id, p_reason, p_amount, p_meta);
  update profiles set xp = xp + p_amount where id = p_user_id
    returning xp into v_new_xp;
  -- レベル = floor(sqrt(xp / 50)) + 1
  v_new_level := floor(sqrt(v_new_xp::numeric / 50))::int + 1;
  update profiles set level = v_new_level where id = p_user_id and level < v_new_level;
end;
$$;

-- バッジ授与 RPC (冪等)
create or replace function award_badge(p_user_id uuid, p_slug text)
returns boolean language plpgsql security definer as $$
declare
  v_xp integer;
  v_exists boolean;
begin
  select exists(select 1 from user_badges where user_id = p_user_id and badge_slug = p_slug) into v_exists;
  if v_exists then return false; end if;

  insert into user_badges (user_id, badge_slug) values (p_user_id, p_slug);
  select xp_reward into v_xp from badges where slug = p_slug;
  if v_xp > 0 then
    perform award_xp(p_user_id, 'signup', v_xp, jsonb_build_object('badge', p_slug));
  end if;

  insert into notifications (user_id, kind, title, body, link)
  values (p_user_id, 'review_received', '🎉 バッジ獲得: ' || (select name from badges where slug = p_slug),
          (select description from badges where slug = p_slug), '/profile/' || (select handle from profiles where id = p_user_id));
  return true;
end;
$$;

-- トリガー: 登録時にwelcomeバッジ
create or replace function on_profile_created_badge()
returns trigger language plpgsql security definer as $$
begin
  perform award_badge(new.id, 'welcome');
  return new;
end;
$$;
create trigger trg_welcome_badge after insert on profiles
  for each row execute function on_profile_created_badge();

-- トリガー: 初応募→バッジ+XP
create or replace function on_proposal_gamify()
returns trigger language plpgsql security definer as $$
declare v_count int;
begin
  select count(*) into v_count from proposals where worker_id = new.worker_id;
  if v_count = 1 then
    perform award_badge(new.worker_id, 'first_proposal');
  end if;
  perform award_xp(new.worker_id, 'first_proposal', 5, null);
  return new;
end;
$$;
create trigger trg_proposal_gamify after insert on proposals
  for each row execute function on_proposal_gamify();

-- トリガー: 初発注→バッジ
create or replace function on_job_gamify()
returns trigger language plpgsql security definer as $$
declare v_count int;
begin
  select count(*) into v_count from jobs where client_id = new.client_id;
  if v_count = 1 then
    perform award_badge(new.client_id, 'first_client');
  end if;
  return new;
end;
$$;
create trigger trg_job_gamify after insert on jobs
  for each row execute function on_job_gamify();

-- トリガー: 契約確定→初成約バッジ
create or replace function on_contract_gamify()
returns trigger language plpgsql security definer as $$
declare v_count int;
begin
  select count(*) into v_count from contracts where worker_id = new.worker_id;
  if v_count = 1 then
    perform award_badge(new.worker_id, 'first_contract');
  end if;
  return new;
end;
$$;
create trigger trg_contract_gamify after insert on contracts
  for each row execute function on_contract_gamify();

-- トリガー: 契約リリース→完了XP
create or replace function on_contract_released_gamify()
returns trigger language plpgsql security definer as $$
declare v_count int;
begin
  if new.status = 'released' and (old.status is null or old.status <> 'released') then
    perform award_xp(new.worker_id, 'contract_completed', 100, jsonb_build_object('contract_id', new.id));
    perform award_xp(new.client_id, 'contract_completed', 50, jsonb_build_object('contract_id', new.id));
    select count(*) into v_count from contracts where worker_id = new.worker_id and status = 'released';
    if v_count >= 10 then perform award_badge(new.worker_id, 'ten_contracts'); end if;
  end if;
  return new;
end;
$$;
create trigger trg_contract_released_gamify after update on contracts
  for each row execute function on_contract_released_gamify();

-- トリガー: 5つ星レビュー
create or replace function on_review_gamify()
returns trigger language plpgsql security definer as $$
begin
  if new.rating = 5 then
    perform award_badge(new.reviewee_id, 'five_star');
    perform award_xp(new.reviewee_id, 'five_star_review', 20, null);
  end if;
  return new;
end;
$$;
create trigger trg_review_gamify after insert on reviews
  for each row execute function on_review_gamify();
