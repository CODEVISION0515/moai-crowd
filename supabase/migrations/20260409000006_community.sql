-- ============================================================
-- コミュニティ: 投稿(フォーラム/Q&A/シェア)・コメント・いいね・イベント・フォロー
-- ============================================================

create type post_kind as enum ('discussion', 'question', 'showcase', 'announcement');

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  kind post_kind not null default 'discussion',
  title text not null,
  body text not null,
  tags text[] default '{}',
  is_solved boolean default false,          -- questionの場合
  accepted_comment_id uuid,
  comment_count integer default 0,
  like_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on posts (kind, created_at desc);
create index on posts using gin (tags);

alter table posts enable row level security;
create policy "posts readable by everyone" on posts for select using (true);
create policy "authors can insert posts" on posts for insert with check (author_id = auth.uid());
create policy "authors can update own posts" on posts for update using (author_id = auth.uid());
create policy "authors can delete own posts" on posts for delete using (author_id = auth.uid());

-- コメント
create table post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references post_comments(id) on delete cascade,
  body text not null,
  like_count integer default 0,
  created_at timestamptz default now()
);
create index on post_comments (post_id, created_at);

alter table post_comments enable row level security;
create policy "comments readable by everyone" on post_comments for select using (true);
create policy "authors can comment" on post_comments for insert with check (author_id = auth.uid());
create policy "authors update own comments" on post_comments for update using (author_id = auth.uid());
create policy "authors delete own comments" on post_comments for delete using (author_id = auth.uid());

create or replace function sync_post_comment_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comment_count = comment_count + 1, updated_at = now() where id = new.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comment_count = comment_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;
create trigger trg_sync_comment_count
  after insert or delete on post_comments
  for each row execute function sync_post_comment_count();

-- いいね (投稿・コメント共用)
create type like_target as enum ('post', 'comment');
create table likes (
  user_id uuid not null references profiles(id) on delete cascade,
  target_kind like_target not null,
  target_id uuid not null,
  created_at timestamptz default now(),
  primary key (user_id, target_kind, target_id)
);
create index on likes (target_kind, target_id);

alter table likes enable row level security;
create policy "likes readable" on likes for select using (true);
create policy "users can like" on likes for insert with check (user_id = auth.uid());
create policy "users can unlike" on likes for delete using (user_id = auth.uid());

create or replace function sync_like_count()
returns trigger language plpgsql as $$
declare
  rec record;
  delta int;
begin
  rec := coalesce(new, old);
  delta := case when TG_OP = 'INSERT' then 1 else -1 end;
  if rec.target_kind = 'post' then
    update posts set like_count = greatest(0, like_count + delta) where id = rec.target_id;
  elsif rec.target_kind = 'comment' then
    update post_comments set like_count = greatest(0, like_count + delta) where id = rec.target_id;
  end if;
  return null;
end;
$$;
create trigger trg_sync_like_count after insert or delete on likes
  for each row execute function sync_like_count();

-- フォロー
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on follows (followee_id);

alter table follows enable row level security;
create policy "follows readable" on follows for select using (true);
create policy "users follow" on follows for insert with check (follower_id = auth.uid());
create policy "users unfollow" on follows for delete using (follower_id = auth.uid());

-- イベント
create table events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  location text,
  meeting_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity integer,
  attendee_count integer default 0,
  cover_image_url text,
  tags text[] default '{}',
  created_at timestamptz default now()
);
create index on events (starts_at);

alter table events enable row level security;
create policy "events readable" on events for select using (true);
create policy "hosts create events" on events for insert with check (host_id = auth.uid());
create policy "hosts update events" on events for update using (host_id = auth.uid());
create policy "hosts delete events" on events for delete using (host_id = auth.uid());

create table event_attendees (
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text check (status in ('going', 'maybe', 'canceled')) default 'going',
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

alter table event_attendees enable row level security;
create policy "attendees readable" on event_attendees for select using (true);
create policy "users rsvp" on event_attendees for insert with check (user_id = auth.uid());
create policy "users update rsvp" on event_attendees for update using (user_id = auth.uid());
create policy "users cancel rsvp" on event_attendees for delete using (user_id = auth.uid());

create or replace function sync_event_attendee_count()
returns trigger language plpgsql as $$
begin
  update events set attendee_count = (
    select count(*) from event_attendees
    where event_id = coalesce(new.event_id, old.event_id) and status = 'going'
  ) where id = coalesce(new.event_id, old.event_id);
  return null;
end;
$$;
create trigger trg_sync_event_attendees
  after insert or update or delete on event_attendees
  for each row execute function sync_event_attendee_count();
