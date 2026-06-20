# PROJECT_CONTEXT.md

> AIエージェント向けのプロジェクト要約。詳細は各ファイルを参照。

## 概要

**Training Log** — 筋トレ・有酸素・HYROX などを記録するモバイルファーストの PWA 風 Web アプリ。  
Next.js App Router + クライアントサイド UI。現状は **インメモリのモックデータ** のみ（永続化・API なし）。

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (base-nova), @base-ui/react |
| アイコン | lucide-react |
| 言語 | TypeScript (strict) |
| パスエイリアス | `@/*` → `./src/*` |

## ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト（dark, Geist font）
│   ├── page.tsx            # ホーム（最近3セッション + 新規開始）
│   ├── history/page.tsx    # 全履歴 + 詳細シート
│   ├── settings/page.tsx   # 統計・JSON エクスポート/インポート
│   └── session/[id]/page.tsx  # セッション記録（new 含む）
├── components/
│   ├── bottom-nav.tsx      # 固定ボトムナビ（/, /history, /settings）
│   └── ui/                 # shadcn コンポーネント
└── lib/
    ├── data.ts             # 型定義・種目マスタ・モックデータ・ユーティリティ
    └── utils.ts            # cn() 等
```

## ルーティング

| パス | 説明 |
|------|------|
| `/` | ホーム。`mockSessions.slice(0,3)` 表示 |
| `/session/new` | 新規セッション（空の blocks） |
| `/session/[id]` | 既存セッション編集（`mockSessions` から取得） |
| `/history` | 全セッション一覧 + ボトムシート詳細 |
| `/settings` | バックアップ・統計 |

## データモデル（`src/lib/data.ts`）

```
Session
  id, date (YYYY-MM-DD), name, note?, status: 'active' | 'completed'
  blocks: WorkBlock[]

WorkBlock
  id, type: '単体' | 'スーパーセット' | 'サーキット' | 'インターバル'
  order, rows: ExerciseRow[]

ExerciseRow
  id, exerciseId, exerciseName, round, order
  status: 'completed' | 'draft'
  metrics: { weight?, reps?, distance?, time?, rpe?, note? }

ExerciseMaster
  id, name, mainCategory, subCategory
  metrics[], completionCondition[], progressMetric
```

**カテゴリ:** 大分類 `筋トレ | 有酸素 | ファンクショナル` / 小分類（胸・背中・ラン・HYROX 等）

**ユーティリティ:** `calcEstimatedRM` (Epley法), `formatTime`, `formatDistance`, `countCompletedRows`

## UI・デザイン規約

- **ダークテーマ固定:** 背景 `#111111`, カード `#1a1a1a`, アクセント `orange-500`
- **モバイル幅:** `max-w-md` 中央寄せ、ボトムナビ `fixed bottom-0`
- **セッション画面:** ヘッダー固定 + 進捗バー + 完了ボタン固定下部
- **Sheet:** 種目ピッカー・履歴詳細は `side="bottom"` のボトムシート
- **完了判定（セッション画面）:** `isSetDone()` — 重量+回数 or 距離があれば完了

## 状態管理の現状

- 各ページが `useState` でローカル管理
- データソースは `mockSessions` / `exerciseMaster` を直接 import
- **セッション編集内容は保存されない**（リロードで消失）
- 設定の JSON インポートはパース成功表示のみ（実データ反映なし）

## JSON エクスポート形式

```json
{
  "schemaVersion": "1.0.0",
  "appMeta": { "name": "training-log", "exportedAt": "..." },
  "exerciseMaster": [...],
  "sessions": [...]
}
```

## 開発コマンド

```bash
npm run dev    # http://localhost:3000
npm run build
npm run lint
```

## 既知の制約・未実装

1. 永続化（localStorage / IndexedDB / DB）未実装
2. セッション完了ボタンは `/` へ遷移するだけ（status 更新・保存なし）
3. `detectCategories()` が種目名の文字列マッチで大分類を推定（マスタ参照ではない）
4. カスタム種目作成はセッション内 state のみ（マスタに追加されない）
5. README は create-next-app デフォルトのまま

## 変更時の注意

- 型・マスタ・モックは **すべて `data.ts` に集約**。新種目・型変更はここを先に更新
- UI コンポーネント追加は `npx shadcn@latest add <component>`（`components.json` 参照）
- `'use client'` が必要なページ: history, settings, session/[id]
- ホーム (`page.tsx`) は Server Component

## バージョン表記

- `package.json`: 0.1.0
- 設定画面フッター: v0.2.0（UI 側の表示のみ、不一致あり）
