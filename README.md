# MOAI Crowd

MOAIコミュニティ発のクラウドソーシングプラットフォーム。

## コンセプト
- MOAIコミュニティは**完全無料**化
- 仕事のマッチング・エスクロー決済・チャット・評価を一気通貫で提供
- マネタイズは**成約手数料**（取引成立時に%課金）

## 技術スタック
- **Frontend/Backend**: Next.js 15 (App Router) + TypeScript
- **DB/Auth/Storage**: Supabase (Postgres + RLS)
- **決済**: Stripe Connect (Escrow)
- **スタイル**: Tailwind CSS
- **デプロイ**: Vercel

## セットアップ

```bash
# 依存関係インストール
npm install

# Supabase起動（ローカル）
npx supabase start

# マイグレーション適用
npm run db:push

# 環境変数設定
cp .env.example .env.local
# → Supabase・Stripeのキーを記入

# 開発サーバー
npm run dev
```

## ディレクトリ構成

```
moai-crowd/
├── app/                    # Next.js App Router
│   ├── (auth)/            # ログイン・サインアップ
│   ├── jobs/              # 案件掲載・詳細・応募
│   ├── messages/          # チャット
│   ├── dashboard/         # 発注者/受注者ダッシュボード
│   ├── profile/           # プロフィール・評価
│   └── api/               # API Routes (Stripe Webhook等)
├── components/            # UIコンポーネント
├── lib/
│   └── supabase/          # Supabaseクライアント
├── supabase/
│   └── migrations/        # DBスキーマ
└── types/                 # TypeScript型定義
```

## 主要機能 (MVP)

| 機能 | 概要 |
|---|---|
| 案件掲載・応募 | 発注者が案件投稿、受注者が応募 |
| メッセージ | 発注者⇔受注者のチャット |
| エスクロー決済 | Stripe Connectで報酬を仮預かり |
| プロフィール・評価 | スキル、ポートフォリオ、相互レビュー |

## マネタイズ
- 成約手数料: **10%** (デフォルト、調整可)
- エスクロー経由の取引にのみ発生

## データモデル概要

- `profiles` — ユーザー (発注者/受注者の共通プロフィール)
- `jobs` — 案件
- `proposals` — 応募
- `contracts` — 成約した契約 (エスクロー紐付け)
- `messages` — チャット
- `reviews` — 相互評価
- `transactions` — 決済履歴

詳細は [supabase/migrations/](supabase/migrations/) を参照。
