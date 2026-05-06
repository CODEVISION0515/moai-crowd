-- ============================================================
-- Manual payout mode (Stripe Connect 不在時の暫定運用)
-- ------------------------------------------------------------
-- 受注者は自前フォームから銀行口座を登録し、運営が手動で振込む。
-- - profiles に銀行口座カラム追加
-- - contracts に paid_out_at（手動振込完了日時）追加
-- ============================================================

-- 受注者の振込先口座情報。RLS で本人と admin のみアクセス可。
alter table profiles
  add column if not exists bank_name text,
  add column if not exists bank_branch_name text,
  add column if not exists bank_branch_code text,
  add column if not exists bank_account_type text check (bank_account_type in ('ordinary', 'checking', 'savings')),
  add column if not exists bank_account_number text,
  add column if not exists bank_account_holder text,
  add column if not exists bank_registered_at timestamptz;

comment on column profiles.bank_name is '銀行名 (例: みずほ銀行)';
comment on column profiles.bank_branch_name is '支店名 (例: 那覇支店)';
comment on column profiles.bank_branch_code is '支店コード 3桁 (例: 251)';
comment on column profiles.bank_account_type is '口座種別: ordinary=普通 / checking=当座 / savings=貯蓄';
comment on column profiles.bank_account_number is '口座番号 (7桁)';
comment on column profiles.bank_account_holder is '口座名義 (カナ)';
comment on column profiles.bank_registered_at is '銀行口座を最後に更新した日時';

-- 手動振込完了管理
alter table contracts
  add column if not exists paid_out_at timestamptz,
  add column if not exists paid_out_note text;

comment on column contracts.paid_out_at is '運営が銀行振込を完了した日時 (手動振込モード)';
comment on column contracts.paid_out_note is '振込時の管理者メモ (任意)';

create index if not exists contracts_paid_out_idx
  on contracts (released_at, paid_out_at)
  where status = 'released';

-- 銀行口座が登録済かどうかを判定する view (UI/API で利用)
create or replace view profiles_bank_status as
select
  id,
  (bank_name is not null
   and bank_branch_name is not null
   and bank_account_number is not null
   and bank_account_holder is not null) as bank_registered
from profiles;

grant select on profiles_bank_status to authenticated;
