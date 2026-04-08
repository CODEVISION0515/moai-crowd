-- ============================================================
-- 管理者・通報・モデレーション
-- ============================================================

-- profiles に role を追加
alter table profiles add column role text check (role in ('user', 'admin', 'moderator')) default 'user';
alter table profiles add column is_suspended boolean default false;
alter table profiles add column suspended_reason text;

-- 通報
create type report_target as enum ('user', 'job', 'proposal', 'message', 'deliverable');
create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_kind report_target not null,
  target_id uuid not null,
  reason text not null,
  detail text,
  status report_status default 'open',
  handled_by uuid references profiles(id),
  handled_at timestamptz,
  admin_note text,
  created_at timestamptz default now()
);
create index on reports (status, created_at desc);
create index on reports (target_kind, target_id);

alter table reports enable row level security;

-- 通報は本人と管理者のみ閲覧
create policy "reporter or admin can view reports"
  on reports for select using (
    reporter_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );
create policy "any user can create report"
  on reports for insert with check (reporter_id = auth.uid());
create policy "admin can update reports"
  on reports for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );

-- 監査ログ
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  target_kind text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz default now()
);
create index on audit_logs (created_at desc);

alter table audit_logs enable row level security;
create policy "admin sees audit logs"
  on audit_logs for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 管理者は全profilesを更新可
create policy "admin can update any profile"
  on profiles for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- 管理者は案件を停止可
create policy "admin can update any job"
  on jobs for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'moderator'))
  );
