# Neon + Google ログイン セットアップ

Training Log を Neon（PostgreSQL）と Google ログインで使うための手順です。

## 1. Neon でデータベースを作成

1. [Neon Console](https://console.neon.tech/) でプロジェクトを作成
2. **Connection string** をコピー（`postgresql://...?sslmode=require`）

## 2. Google OAuth クライアントを作成

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIとサービス** → **認証情報**
2. **OAuth 2.0 クライアント ID** を作成（アプリケーションの種類: **ウェブアプリケーション**）
3. **承認済みのリダイレクト URI** に以下を追加:
   - ローカル: `http://localhost:3000/api/auth/callback/google`
   - 本番: `https://<your-domain>/api/auth/callback/google`
4. クライアント ID とシークレットを控える

## 3. 環境変数を設定

`.env.example` を `.env.local` にコピーして値を埋めます。

```bash
cp .env.example .env.local
```

| 変数 | 説明 |
|------|------|
| `DATABASE_URL` | Neon の接続文字列 |
| `AUTH_SECRET` | `npx auth secret` で生成 |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアント ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット |

## 4. DB スキーマを適用

```bash
npm run db:setup
```

または Neon の SQL Editor で `src/lib/db/schema.sql` の内容を実行。

## 5. 起動

```bash
npm run dev
```

設定 → **Google でログイン** からサインインすると、記録が Neon に自動同期されます。

## 動作

- **未ログイン**: 従来どおりブラウザの localStorage に保存
- **ログイン後**: Neon の `user_workout_data` テーブルに自動同期
- **初回ログイン**: 端末内のデータがクラウドに空の場合、アップロードされます
- **タイマー状態**（`activeRun` 等）: 端末ローカルのまま（デバイス固有）

## Vercel デプロイ時

Vercel の Environment Variables に上記 4 変数を設定してください。
