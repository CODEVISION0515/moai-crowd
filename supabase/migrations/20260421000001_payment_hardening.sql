-- 決済システム堅牢化
-- ============================================================
-- 1. Webhook冪等性: stripe_event_id 列を追加しユニーク制約
-- 2. 新しいtransaction種別: transfer_failed, charge_failed
-- 3. 新しいcontract状態: transfer_failed (Transfer失敗時の一時状態)
-- 4. 監査ログ: admin による返金アクションを記録可能に

-- ── transaction_kind 拡張 ──────────────────────────────
alter type transaction_kind add value if not exists 'transfer_failed';
alter type transaction_kind add value if not exists 'charge_failed';

-- ── transactions に stripe_event_id 列追加（冪等性用） ──────────────
alter table transactions
  add column if not exists stripe_event_id text;

-- Stripe Event の重複処理を防ぐユニーク制約
create unique index if not exists transactions_stripe_event_id_key
  on transactions (stripe_event_id)
  where stripe_event_id is not null;

-- stripe_ref も重複防止（Transfer ID の二重記録を防止）
create unique index if not exists transactions_stripe_ref_key
  on transactions (stripe_ref)
  where stripe_ref is not null;

-- ── contracts に transfer_failed 列追加 ──────────────────
-- Transfer が失敗した場合、contract は "submitted" のまま保持しつつ
-- admin 対応用にフラグを立てる
alter table contracts
  add column if not exists transfer_failed_at timestamptz,
  add column if not exists transfer_failure_reason text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refund_reason text,
  add column if not exists refunded_by uuid references profiles(id);

-- ── admin宛の決済アラート通知を簡単に作るためのヘルパー ──────────
-- 管理者全員に通知を挿入
create or replace function public.notify_admins(
  p_title text,
  p_body text,
  p_link text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (user_id, kind, title, body, link)
  select id, 'contract_funded'::notification_kind, p_title, p_body, p_link
  from profiles
  where role in ('admin', 'moderator');
end;
$$;

comment on function public.notify_admins is '管理者・モデレーター全員にアプリ内通知を送信。決済エラー等の緊急アラート用。';
