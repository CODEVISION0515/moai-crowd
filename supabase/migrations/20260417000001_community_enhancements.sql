-- ============================================================
-- コミュニティ機能強化: ブックマーク・フォローカウント・トレンド・検索・通知
-- ============================================================

-- ── 投稿ブックマーク ──
create table if not exists post_bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
create index on post_bookmarks (user_id, created_at desc);

alter table post_bookmarks enable row level security;
create policy "users see own bookmarks" on post_bookmarks for select using (user_id = auth.uid());
create policy "users can bookmark" on post_bookmarks for insert with check (user_id = auth.uid());
create policy "users can unbookmark" on post_bookmarks for delete using (user_id = auth.uid());

-- ── フォローカウント ──
alter table profiles add column if not exists follower_count integer default 0;
alter table profiles add column if not exists following_count integer default 0;

create or replace function sync_follow_counts()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set follower_count = follower_count + 1 where id = NEW.followee_id;
    update profiles set following_count = following_count + 1 where id = NEW.follower_id;
  elsif TG_OP = 'DELETE' then
    update profiles set follower_count = greatest(0, follower_count - 1) where id = OLD.followee_id;
    update profiles set following_count = greatest(0, following_count - 1) where id = OLD.follower_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_follow_counts on follows;
create trigger trg_sync_follow_counts
  after insert or delete on follows
  for each row execute function sync_follow_counts();

-- バックフィル
update profiles p set
  follower_count = (select count(*) from follows where followee_id = p.id),
  following_count = (select count(*) from follows where follower_id = p.id);

-- ── トレンドスコア ──
alter table posts add column if not exists hot_score float default 0;

create or replace function compute_hot_score(
  p_like int, p_comment int, p_view int, p_created timestamptz
) returns float language sql immutable as $$
  select (p_like * 2 + p_comment * 3 + p_view * 0.1)
         / power(extract(epoch from (now() - p_created)) / 3600 + 2, 1.5);
$$;

create or replace function refresh_post_hot_score()
returns trigger language plpgsql as $$
begin
  update posts set hot_score = compute_hot_score(like_count, comment_count, view_count, created_at)
  where id = NEW.id;
  return null;
end;
$$;

drop trigger if exists trg_refresh_hot_score on posts;
create trigger trg_refresh_hot_score
  after update of like_count, comment_count, view_count on posts
  for each row execute function refresh_post_hot_score();

update posts set hot_score = compute_hot_score(like_count, comment_count, view_count, created_at);
create index if not exists posts_hot_score_idx on posts (hot_score desc);

-- ── 全文検索 ──
alter table posts add column if not exists search_vector tsvector;

create or replace function posts_search_vector_update()
returns trigger language plpgsql as $$
begin
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.body, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  return NEW;
end;
$$;

drop trigger if exists trg_posts_search_vector on posts;
create trigger trg_posts_search_vector
  before insert or update of title, body, tags on posts
  for each row execute function posts_search_vector_update();

-- バックフィル
update posts set title = title;

create index if not exists posts_search_idx on posts using gin (search_vector);

-- 検索RPC
create or replace function search_posts(q text, kind_filter text default null)
returns setof posts language sql stable as $$
  select p.* from posts p
  where (q is null or q = '' or p.search_vector @@ plainto_tsquery('simple', q) or p.title ilike '%' || q || '%')
    and (kind_filter is null or p.kind::text = kind_filter)
  order by
    case when q is null or q = '' then 0
         else ts_rank(p.search_vector, plainto_tsquery('simple', q))
    end desc,
    p.created_at desc
  limit 50;
$$;
