-- Phase 3: MOAIスクール ショーケース (インタビュー記事 + 卒業発表)
-- ============================================================
-- 目的: 受講生の学びと成果を「発注者が頼みたくなる」「次期の受講者が来たくなる」形で公開
-- 1. interviews テーブル: 受講生インタビュー記事
-- 2. 卒業発表は既存 events を event_type='alumni_report' で運用 (Phase 1 スキーマ想定)

-- ── interviews テーブル ─────────────────────────────
create table if not exists interviews (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                       -- URL用 (例: "yamada-taro-cohort-1")
  subject_user_id uuid references profiles(id) on delete set null, -- インタビュー対象
  cohort_id integer references cohorts(id) on delete set null,
  title text not null,                             -- "受講1ヶ月で初受注！山田さんの学び"
  summary text,                                    -- カード表示用 の1-2行
  body text not null,                              -- 記事本文 (Markdown)
  hero_image_url text,
  before_text text,                                -- 受講前のスキル・背景
  after_text text,                                 -- 受講後の変化・実績
  is_published boolean default false,
  published_at timestamptz,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists interviews_slug_idx on interviews (slug);
create index if not exists interviews_published_idx
  on interviews (is_published, published_at desc) where is_published = true;
create index if not exists interviews_cohort_idx on interviews (cohort_id) where cohort_id is not null;
create index if not exists interviews_subject_idx on interviews (subject_user_id) where subject_user_id is not null;

comment on table interviews is 'MOAIスクール受講生のインタビュー記事。公開されるとショーケースに表示。';

-- ── RLS ─────────────────────────────────────────────
alter table interviews enable row level security;

-- 公開された記事は誰でも閲覧可
drop policy if exists "interviews public read when published" on interviews;
create policy "interviews public read when published" on interviews for select using (
  is_published = true
  or subject_user_id = auth.uid()                  -- 本人は下書きも見られる
  or exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  )
);

-- 作成は管理者・モデレーターのみ
drop policy if exists "admin insert interviews" on interviews;
create policy "admin insert interviews" on interviews for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'moderator'))
);

-- 編集も管理者・モデレーターのみ (本人はコメントだけ)
drop policy if exists "admin update interviews" on interviews;
create policy "admin update interviews" on interviews for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'moderator'))
);

drop policy if exists "admin delete interviews" on interviews;
create policy "admin delete interviews" on interviews for delete using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'moderator'))
);

-- ── view_count インクリメント RPC ────────────────────
create or replace function public.increment_interview_view(p_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update interviews
  set view_count = view_count + 1
  where slug = p_slug and is_published = true;
$$;
