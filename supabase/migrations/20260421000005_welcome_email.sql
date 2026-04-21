-- Welcome メール送信記録
-- ============================================================
alter table profiles
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists signup_intent text;

comment on column profiles.welcome_email_sent_at is 'Welcome メール送信済みタイムスタンプ（null なら未送信）';
comment on column profiles.signup_intent is 'サインアップ時の intent (client/worker/both) — UXカスタマイズ用';
