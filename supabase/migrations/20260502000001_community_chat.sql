-- LINE オープンチャット風の単一チャットルームを /community に追加するためのテーブル。
-- 既存の posts (フォーラム形式) は /community/posts に退避し、ライブラリとして残す。
-- 設計方針:
--   - 単一グローバルルーム（rooms 概念は将来拡張）
--   - 1 メッセージ = 短文 (最大 2000 文字)
--   - reply_to_id で軽い inline 返信
--   - visibility は posts と同じ 3 値を共有
--   - 削除は soft delete (deleted_at) で履歴保持

create table if not exists community_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  reply_to_id uuid references community_messages(id) on delete set null,
  visibility text not null default 'public'
    check (visibility in ('public', 'members', 'school')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 時系列降順スクロールが主用途
create index if not exists community_messages_created_idx
  on community_messages (created_at desc);
create index if not exists community_messages_sender_idx
  on community_messages (sender_id, created_at desc);

-- ── RLS ────────────────────────────────────────────
alter table community_messages enable row level security;

-- 閲覧: 削除されていない & visibility に応じて
create policy "community messages readable by visibility"
  on community_messages for select
  using (
    deleted_at is null
    and public.can_view_visibility(visibility, auth.uid())
  );

-- 投稿: 認証済みユーザー、本人のみ自分の sender_id で書ける
create policy "authenticated users can post messages"
  on community_messages for insert
  with check (auth.uid() = sender_id);

-- 編集: 本人のみ。soft delete & body 編集に使う
create policy "senders can update own messages"
  on community_messages for update
  using (auth.uid() = sender_id);

-- 物理削除はしない（admin 経由のみ必要に応じて別途）
-- create policy "no hard delete" on community_messages for delete using (false);

-- ── Realtime ──────────────────────────────────────
-- @supabase/ssr の channel で INSERT を購読する前提
alter publication supabase_realtime add table community_messages;

comment on table community_messages is
  'LINE オープンチャット風の単一コミュニティチャット用メッセージ。/community ページで使用。';
