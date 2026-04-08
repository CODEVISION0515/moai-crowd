-- ============================================================
-- 成果物・通知・カテゴリマスタ追加
-- ============================================================

-- ---------------- deliverables ----------------
create table deliverables (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  file_urls text[] default '{}',
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  review_status text check (review_status in ('pending', 'approved', 'revision_requested')) default 'pending',
  revision_note text
);
create index on deliverables (contract_id, submitted_at desc);

alter table deliverables enable row level security;
create policy "deliverables visible to contract parties"
  on deliverables for select using (
    exists (select 1 from contracts c where c.id = deliverables.contract_id
              and (c.client_id = auth.uid() or c.worker_id = auth.uid()))
  );
create policy "worker can submit deliverables"
  on deliverables for insert with check (
    worker_id = auth.uid()
    and exists (select 1 from contracts c where c.id = deliverables.contract_id and c.worker_id = auth.uid())
  );
create policy "client can review deliverables"
  on deliverables for update using (
    exists (select 1 from contracts c where c.id = deliverables.contract_id and c.client_id = auth.uid())
  );

-- 提出時にcontract.status を submitted に遷移
create or replace function on_deliverable_submitted()
returns trigger language plpgsql security definer as $$
begin
  update contracts set status = 'submitted', updated_at = now()
    where id = new.contract_id and status in ('funded', 'working');
  return new;
end;
$$;
create trigger trg_on_deliverable_submitted
  after insert on deliverables
  for each row execute function on_deliverable_submitted();

-- ---------------- notifications ----------------
create type notification_kind as enum (
  'proposal_received', 'proposal_accepted', 'proposal_rejected',
  'deliverable_submitted', 'deliverable_approved', 'revision_requested',
  'message_received', 'contract_funded', 'review_received'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind notification_kind not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index on notifications (user_id, created_at desc);
create index on notifications (user_id, read_at);

alter table notifications enable row level security;
create policy "users see their notifications"
  on notifications for select using (user_id = auth.uid());
create policy "users update their notifications"
  on notifications for update using (user_id = auth.uid());

-- proposal 作成時に発注者に通知
create or replace function notify_on_proposal()
returns trigger language plpgsql security definer as $$
declare
  v_client_id uuid;
  v_title text;
begin
  select client_id, title into v_client_id, v_title from jobs where id = new.job_id;
  insert into notifications (user_id, kind, title, body, link)
  values (v_client_id, 'proposal_received', '新しい応募があります',
          v_title, '/jobs/' || new.job_id);
  return new;
end;
$$;
create trigger trg_notify_proposal after insert on proposals
  for each row execute function notify_on_proposal();

-- 成約時に受注者に通知
create or replace function notify_on_contract()
returns trigger language plpgsql security definer as $$
declare v_title text;
begin
  select title into v_title from jobs where id = new.job_id;
  insert into notifications (user_id, kind, title, body, link)
  values (new.worker_id, 'proposal_accepted', '応募が承諾されました',
          v_title, '/contracts/' || new.id);
  return new;
end;
$$;
create trigger trg_notify_contract after insert on contracts
  for each row execute function notify_on_contract();

-- 成果物提出時に発注者に通知
create or replace function notify_on_deliverable()
returns trigger language plpgsql security definer as $$
declare v_client uuid;
begin
  select client_id into v_client from contracts where id = new.contract_id;
  insert into notifications (user_id, kind, title, body, link)
  values (v_client, 'deliverable_submitted', '成果物が提出されました',
          null, '/contracts/' || new.contract_id);
  return new;
end;
$$;
create trigger trg_notify_deliverable after insert on deliverables
  for each row execute function notify_on_deliverable();

-- メッセージ受信通知
create or replace function notify_on_message()
returns trigger language plpgsql security definer as $$
declare
  v_client uuid; v_worker uuid; v_recipient uuid;
begin
  select client_id, worker_id into v_client, v_worker from threads where id = new.thread_id;
  v_recipient := case when new.sender_id = v_client then v_worker else v_client end;
  insert into notifications (user_id, kind, title, body, link)
  values (v_recipient, 'message_received', '新しいメッセージ',
          left(new.body, 80), '/messages/' || new.thread_id);
  return new;
end;
$$;
create trigger trg_notify_message after insert on messages
  for each row execute function notify_on_message();

-- ---------------- categories マスタ ----------------
create table categories (
  slug text primary key,
  label text not null,
  description text,
  icon text,
  sort_order integer default 0
);

insert into categories (slug, label, description, sort_order) values
  ('web', 'Web制作', 'サイト・LP・WordPress・Shopify', 10),
  ('design', 'デザイン', 'ロゴ・バナー・UIデザイン・Figma', 20),
  ('writing', 'ライティング', 'SEO記事・コピー・取材', 30),
  ('video', '動画編集', 'YouTube・リール・CM', 40),
  ('ai', 'AI・プロンプト', 'GPT活用・自動化・RAG', 50),
  ('marketing', 'マーケティング', 'SNS運用・広告・LINE', 60),
  ('translation', '翻訳・通訳', '英日・多言語', 70),
  ('dev', 'アプリ開発', 'iOS・Android・業務システム', 80),
  ('other', 'その他', '上記以外', 999);

alter table categories enable row level security;
create policy "categories readable by everyone" on categories for select using (true);
