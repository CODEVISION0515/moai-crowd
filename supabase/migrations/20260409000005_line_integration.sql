-- LINE連携: プロフィールにLINE userIdと通知設定を追加
alter table profiles add column line_user_id text unique;
alter table profiles add column notify_email boolean default true;
alter table profiles add column notify_line boolean default false;

-- LINE連携トークン (ワンタイム)
create table line_link_tokens (
  token text primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '10 minutes'),
  used_at timestamptz
);
create index on line_link_tokens (user_id);

alter table line_link_tokens enable row level security;
create policy "users manage their own link tokens"
  on line_link_tokens for all using (user_id = auth.uid());
