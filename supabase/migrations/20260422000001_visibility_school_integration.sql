-- Phase 1: 公開レベル3段階 (public/members/school) + School統合の土台
-- ============================================================
-- 「見せる学び」の設計思想:
--   - public   : 未認証ユーザーも閲覧可 (デフォルト)
--   - members  : ログインユーザーのみ
--   - school   : 在校生・卒業生・講師・管理者のみ
-- コメントは親postのvisibilityを継承 (見える人しかコメントも見えない)

-- ── posts.visibility 追加 ────────────────────────────
alter table posts
  add column if not exists visibility text default 'public'
    check (visibility in ('public', 'members', 'school'));

create index if not exists posts_visibility_idx on posts (visibility);

comment on column posts.visibility is
  '投稿の公開レベル: public=誰でも / members=認証済み / school=在校生・卒業生';

-- ── portfolios に School属性 追加 ────────────────────
alter table portfolios
  add column if not exists cohort integer,
  add column if not exists is_school_work boolean default false,
  add column if not exists school_project_name text;

create index if not exists portfolios_school_work_idx
  on portfolios (is_school_work) where is_school_work = true;

comment on column portfolios.cohort is 'スクール何期の作品か (NULL=スクール作品ではない)';
comment on column portfolios.is_school_work is 'MOAIスクールで制作した作品か';
comment on column portfolios.school_project_name is '課題・プロジェクト名 (例: 第1週目課題、卒業制作等)';

-- ── 閲覧可判定ヘルパー ──────────────────────────────
-- 指定ユーザーが指定visibilityの投稿を見られるか
create or replace function public.can_view_visibility(
  p_visibility text,
  p_user_id uuid default auth.uid()
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r text;
begin
  -- public は無認証でも見られる
  if p_visibility = 'public' then
    return true;
  end if;

  -- members 以上は認証必須
  if p_user_id is null then
    return false;
  end if;

  -- members は認証済みなら誰でも
  if p_visibility = 'members' then
    return true;
  end if;

  -- school は在校生・卒業生・講師・CM・admin のみ
  if p_visibility = 'school' then
    select coalesce(crowd_role, 'general') into r from profiles where id = p_user_id;
    if r in ('student', 'alumni', 'lecturer', 'community_manager') then
      return true;
    end if;
    -- admin/moderator も閲覧可
    select role into r from profiles where id = p_user_id;
    if r in ('admin', 'moderator') then
      return true;
    end if;
    return false;
  end if;

  return false;
end;
$$;

comment on function public.can_view_visibility is '指定visibilityの投稿を指定ユーザーが閲覧可能かを判定';

-- ── posts RLS 更新 ──────────────────────────────────
drop policy if exists "posts readable by everyone" on posts;

create policy "posts visibility-aware read" on posts for select using (
  -- 自分の投稿は常に見られる (プライベート下書き含む)
  author_id = auth.uid()
  -- または visibility に応じた閲覧判定
  or can_view_visibility(visibility, auth.uid())
);

-- ── post_comments RLS 更新 (親postを見られる人のみコメント閲覧可) ──
drop policy if exists "comments readable by everyone" on post_comments;

create policy "comments visibility-inherited" on post_comments for select using (
  exists (
    select 1 from posts p
    where p.id = post_comments.post_id
      and (
        p.author_id = auth.uid()
        or can_view_visibility(p.visibility, auth.uid())
      )
  )
);

-- コメント投稿も親postが閲覧可能な人に限定 (ROOM覗き見防止)
drop policy if exists "authors can comment" on post_comments;

create policy "authenticated can comment on viewable posts" on post_comments for insert with check (
  author_id = auth.uid()
  and exists (
    select 1 from posts p
    where p.id = post_comments.post_id
      and can_view_visibility(p.visibility, auth.uid())
  )
);
