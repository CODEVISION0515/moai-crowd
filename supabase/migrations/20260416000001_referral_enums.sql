-- ============================================================
-- リファラル機能: enum値の追加
-- 注意: PostgreSQL の制約により、enum追加と同enum値を使うコードは
-- 別マイグレーション（別トランザクション）に分ける必要がある。
-- ============================================================

alter type credit_tx_kind add value if not exists 'referral_signup';
alter type credit_tx_kind add value if not exists 'referral_first_deal';
