-- Phase 3: 個人/法人の区分を登録時に選択（ランサーズ式）
-- 会社情報の詳細（会社名・登記住所・代表者名等）は任意項目で、
-- 請求書発行時など実務上必要になったタイミングで埋めてもらう運用。

-- 1. account_type enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_type_enum') then
    create type account_type_enum as enum ('individual', 'corporate');
  end if;
end$$;

-- 2. profiles に列追加
alter table profiles
  add column if not exists account_type account_type_enum not null default 'individual',
  add column if not exists company_name text,
  add column if not exists company_address text,
  add column if not exists representative_name text,
  add column if not exists invoice_registration_number text; -- 適格請求書発行事業者登録番号

comment on column profiles.account_type is
  '個人=individual / 法人=corporate。登録時に確定、後で変更可。';
comment on column profiles.company_name is
  '法人名・屋号。発注者側で請求書発行時に必須化。';
comment on column profiles.company_address is
  '登記住所または本社所在地。';
comment on column profiles.representative_name is
  '代表者名。';
comment on column profiles.invoice_registration_number is
  '適格請求書発行事業者登録番号（Tから始まる13桁）。';
