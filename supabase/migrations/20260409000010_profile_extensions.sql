-- ============================================================
-- プロフィール拡張: ポートフォリオ・職歴・SNS・認証・稼働状態・言語
-- ============================================================

-- profilesに直接持つフィールド
alter table profiles add column tagline text;                  -- キャッチコピー1行
alter table profiles add column years_experience integer;      -- 経験年数
alter table profiles add column availability text check (availability in ('available', 'busy', 'limited', 'unavailable')) default 'available';
alter table profiles add column work_hours text;               -- "平日9-18時" など自由記述
alter table profiles add column response_hours integer;        -- 平均返信時間(時間)
alter table profiles add column languages text[] default '{}'; -- ['日本語(ネイティブ)', '英語(ビジネス)']
alter table profiles add column service_areas text[] default '{}'; -- ['沖縄', '全国オンライン']
alter table profiles add column timezone text default 'Asia/Tokyo';
alter table profiles add column profile_completion integer default 0; -- 0-100%

-- SNS / 連絡手段
alter table profiles add column twitter_handle text;
alter table profiles add column instagram_handle text;
alter table profiles add column github_handle text;
alter table profiles add column linkedin_url text;
alter table profiles add column behance_url text;
alter table profiles add column youtube_url text;
alter table profiles add column tiktok_handle text;

-- 認証バッジ
alter table profiles add column verified_identity boolean default false;
alter table profiles add column verified_identity_at timestamptz;
alter table profiles add column verified_skills boolean default false;
alter table profiles add column verified_skills_at timestamptz;
alter table profiles add column trust_score integer default 0;  -- 0-100 自動算出

-- ポートフォリオ作品
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  external_url text,
  tags text[] default '{}',
  client_name text,
  completed_at date,
  sort_order integer default 0,
  created_at timestamptz default now()
);
create index on portfolios (user_id, sort_order, created_at desc);

alter table portfolios enable row level security;
create policy "portfolios readable by everyone" on portfolios for select using (true);
create policy "owner manages portfolios" on portfolios for all using (user_id = auth.uid());

-- 職歴
create table work_experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  company text not null,
  title text not null,
  description text,
  start_date date not null,
  end_date date,
  is_current boolean default false,
  sort_order integer default 0
);
create index on work_experiences (user_id, start_date desc);

alter table work_experiences enable row level security;
create policy "work_exp readable" on work_experiences for select using (true);
create policy "owner manages work_exp" on work_experiences for all using (user_id = auth.uid());

-- 学歴
create table educations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  school text not null,
  degree text,
  field text,
  start_date date,
  end_date date,
  description text,
  sort_order integer default 0
);
create index on educations (user_id, start_date desc);

alter table educations enable row level security;
create policy "educations readable" on educations for select using (true);
create policy "owner manages educations" on educations for all using (user_id = auth.uid());

-- 資格・認定
create table certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  issuer text,
  issued_date date,
  expires_date date,
  credential_id text,
  credential_url text,
  sort_order integer default 0
);
create index on certifications (user_id, issued_date desc);

alter table certifications enable row level security;
create policy "certs readable" on certifications for select using (true);
create policy "owner manages certs" on certifications for all using (user_id = auth.uid());

-- プロフィール完成度を自動計算する関数
create or replace function calc_profile_completion(p_user_id uuid)
returns integer language plpgsql as $$
declare
  v_score integer := 0;
  v_profile profiles%rowtype;
  v_portfolios int;
  v_work_exps int;
begin
  select * into v_profile from profiles where id = p_user_id;
  if not found then return 0; end if;

  if v_profile.avatar_url is not null then v_score := v_score + 10; end if;
  if v_profile.bio is not null and length(v_profile.bio) >= 100 then v_score := v_score + 15; end if;
  if v_profile.tagline is not null then v_score := v_score + 5; end if;
  if array_length(v_profile.skills, 1) >= 3 then v_score := v_score + 15; end if;
  if v_profile.hourly_rate_jpy is not null then v_score := v_score + 5; end if;
  if v_profile.location is not null then v_score := v_score + 5; end if;
  if array_length(v_profile.languages, 1) >= 1 then v_score := v_score + 5; end if;
  if v_profile.years_experience is not null then v_score := v_score + 5; end if;

  select count(*) into v_portfolios from portfolios where user_id = p_user_id;
  if v_portfolios >= 1 then v_score := v_score + 10; end if;
  if v_portfolios >= 3 then v_score := v_score + 5; end if;

  select count(*) into v_work_exps from work_experiences where user_id = p_user_id;
  if v_work_exps >= 1 then v_score := v_score + 10; end if;

  if v_profile.verified_identity then v_score := v_score + 10; end if;

  return least(100, v_score);
end;
$$;

-- プロフィール更新時に完成度を再計算
create or replace function update_profile_completion()
returns trigger language plpgsql as $$
begin
  new.profile_completion := calc_profile_completion(new.id);
  -- 100%到達でバッジ授与
  if new.profile_completion = 100 and (old.profile_completion is null or old.profile_completion < 100) then
    perform award_badge(new.id, 'profile_master');
  end if;
  return new;
end;
$$;
create trigger trg_profile_completion before update on profiles
  for each row execute function update_profile_completion();

-- 関連テーブル変更時にも再計算
create or replace function trigger_profile_completion_recalc()
returns trigger language plpgsql as $$
declare v_user_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  update profiles set profile_completion = calc_profile_completion(v_user_id) where id = v_user_id;
  return null;
end;
$$;
create trigger trg_recalc_from_portfolios after insert or update or delete on portfolios
  for each row execute function trigger_profile_completion_recalc();
create trigger trg_recalc_from_work_exps after insert or update or delete on work_experiences
  for each row execute function trigger_profile_completion_recalc();

-- search_path明示
alter function public.calc_profile_completion(uuid) set search_path = public, auth;
alter function public.update_profile_completion() set search_path = public, auth;
alter function public.trigger_profile_completion_recalc() set search_path = public, auth;

-- アバター用Storageバケット
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars readable by everyone"
  on storage.objects for select using (bucket_id = 'avatars');
create policy "users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');
create policy "users can update own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');
create policy "users can delete own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');

-- ポートフォリオ画像用バケット
insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

create policy "portfolio images readable"
  on storage.objects for select using (bucket_id = 'portfolios');
create policy "users upload portfolio images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolios');
