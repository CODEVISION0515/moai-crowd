-- Phase 2: 第X期スペース (cohort space) の基盤
-- ============================================================
-- 「講義と講義の間を繋ぐ」設計。cohort テーブル + posts に cohort_id 追加。
-- 講師の告知、宿題提出、質疑応答、雑談などを期ごとに束ねる。

-- ── cohorts テーブル ────────────────────────────────
create table if not exists cohorts (
  id integer primary key,                        -- 1 = 第1期、2 = 第2期、...
  name text not null,                            -- 例: "第1期 (2026年5月〜7月)"
  subtitle text,                                 -- 例: "モニター価格の特別期"
  starts_at date not null,
  ends_at date,                                  -- NULL = 継続中/未定
  description text,
  cover_image_url text,
  lecturer_name text,                            -- メイン講師名 (将来は lecturers 多対多にする余地)
  is_accepting_applications boolean default false, -- true = 現在募集中
  application_url text,                          -- 申込先URL (外部 or /school/apply/[id])
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cohorts_active_idx
  on cohorts (is_accepting_applications) where is_accepting_applications = true;

comment on table cohorts is 'MOAIスクールの期情報。各期は /school/cohort/[id] でアクセス可能。';

-- ── 初期データ: 第1期 (仮) ──────────────────────────
insert into cohorts (id, name, subtitle, starts_at, ends_at, description, is_accepting_applications, application_url)
values (
  1,
  '第1期 (2026年5月〜7月)',
  '沖縄開講・モニター価格',
  '2026-05-01',
  '2026-07-31',
  'AIを学び、実践し、仕事にする — MOAIスクール記念すべき第1期。毎週土曜日の対面授業＋アプリでの課題・質問・交流で学びを定着させます。モニター価格148,000円。',
  true,
  '/school/apply/1'
) on conflict (id) do nothing;

-- ── posts に cohort 関連カラム追加 ──────────────────
alter table posts
  add column if not exists cohort_id integer references cohorts(id) on delete set null,
  add column if not exists is_pinned boolean default false,
  add column if not exists week_number integer;

create index if not exists posts_cohort_id_idx on posts (cohort_id) where cohort_id is not null;
create index if not exists posts_cohort_pinned_idx on posts (cohort_id, is_pinned) where cohort_id is not null and is_pinned = true;

comment on column posts.cohort_id is '属する期 (NULL = 一般のコミュニティ投稿)';
comment on column posts.is_pinned is '期内でピン留め (講師の告知など上部固定)';
comment on column posts.week_number is '第何週の投稿か (宿題・授業資料のグループ化用)';

-- ── cohorts RLS ────────────────────────────────────
alter table cohorts enable row level security;

-- 誰でも閲覧可能 (期の情報は公開)
create policy "cohorts readable by everyone" on cohorts for select using (true);

-- 管理者のみ更新可
create policy "only admin can insert cohorts" on cohorts for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'moderator'))
);

create policy "only admin can update cohorts" on cohorts for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'moderator'))
);
