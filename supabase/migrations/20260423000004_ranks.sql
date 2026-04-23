-- Phase 5: ランク制度 (ランサーズ式)
-- プロフィール完成度・レビュー数・平均評価で自動昇格する5段階システム。
--
-- Regular (初期) → Bronze → Silver → Gold → Platinum
--
-- 昇格条件 (累積・降格なし):
--   Bronze:   profile_completion >= 80
--   Silver:   Bronze + rating_count >= 3 AND rating_avg >= 4.0
--   Gold:     Silver + rating_count >= 10 AND rating_avg >= 4.5
--   Platinum: Gold   + rating_count >= 30 AND rating_avg >= 4.8

-- 1. enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rank_enum') then
    create type rank_enum as enum ('regular', 'bronze', 'silver', 'gold', 'platinum');
  end if;
end$$;

-- 2. profiles.rank カラム追加
alter table profiles
  add column if not exists rank rank_enum not null default 'regular';

comment on column profiles.rank is
  '自動計算されるユーザーランク。regular=初期/bronze/silver/gold/platinum。降格なし。';

-- 3. rank 計算関数
create or replace function compute_rank(
  p_profile_completion integer,
  p_rating_count integer,
  p_rating_avg numeric
) returns rank_enum
language plpgsql
immutable
as $$
begin
  -- 防御的デフォルト
  p_profile_completion := coalesce(p_profile_completion, 0);
  p_rating_count := coalesce(p_rating_count, 0);
  p_rating_avg := coalesce(p_rating_avg, 0);

  if p_profile_completion >= 80 and p_rating_count >= 30 and p_rating_avg >= 4.8 then
    return 'platinum';
  elsif p_profile_completion >= 80 and p_rating_count >= 10 and p_rating_avg >= 4.5 then
    return 'gold';
  elsif p_profile_completion >= 80 and p_rating_count >= 3 and p_rating_avg >= 4.0 then
    return 'silver';
  elsif p_profile_completion >= 80 then
    return 'bronze';
  else
    return 'regular';
  end if;
end;
$$;

alter function public.compute_rank(integer, integer, numeric) set search_path = public;

-- 4. トリガー: profiles update で rank を再計算
-- 注: profiles には既存で trg_profile_completion (BEFORE UPDATE) があり、profile_completion を計算する。
-- rank はそれを使うため、AFTER UPDATE ではなく BEFORE UPDATE で直接 new.rank := ... する。
-- しかし BEFORE UPDATE は1つしか使わない方が安全なので、既存トリガを拡張する方針に変更。

create or replace function update_profile_completion()
returns trigger language plpgsql
as $$
begin
  new.profile_completion := calc_profile_completion(new.id);
  new.rank := compute_rank(new.profile_completion, new.rating_count, new.rating_avg);

  -- 100%到達でバッジ授与
  if new.profile_completion = 100 and (old.profile_completion is null or old.profile_completion < 100) then
    perform award_badge(new.id, 'profile_master');
  end if;
  return new;
end;
$$;

alter function public.update_profile_completion() set search_path = public, auth;

-- 5. 関連テーブル (work_experiences / educations / certifications) 変更で rank も更新
-- 既存の trigger_profile_completion_recalc は AFTER INSERT/UPDATE/DELETE で profiles.profile_completion を更新
-- 更新時にBEFORE UPDATE トリガが走って rank も計算される（連鎖）
-- → 既存トリガが効いていれば自動反映される。追加不要。

-- 6. reviews テーブルの trigger（recalc_profile_rating）は profiles.rating_avg/rating_count
-- を UPDATE するので、既存の trg_profile_completion (BEFORE UPDATE) が自動で
-- rank を再計算する。追加作業は不要。

-- 7. 既存ユーザーのバックフィル
update profiles
set rank = compute_rank(profile_completion, rating_count, rating_avg);
