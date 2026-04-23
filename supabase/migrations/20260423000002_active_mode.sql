-- Phase 1: 受注者/発注者モード切替
-- 1ユーザーが両モードを行き来できるよう、現在のアクティブモードを保持する

-- enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'active_mode_enum') then
    create type active_mode_enum as enum ('worker', 'client');
  end if;
end$$;

-- profiles.active_mode
alter table profiles
  add column if not exists active_mode active_mode_enum not null default 'worker';

comment on column profiles.active_mode is
  '現在のダッシュボードモード。ユーザーは両方使えるがUIは切替式。worker=受注者, client=発注者';

-- インデックス不要（単一ユーザー内の参照のみ）

-- 既存ユーザーのデフォルト補正:
-- - すでに案件を投稿したことがあるユーザーは client 寄り
-- - それ以外は worker (受注者) のまま
update profiles p
set active_mode = 'client'
where exists (
  select 1 from jobs j where j.client_id = p.id
)
and not exists (
  select 1 from proposals pr where pr.worker_id = p.id
);
