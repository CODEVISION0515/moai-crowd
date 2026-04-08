-- ============================================================
-- 案件の全文検索 (pg_trgm + tsvector)
-- ============================================================

create extension if not exists pg_trgm;

-- tsvector生成列（日本語は simple + pg_trgm でカバー）
alter table jobs add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(skills, ' '), '')), 'C')
  ) stored;

create index jobs_search_idx on jobs using gin (search_vector);
create index jobs_title_trgm on jobs using gin (title gin_trgm_ops);
create index jobs_description_trgm on jobs using gin (description gin_trgm_ops);

-- プロフィールも検索対象に
alter table profiles add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(bio, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(skills, ' '), '')), 'A')
  ) stored;

create index profiles_search_idx on profiles using gin (search_vector);
create index profiles_handle_trgm on profiles using gin (handle gin_trgm_ops);

-- 検索RPC: 案件
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
