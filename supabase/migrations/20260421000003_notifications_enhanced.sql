-- 通知設定の拡充
-- ============================================================
-- 1. グローバル設定テーブル (マスタートグル / クワイエットアワー / ダイジェスト頻度)
-- 2. notification_kind にメンション/コミュニティ系を追加
-- 3. notification_preferences にデフォルト列を追加
-- 4. クワイエットアワー判定 RPC

-- ── notification_kind を拡張 ───────────────────────────
alter type notification_kind add value if not exists 'mentioned_in_comment';
alter type notification_kind add value if not exists 'mentioned_in_post';
alter type notification_kind add value if not exists 'post_answer_accepted';
alter type notification_kind add value if not exists 'event_upcoming';

-- ── グローバル通知設定 ──────────────────────────────────
create table if not exists notification_global_prefs (
  user_id uuid primary key references profiles(id) on delete cascade,
  master_enabled boolean default true,
  email_enabled boolean default true,
  line_enabled boolean default false,
  push_enabled boolean default false,
  quiet_hours_enabled boolean default false,
  quiet_hours_start time default '22:00',
  quiet_hours_end time default '08:00',
  timezone text default 'Asia/Tokyo',
  digest_frequency text default 'immediate'
    check (digest_frequency in ('immediate', 'daily_digest', 'weekly_digest', 'off')),
  updated_at timestamptz default now()
);

alter table notification_global_prefs enable row level security;

create policy "users manage own global notif prefs"
  on notification_global_prefs for all using (user_id = auth.uid());

comment on table notification_global_prefs is 'ユーザーの通知全体設定: マスタートグル・チャネル・クワイエットアワー・ダイジェスト';

-- ── クワイエットアワー判定 RPC ─────────────────────────
-- 指定ユーザーが現在クワイエットアワー中かどうか返す
create or replace function public.is_in_quiet_hours(p_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  g notification_global_prefs%rowtype;
  now_time time;
begin
  select * into g from notification_global_prefs where user_id = p_user_id;
  if not found or not g.quiet_hours_enabled then
    return false;
  end if;

  -- タイムゾーン変換
  now_time := (now() at time zone coalesce(g.timezone, 'Asia/Tokyo'))::time;

  -- start < end: 同日内 (例 09:00-18:00)
  if g.quiet_hours_start < g.quiet_hours_end then
    return now_time >= g.quiet_hours_start and now_time < g.quiet_hours_end;
  else
    -- start > end: 日をまたぐ (例 22:00-08:00)
    return now_time >= g.quiet_hours_start or now_time < g.quiet_hours_end;
  end if;
end;
$$;

comment on function public.is_in_quiet_hours is '指定ユーザーが現在クワイエットアワー中かどうか';

-- ── ダイジェストキュー (将来のcron用、今は構造のみ) ──────
create table if not exists notification_digest_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  notification_id uuid references notifications(id) on delete cascade,
  channel text not null check (channel in ('email', 'line', 'push')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists notif_digest_queue_scheduled_idx
  on notification_digest_queue (scheduled_for)
  where sent_at is null;

alter table notification_digest_queue enable row level security;

create policy "users read own digest queue"
  on notification_digest_queue for select using (user_id = auth.uid());

comment on table notification_digest_queue is 'ダイジェスト配信用キュー。クワイエットアワー中または daily/weekly digest 設定時に積まれる';
