-- コミュニティ依存度向上: メンション通知 + XP細粒度化
-- ============================================================

-- ── XP reason 拡張 ──────────────────────────────────
-- 既存: signup / profile_complete / first_post / post_created / comment_created
--       received_like / first_proposal / first_contract / contract_completed
--       five_star_review / daily_login / streak_bonus / event_attended
-- 追加はenum自体でなくアプリ側のvalidation設計に依存するため、コード側のみで対応
-- （award_xp RPCは p_reason: text なのでそのまま拡張可能）

-- ── メンション抽出関数 ──────────────────────────────
-- テキストから @handle のリストを返す
create or replace function public.extract_mentions(p_text text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct (m)[1]), '{}')
  from regexp_matches(coalesce(p_text, ''), '@([a-z0-9_]{3,20})', 'g') as t(m);
$$;

comment on function public.extract_mentions is '本文テキストから @handle を抽出し、ハンドル配列を返す';

-- ── コメント投稿時のメンション通知トリガー ────────────
create or replace function public.notify_mentions_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mention_handles text[];
  mentioned_user_id uuid;
  h text;
  post_row posts%rowtype;
begin
  mention_handles := extract_mentions(new.body);
  if array_length(mention_handles, 1) is null then
    return new;
  end if;

  select * into post_row from posts where id = new.post_id;

  foreach h in array mention_handles loop
    select id into mentioned_user_id from profiles where handle = h;
    if mentioned_user_id is null or mentioned_user_id = new.author_id then
      continue;
    end if;

    insert into notifications (user_id, kind, title, body, link)
    values (
      mentioned_user_id,
      'mentioned_in_comment'::notification_kind,
      '@メンションされました',
      left(coalesce(new.body, ''), 120),
      '/community/' || new.post_id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_comment_mention on post_comments;
create trigger on_comment_mention
after insert on post_comments
for each row execute function notify_mentions_on_comment();

-- ── 投稿本文のメンション通知トリガー ──────────────────
create or replace function public.notify_mentions_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mention_handles text[];
  mentioned_user_id uuid;
  h text;
begin
  mention_handles := extract_mentions(new.body);
  if array_length(mention_handles, 1) is null then
    return new;
  end if;

  foreach h in array mention_handles loop
    select id into mentioned_user_id from profiles where handle = h;
    if mentioned_user_id is null or mentioned_user_id = new.author_id then
      continue;
    end if;

    insert into notifications (user_id, kind, title, body, link)
    values (
      mentioned_user_id,
      'mentioned_in_post'::notification_kind,
      '@メンションされました',
      coalesce(new.title, ''),
      '/community/' || new.id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_post_mention on posts;
create trigger on_post_mention
after insert on posts
for each row execute function notify_mentions_on_post();

-- ── 投稿作成時のXP付与 +10 ──────────────────────────
create or replace function public.xp_on_post_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform award_xp(new.author_id, 'post_created', 10, jsonb_build_object('post_id', new.id));
  return new;
end;
$$;

drop trigger if exists on_post_created_xp on posts;
create trigger on_post_created_xp
after insert on posts
for each row execute function xp_on_post_created();

-- ── いいね受信時のXP付与 +1 ────────────────────────
-- post_liked 通知トリガーに併せてXPも付ける
create or replace function public.xp_on_like_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_author_id uuid;
begin
  if new.target_kind = 'post' then
    select author_id into target_author_id from posts where id = new.target_id;
  elsif new.target_kind = 'comment' then
    select author_id into target_author_id from post_comments where id = new.target_id;
  else
    return new;
  end if;

  if target_author_id is null or target_author_id = new.user_id then
    return new;
  end if;

  perform award_xp(target_author_id, 'received_like', 1, jsonb_build_object('from_user', new.user_id, 'target_kind', new.target_kind));
  return new;
end;
$$;

drop trigger if exists on_like_xp on likes;
create trigger on_like_xp
after insert on likes
for each row execute function xp_on_like_received();
