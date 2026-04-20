-- Phase 0: 手数料体系 + ロール拡張
-- ============================================================
-- - fee_rules テーブル: 在校生0% / 卒業生5%生涯 / 一般15% / 発注者ローンチ0%→11月から4%
-- - profiles: role を拡張 (student/alumni/general/client/admin/lecturer/community_manager)
-- - profiles: cohort, enrollment_date, graduation_date, github_username, moai_badge_display, region
-- - jobs: level (L1-L4), alumni_only, mentor_required, source, target_region

-- ── fee_rules テーブル ──────────────────────────────────
create table if not exists fee_rules (
  id uuid primary key default gen_random_uuid(),
  user_role text not null,
  rate numeric(5,4) not null check (rate >= 0 and rate <= 1),
  effective_from date not null,
  effective_to date,
  note text,
  created_at timestamptz default now()
);

create index if not exists fee_rules_lookup_idx on fee_rules (user_role, effective_from);

-- 初期データ (仕様書 §3)
insert into fee_rules (user_role, rate, effective_from, effective_to, note) values
  ('student',  0.0000, '2026-05-01', null,         '在校生・生涯0%（スクール受講料に含む）'),
  ('alumni',   0.0500, '2026-05-01', null,         '卒業生・生涯5%'),
  ('general',  0.1500, '2026-05-01', null,         '一般・業界最安級'),
  ('client',   0.0000, '2026-05-01', '2026-10-31', 'ローンチ期・6ヶ月無料'),
  ('client',   0.0400, '2026-11-01', null,         '標準期・決済システム利用料4%')
on conflict do nothing;

comment on table fee_rules is 'Crowd手数料ルール。user_role × 日付で一意に決まる料率。';

-- 指定日時点の料率を返す関数
create or replace function public.get_fee_rate(
  p_role text,
  p_at date default current_date
) returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select rate
  from fee_rules
  where user_role = p_role
    and effective_from <= p_at
    and (effective_to is null or effective_to >= p_at)
  order by effective_from desc
  limit 1;
$$;

comment on function public.get_fee_rate is '指定日時点の料率を取得（見つからない場合はnull）';

-- ── profiles 拡張 ──────────────────────────────────────
-- 既存の role は user/admin/moderator。新しい crowd_role 列で MOAI 内ロールを管理
-- （既存の admin/moderator ロールと共存）
alter table profiles
  add column if not exists crowd_role text default 'general'
    check (crowd_role in ('student', 'alumni', 'general', 'client', 'lecturer', 'community_manager')),
  add column if not exists cohort integer,
  add column if not exists enrollment_date date,
  add column if not exists graduation_date date,
  add column if not exists github_username text,
  add column if not exists moai_badge_display boolean default true,
  add column if not exists region text
    check (region in ('okinawa', 'fukuoka', 'other') or region is null);

create index if not exists profiles_crowd_role_idx on profiles (crowd_role);
create index if not exists profiles_cohort_idx on profiles (cohort) where cohort is not null;

comment on column profiles.crowd_role is 'MOAI内ロール: student/alumni/general/client/lecturer/community_manager';
comment on column profiles.cohort is '期番号（第1期=1）';
comment on column profiles.moai_badge_display is 'プロフィールにMOAIバッジ（在校生/卒業生/講師）を表示するか';

-- ── 卒業日が到来したら自動で student → alumni に変える関数 ────
create or replace function public.auto_graduate_students() returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update profiles
  set crowd_role = 'alumni'
  where crowd_role = 'student'
    and graduation_date is not null
    and graduation_date <= current_date;
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

comment on function public.auto_graduate_students is '卒業日が過ぎた在校生を卒業生ロールに更新（手動またはcron実行想定）';

-- ── jobs 拡張 ──────────────────────────────────────────
alter table jobs
  add column if not exists level text default 'L2'
    check (level in ('L1', 'L2', 'L3', 'L4')),
  add column if not exists alumni_only boolean default false,
  add column if not exists mentor_required boolean default false,
  add column if not exists source text default 'direct'
    check (source in ('direct', 'andcrew_overflow', 'andcrew_non_core', 'andcrew_small', 'andcrew_alumni_only')),
  add column if not exists target_region text
    check (target_region in ('okinawa', 'fukuoka', 'other') or target_region is null);

create index if not exists jobs_level_idx on jobs (level);
create index if not exists jobs_source_idx on jobs (source);

comment on column jobs.level is '案件レベル L1(練習)/L2(入門)/L3(実績)/L4(チーム・&CREW専用)';
comment on column jobs.source is '案件流通元: direct/andcrew_*';
comment on column jobs.alumni_only is 'MOAI卒業生限定案件';
comment on column jobs.mentor_required is 'メンター監修必須（L1は原則必須）';
