-- ============================================================
-- コミュニティ通知トリガー
-- ============================================================

-- コメント通知（投稿者へ）
create or replace function notify_post_commented()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_post record;
  v_commenter text;
begin
  select author_id, title into v_post from posts where id = NEW.post_id;
  if v_post.author_id = NEW.author_id then return NEW; end if;

  select display_name into v_commenter from profiles where id = NEW.author_id;

  insert into notifications (user_id, kind, title, body, link)
  values (
    v_post.author_id,
    'post_commented',
    v_commenter || 'さんがコメントしました',
    '「' || left(v_post.title, 30) || '」',
    '/community/' || NEW.post_id
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_post_commented on post_comments;
create trigger trg_notify_post_commented
  after insert on post_comments
  for each row when (NEW.parent_id is null)
  execute function notify_post_commented();

-- 返信通知（親コメント著者へ）
create or replace function notify_comment_replied()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_parent_author uuid;
  v_replier text;
  v_post_id uuid;
begin
  select author_id, post_id into v_parent_author, v_post_id
    from post_comments where id = NEW.parent_id;
  if v_parent_author = NEW.author_id then return NEW; end if;

  select display_name into v_replier from profiles where id = NEW.author_id;

  insert into notifications (user_id, kind, title, body, link)
  values (
    v_parent_author,
    'comment_replied',
    v_replier || 'さんが返信しました',
    left(NEW.body, 50),
    '/community/' || v_post_id
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_comment_replied on post_comments;
create trigger trg_notify_comment_replied
  after insert on post_comments
  for each row when (NEW.parent_id is not null)
  execute function notify_comment_replied();

-- いいね通知（投稿者へ、投稿のみ）
create or replace function notify_post_liked()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_post record;
  v_liker text;
begin
  if NEW.target_kind <> 'post' then return NEW; end if;

  select author_id, title into v_post from posts where id = NEW.target_id;
  if v_post.author_id = NEW.user_id then return NEW; end if;

  select display_name into v_liker from profiles where id = NEW.user_id;

  insert into notifications (user_id, kind, title, body, link)
  values (
    v_post.author_id,
    'post_liked',
    v_liker || 'さんがいいねしました',
    '「' || left(v_post.title, 30) || '」',
    '/community/' || NEW.target_id
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_post_liked on likes;
create trigger trg_notify_post_liked
  after insert on likes
  for each row execute function notify_post_liked();

-- フォロー通知
create or replace function notify_new_follower()
returns trigger language plpgsql security definer
set search_path = public as $$
declare
  v_follower text;
  v_handle text;
begin
  select display_name into v_follower from profiles where id = NEW.follower_id;
  select handle into v_handle from profiles where id = NEW.follower_id;

  insert into notifications (user_id, kind, title, body, link)
  values (
    NEW.followee_id,
    'new_follower',
    v_follower || 'さんにフォローされました',
    null,
    '/profile/' || v_handle
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_new_follower on follows;
create trigger trg_notify_new_follower
  after insert on follows
  for each row execute function notify_new_follower();
