# デプロイガイド

## 構成
- **Frontend/API**: Vercel (Next.js)
- **DB/Auth/Storage**: Supabase (本番プロジェクト)
- **決済**: Stripe (本番モード + Connect)
- **メール**: Resend

## 1. Supabase本番プロジェクト準備

```bash
# Supabase CLI 初回セットアップ
npx supabase login
npx supabase link --project-ref <your-project-ref>

# マイグレーション適用
npx supabase db push
```

設定項目:
- **Auth → URL Configuration**: Site URL に本番URL、Redirect URLs に `https://your-domain.com/**`
- **Auth → Email Templates**: 確認メール・パスワードリセットを日本語化
- **Database → Webhooks**: `docs/webhook-setup.md` 参照

初期管理者を作成:
```sql
-- Supabase SQL Editorで実行
update profiles set role = 'admin' where handle = 'your_handle';
```

## 2. Stripe設定

1. 本番モードで APIキー取得
2. Webhook エンドポイント追加:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `account.updated`
3. Connect 設定 → プラットフォーム情報を入力
4. 取得したシークレットを環境変数に設定

## 3. Vercelデプロイ

```bash
# 初回
npx vercel
npx vercel --prod
```

または GitHub連携で main プッシュごとに自動デプロイ。

### 必須環境変数 (Vercel Dashboard → Settings → Environment Variables)

| Key | 値の例 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_APP_URL` | `https://moai-crowd.vercel.app` |
| `PLATFORM_FEE_PERCENT` | `10` |
| `RESEND_API_KEY` | `re_...` |
| `MAIL_FROM` | `"MOAI Crowd <noreply@moai.okinawa>"` |
| `SUPABASE_WEBHOOK_SECRET` | ランダム文字列 |

## 4. ドメイン設定

1. Vercel → Settings → Domains で独自ドメイン追加 (例: `crowd.moai.okinawa`)
2. DNSでCNAME設定
3. `NEXT_PUBLIC_APP_URL` を本番URLに更新
4. Stripe・Supabaseの Redirect URL も更新

## 5. 動作確認チェックリスト

- [ ] サインアップ → 確認メール受信 → ログイン
- [ ] プロフィール編集
- [ ] Stripe Connect オンボーディング完了
- [ ] 案件投稿 → 別アカウントから応募
- [ ] 応募承諾 → エスクロー入金 (テストカード `4242...`)
- [ ] 成果物提出 → 承認 → Transfer実行
- [ ] 相互レビュー → プロフィール評価反映
- [ ] 通知メールがResendから送信される
- [ ] 通報 → 管理画面で対応
- [ ] 検索 (案件・受注者)

## 6. 運用メモ

- **初期管理者アカウント**: Supabase SQL で `role = 'admin'` に更新
- **手数料変更**: `PLATFORM_FEE_PERCENT` 環境変数を変更 → 再デプロイ
- **バックアップ**: Supabase自動バックアップ (Pro plan以上)
- **ログ監視**: Vercel Logs + Supabase Logs
