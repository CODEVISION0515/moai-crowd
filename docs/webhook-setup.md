# Supabase Database Webhook 設定

`notifications` テーブルのINSERTを `/api/mail/notify` へ転送するDB Webhookを設定します。

## 手順

1. Supabase Dashboard → Database → Webhooks → **Create a new hook**
2. 以下のとおり設定:
   - **Name**: `notify-email`
   - **Table**: `public.notifications`
   - **Events**: ☑️ Insert
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-domain.com/api/mail/notify`
   - **HTTP Headers**:
     - `Content-Type: application/json`
     - `x-webhook-secret: <SUPABASE_WEBHOOK_SECRETと同じ値>`

3. Save

## ローカル開発時

ngrok等でlocalhostを公開:
```
ngrok http 3000
```
URL欄にngrokのURLを設定。
