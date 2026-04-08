-- ============================================================
-- 請求書・源泉徴収・支払いサイクル
-- ============================================================

-- 源泉徴収率（個人受注者: 10.21% / 100万円超部分は20.42%）
-- 簡易実装: 10.21%固定（100万円超過分は後続対応）
alter table profiles add column is_individual boolean default true;
alter table profiles add column tax_exempt boolean default false;
alter table profiles add column invoice_name text;
alter table profiles add column invoice_address text;
alter table profiles add column invoice_registration_number text;  -- インボイス制度登録番号 T+13桁

-- 契約に源泉徴収情報を追加
alter table contracts add column withholding_tax_jpy integer default 0;
alter table contracts add column net_payout_jpy integer;  -- 受注者手取り(源泉徴収後)

-- 請求書
create type invoice_status as enum ('draft', 'sent', 'paid', 'void');

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  contract_id uuid references contracts(id) on delete set null,
  issuer_id uuid not null references profiles(id),   -- 発行者 (通常プラットフォーム or 受注者)
  recipient_id uuid not null references profiles(id),
  subject text not null,
  subtotal_jpy integer not null,
  tax_jpy integer default 0,
  withholding_tax_jpy integer default 0,
  total_jpy integer not null,
  issued_at date default current_date,
  due_date date,
  paid_at timestamptz,
  status invoice_status default 'sent',
  pdf_url text,
  notes text,
  created_at timestamptz default now()
);
create index on invoices (recipient_id, status);
create index on invoices (issuer_id, issued_at desc);

alter table invoices enable row level security;
create policy "invoices visible to parties"
  on invoices for select using (issuer_id = auth.uid() or recipient_id = auth.uid());
create policy "issuers create invoices"
  on invoices for insert with check (issuer_id = auth.uid());
create policy "issuers update invoices"
  on invoices for update using (issuer_id = auth.uid());

-- 明細
create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price_jpy integer not null,
  subtotal_jpy integer not null,
  sort_order integer default 0
);
create index on invoice_items (invoice_id);

alter table invoice_items enable row level security;
create policy "items visible with invoice"
  on invoice_items for select using (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id
      and (i.issuer_id = auth.uid() or i.recipient_id = auth.uid()))
  );
create policy "items writable by issuer"
  on invoice_items for all using (
    exists (select 1 from invoices i where i.id = invoice_items.invoice_id and i.issuer_id = auth.uid())
  );

-- 支払いサイクル設定 (受注者ごと)
create table payout_schedules (
  user_id uuid primary key references profiles(id) on delete cascade,
  cycle text check (cycle in ('immediate', 'weekly', 'monthly')) default 'monthly',
  cutoff_day integer default 31,       -- 月締日
  payout_day integer default 25,        -- 翌月支払日
  minimum_jpy integer default 1000,     -- 最低支払額
  updated_at timestamptz default now()
);

alter table payout_schedules enable row level security;
create policy "users manage own payout schedule"
  on payout_schedules for all using (user_id = auth.uid());

-- 契約確定時に源泉徴収計算
create or replace function calc_withholding_on_contract()
returns trigger language plpgsql as $$
declare
  v_worker profiles%rowtype;
  v_withhold integer := 0;
begin
  select * into v_worker from profiles where id = new.worker_id;
  if v_worker.is_individual and not v_worker.tax_exempt then
    -- 10.21%源泉徴収 (契約金額 - 手数料 に対して)
    v_withhold := floor(new.worker_payout_jpy * 0.1021);
  end if;
  new.withholding_tax_jpy := v_withhold;
  new.net_payout_jpy := new.worker_payout_jpy - v_withhold;
  return new;
end;
$$;
create trigger trg_calc_withholding before insert on contracts
  for each row execute function calc_withholding_on_contract();

-- 請求書番号自動採番
create sequence if not exists invoice_seq start 1000;
create or replace function gen_invoice_number()
returns trigger language plpgsql as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := 'INV-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('invoice_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;
create trigger trg_gen_invoice_number before insert on invoices
  for each row execute function gen_invoice_number();
