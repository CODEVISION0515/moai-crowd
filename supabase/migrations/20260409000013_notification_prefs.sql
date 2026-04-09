-- ============================================================
-- 通知設定（ユーザーごと・通知種別ごとのチャンネル設定）
-- ============================================================

create table notification_preferences (
  user_id uuid not null references profiles(id) on delete cascade,
  kind notification_kind not null,
  channel_email boolean default true,
  channel_line boolean default false,
  channel_inapp boolean default true,
  primary key (user_id, kind)
);

alter table notification_preferences enable row level security;

create policy "users manage own notification prefs"
  on notification_preferences for all using (user_id = auth.uid());
