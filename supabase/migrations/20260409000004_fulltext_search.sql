-- ============================================================
-- 全文検索 (pg_trgm + tsvector をトリガーで更新)
-- ============================================================

create extension if not exists pg_trgm;

-- jobs.search_vector
alter table jobs add column search_vector tsvector;

create or replace function jobs_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.skills, ' '), '')), 'C');
  return new;
end;
$$;

create trigger trg_jobs_search_vector
  before insert or update of title, description, category, skills on jobs
  for each row execute function jobs_search_vector_update();

update jobs set title = title;  -- 既存行を再計算

create index jobs_search_idx on jobs using gin (search_vector);
create index jobs_title_trgm on jobs using gin (title gin_trgm_ops);
create index jobs_description_trgm on jobs using gin (description gin_trgm_ops);

-- profiles.search_vector
alter table profiles add column search_vector tsvector;

create or replace function profiles_search_vector_update()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.bio, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.skills, ' '), '')), 'A');
  return new;
end;
$$;

create trigger trg_profiles_search_vector
  before insert or update of display_name, bio, skills on profiles
  for each row execute function profiles_search_vector_update();

update profiles set display_name = display_name;

create index profiles_search_idx on profiles using gin (search_vector);
create index profiles_handle_trgm on profiles using gin (handle gin_trgm_ops);

-- 検索RPC
create or replace function search_jobs(q text, cat text default null, skill_filter text[] default null)
returns setof jobs language sql stable as $$
  select j.* from jobs j
  where j.status = 'open'
    and (q is null or q = '' or j.search_vector @@ plainto_tsquery('simple', q) or j.title ilike '%' || q || '%')
    and (cat is null or cat = '' or j.category = cat)
    and (skill_filter is null or array_length(skill_filter, 1) is null or j.skills && skill_filter)
  order by
    case when q is null or q = '' then 0
         else ts_rank(j.search_vector, plainto_tsquery('simple', q))
    end desc,
    j.created_at desc
  limit 100;
$$;
