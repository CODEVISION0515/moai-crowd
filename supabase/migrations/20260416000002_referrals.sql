-- ============================================================
-- リファラル（紹介）機能
-- ============================================================

-- 紹介コード（1ユーザー1コード）
create table referral_codes (
  code text primary key,
  owner_id uuid not null unique references profiles(id) on delete cascade,
  created_at timestamptz default now()
);
create index on referral_codes (owner_id);

alter table referral_codes enable row level security;
create policy "owner reads own code" on referral_codes for select using (owner_id = auth.uid());
-- 紹介URLからのlookupは API route 経由（admin client）で行うため anon select は許可しない

-- 紹介関係（誰が誰を紹介したか）
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referee_id uuid not null unique references profiles(id) on delete cascade,
  code text not null references referral_codes(code),
  signup_rewarded_at timestamptz,
  first_deal_rewarded_at timestamptz,
  referee_segment text check (referee_segment in ('client','worker')),
  created_at timestamptz default now()
);
create index on referrals (referrer_id);

alter table referrals enable row level security;
create policy "parties read own referrals" on referrals for select
  using (referrer_id = auth.uid() or referee_id = auth.uid());

-- ============================================================
-- 紹介コード発行
-- ============================================================
create or replace function issue_referral_code(p_user_id uuid)
returns text
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_existing text;
  v_code text;
  v_attempts integer := 0;
begin
  -- 既存のコードがあれば返す
  select code into v_existing from referral_codes where owner_id = p_user_id;
  if v_existing is not null then
    return v_existing;
  end if;

  -- 新規生成（衝突したらリトライ、URL安全な8文字）
  loop
    v_code := upper(substr(translate(encode(gen_random_bytes(6), 'base64'), '+/=', ''), 1, 8));
    begin
      insert into referral_codes (code, owner_id) values (v_code, p_user_id);
      return v_code;
    exception when unique_violation then
      v_attempts := v_attempts + 1;
      if v_attempts > 10 then
        raise exception 'failed to generate unique referral code';
      end if;
    end;
  end loop;
end;
$$;

-- ============================================================
-- サインアップ時の紹介適用（profile作成トリガー）
-- 失敗してもユーザー登録自体は通す（サイレントスキップ）
-- ============================================================
create or replace function apply_referral_from_metadata()
returns trigger
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_code text;
  v_referrer_id uuid;
  v_signup_referrer_reward integer := 100;
  v_signup_referee_reward  integer := 500;
begin
  -- auth.users から referral_code を取り出す
  select raw_user_meta_data->>'referral_code' into v_code
    from auth.users where id = new.id;

  if v_code is null or length(v_code) = 0 then
    return new;
  end if;

  -- コードを解決
  select owner_id into v_referrer_id from referral_codes where code = v_code;
  if v_referrer_id is null then
    return new;  -- 無効コード: スキップ
  end if;

  -- 自己紹介NG
  if v_referrer_id = new.id then
    return new;
  end if;

  -- 既被紹介NG（UNIQUE違反を事前に避ける）
  if exists (select 1 from referrals where referee_id = new.id) then
    return new;
  end if;

  -- 紹介関係を記録
  insert into referrals (referrer_id, referee_id, code, signup_rewarded_at)
    values (v_referrer_id, new.id, v_code, now());

  -- 双方にクレジット付与
  perform grant_credits(v_referrer_id, v_signup_referrer_reward, 'referral_signup',
    '友達紹介ボーナス（登録）', jsonb_build_object('referee_id', new.id), null);
  perform grant_credits(new.id, v_signup_referee_reward, 'referral_signup',
    '紹介経由登録ボーナス', jsonb_build_object('referrer_id', v_referrer_id), null);

  return new;
exception when others then
  -- 何が起きても登録自体は通す
  return new;
end;
$$;

-- welcome（1000付与）の後に発火するよう、トリガー名を 'z_' で並び順を後にする
create trigger trg_apply_referral after insert on profiles
  for each row execute function apply_referral_from_metadata();

-- ============================================================
-- 初回取引成立時の本報酬（原子的更新で冪等性担保）
-- ============================================================
create or replace function award_referral_first_deal(
  p_referee_id uuid,
  p_segment text  -- 'client' or 'worker'
) returns void
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_referrer_id uuid;
  v_referrer_reward integer;
  v_referee_reward integer;
begin
  if p_segment not in ('client', 'worker') then
    return;
  end if;

  -- 「自分が確定させた」場合のみ referrer_id が返る（並列実行でも一度のみ）
  update referrals
    set first_deal_rewarded_at = now(),
        referee_segment = p_segment
    where referee_id = p_referee_id
      and first_deal_rewarded_at is null
    returning referrer_id into v_referrer_id;

  if v_referrer_id is null then
    return;  -- 紹介関係なし or 既報酬済み
  end if;

  -- 発注者紹介を厚く
  if p_segment = 'client' then
    v_referrer_reward := 2000;
    v_referee_reward  := 500;
  else
    v_referrer_reward := 500;
    v_referee_reward  := 200;
  end if;

  perform grant_credits(v_referrer_id, v_referrer_reward, 'referral_first_deal',
    '友達紹介ボーナス（初回取引: ' || p_segment || '）',
    jsonb_build_object('referee_id', p_referee_id, 'segment', p_segment), null);
  perform grant_credits(p_referee_id, v_referee_reward, 'referral_first_deal',
    '紹介経由初回取引ボーナス',
    jsonb_build_object('referrer_id', v_referrer_id, 'segment', p_segment), null);
end;
$$;
