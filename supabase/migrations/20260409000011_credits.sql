-- ============================================================
-- AIクレジットシステム
-- ============================================================

-- profiles に残高
alter table profiles add column credits_balance integer default 0;

-- クレジット取引履歴
create type credit_tx_kind as enum (
  'welcome_bonus',      -- 新規登録ボーナス
  'admin_grant',        -- 管理者付与
  'campaign_bonus',     -- キャンペーン付与
  'purchase',           -- Stripe購入
  'consume',            -- AI機能消費
  'refund'              -- 払い戻し
);

create table credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,              -- 正: 付与, 負: 消費
  balance_after integer not null,
  kind credit_tx_kind not null,
  reason text,                           -- 消費機能名など
  metadata jsonb,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);
create index on credit_transactions (user_id, created_at desc);
create index on credit_transactions (kind);

alter table credit_transactions enable row level security;
create policy "users see own transactions"
  on credit_transactions for select using (user_id = auth.uid());
create policy "admin sees all transactions"
  on credit_transactions for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','moderator'))
  );

-- クレジット購入パッケージ(マスタ)
create table credit_packages (
  id text primary key,
  name text not null,
  credits integer not null,
  price_jpy integer not null,
  is_popular boolean default false,
  is_active boolean default true,
  sort_order integer default 0,
  description text
);

insert into credit_packages (id, name, credits, price_jpy, is_popular, sort_order, description) values
  ('trial', 'お試し', 100, 980, false, 10, '初めての方向け'),
  ('light', 'ライト', 300, 2980, false, 20, 'たまに使う方に'),
  ('standard', 'スタンダード', 1000, 8800, true, 30, '一番人気・1クレジット¥8.8'),
  ('pro', 'プロ', 3000, 24000, false, 40, 'ヘビーユーザー向け・1クレジット¥8'),
  ('unlimited_monthly', '無制限月額', 0, 9800, false, 50, '月額・AI機能使い放題');

alter table credit_packages enable row level security;
create policy "packages readable by everyone" on credit_packages for select using (true);

-- AI機能マスタ(消費クレジット)
create table ai_features (
  slug text primary key,
  name text not null,
  description text,
  credits_cost integer not null default 0,
  is_free_during_beta boolean default true,   -- ベータ期間は無料
  is_active boolean default true,
  sort_order integer default 0
);

insert into ai_features (slug, name, credits_cost, sort_order, description) values
  ('draft_job', 'AI案件文下書き', 5, 10, '曖昧なアイデアから案件文を自動生成'),
  ('draft_proposal', 'AI応募文下書き', 5, 20, '案件に最適な応募文をAIが作成'),
  ('match_workers', 'AIマッチング(候補者推薦)', 30, 30, 'あなたの案件にぴったりな受注者を5名提案'),
  ('recommend_jobs', 'AI案件推薦', 5, 40, 'あなたに向いている案件をAIがピックアップ'),
  ('suggest_price', 'AI見積り相場提案', 10, 50, '類似案件データから適正予算を提案'),
  ('review_deliverable', 'AI成果物レビュー', 30, 60, '納品物を要件と照合してAIがチェック'),
  ('profile_coach', 'AIプロフィールコーチ', 10, 70, '受注率を上げるアドバイス'),
  ('scout_message', 'AIスカウト文生成', 10, 80, '受注者への個別スカウト文を自動作成'),
  ('contract_draft', 'AI契約書ドラフト', 20, 90, '案件内容から契約書を自動生成'),
  ('job_boost', '案件ブースト(24h TOP表示)', 50, 100, '案件を24時間トップに表示');

alter table ai_features enable row level security;
create policy "features readable by everyone" on ai_features for select using (true);

-- クレジット付与RPC (security definer)
create or replace function grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_kind credit_tx_kind,
  p_reason text default null,
  p_metadata jsonb default null,
  p_stripe_pi text default null
) returns integer
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_new_balance integer;
begin
  update profiles
    set credits_balance = coalesce(credits_balance, 0) + p_amount
    where id = p_user_id
    returning credits_balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'user not found';
  end if;

  insert into credit_transactions (user_id, amount, balance_after, kind, reason, metadata, stripe_payment_intent_id)
  values (p_user_id, p_amount, v_new_balance, p_kind, p_reason, p_metadata, p_stripe_pi);

  return v_new_balance;
end;
$$;

-- クレジット消費RPC (残高不足ならfalse)
create or replace function consume_credits(
  p_user_id uuid,
  p_feature_slug text,
  p_metadata jsonb default null
) returns jsonb
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_feature ai_features%rowtype;
  v_balance integer;
  v_new_balance integer;
  v_cost integer;
begin
  select * into v_feature from ai_features where slug = p_feature_slug and is_active = true;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'feature_not_found');
  end if;

  -- ベータ期間は無料
  if v_feature.is_free_during_beta then
    return jsonb_build_object('ok', true, 'consumed', 0, 'free', true);
  end if;

  v_cost := v_feature.credits_cost;

  select coalesce(credits_balance, 0) into v_balance from profiles where id = p_user_id;
  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'error', 'insufficient_credits', 'required', v_cost, 'balance', v_balance);
  end if;

  update profiles set credits_balance = credits_balance - v_cost
    where id = p_user_id
    returning credits_balance into v_new_balance;

  insert into credit_transactions (user_id, amount, balance_after, kind, reason, metadata)
  values (p_user_id, -v_cost, v_new_balance, 'consume', v_feature.name, p_metadata || jsonb_build_object('feature', p_feature_slug));

  return jsonb_build_object('ok', true, 'consumed', v_cost, 'balance', v_new_balance);
end;
$$;

-- 新規ユーザーにウェルカムボーナス (1000クレジット)
create or replace function welcome_credits_on_profile()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
begin
  perform grant_credits(new.id, 1000, 'welcome_bonus', 'ベータ期間ウェルカム特典', null, null);
  return new;
end;
$$;

create trigger trg_welcome_credits after insert on profiles
  for each row execute function welcome_credits_on_profile();

-- 既存ユーザー全員にも付与(マイグレーション1回限り)
do $$
declare r record;
begin
  for r in select id from profiles where coalesce(credits_balance, 0) = 0 loop
    perform grant_credits(r.id, 1000, 'welcome_bonus', 'ベータ開始記念', null, null);
  end loop;
end $$;
