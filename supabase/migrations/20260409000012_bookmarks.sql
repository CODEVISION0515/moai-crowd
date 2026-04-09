-- ============================================================
-- ブックマーク（案件保存）機能
-- ============================================================

create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, job_id)
);

create index on bookmarks (user_id, created_at desc);

alter table bookmarks enable row level security;

create policy "users manage own bookmarks"
  on bookmarks for all using (user_id = auth.uid());
