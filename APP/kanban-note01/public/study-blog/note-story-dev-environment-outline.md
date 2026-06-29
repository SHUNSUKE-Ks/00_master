# Note開発環境 学習ロードマップ

このCardは、Note_Storyを作りながらSolidJS、状態駆動、PWA、Firebase、スカフォールド開発を覚えるための目次です。

## 要点

| Key | 意味 |
| --- | --- |
| 環境 | 開発を動かす土台 |
| 構成 | ファイルと責務の分け方 |
| 状態 | 画面とデータの現在地 |
| 操作 | ユーザー入力からStateを変える処理 |
| 保存 | localStorage / Firebase / PWA同期 |
| 検証 | build / console / Android表示確認 |

## 01 環境起動

### 開発サーバー

```powershell
cd C:\00_master\APP\kanban-note01
npm run dev -- --host 127.0.0.1 --port 5185
```

### Build確認

```powershell
cd C:\00_master\APP\kanban-note01
npm run build
```

### PWA確認

```text
Local変更
→ npm run build
→ Vercel deploy
→ Android PWAで更新確認
```

## 02 全体構成

### App Root

### Header

### Store

### Page

### Component

### CSS

## 03 状態駆動

### 状態：画面の現在地

### 派生：Stateから計算する値

### 操作：イベントからStateを変える

### 戻路：一つ前の階層へ戻す

### 復帰：壊れた状態から安全な一覧へ戻す

## 04 Note入力系

### Noteモード

### 会話ログモード

### 階層ステップ

### Characterシート

### Markdown記号Footer

## 05 InBox系

### Global InBox

### Local保存

### Firebase同期

### 同期状態チェック

### Archive

## 06 Gallery / Asset

### Instagram Grid

### Pinterest Masonry

### Asset Tag DB

### Tag Prefix

### NovelEngine連携

## 07 Study Blog

### Module一覧

### Card一覧

### Card本文

### 関連Card

### 用語索引

### コード参照

## 08 検証

### Console Log

### Android縦表示

### PWA更新

### Build Error

### 手動チェックリスト

## 09 リファクタリング

### 境界：UIとStoreを分ける

### 抽出：大きいPageからComponentを抜く

### 命名：漢字Keyで意味を固定する

### 記録：Study Cardへ残す

## 10 AI運用

### 指示Card

### Report

### Task化

### 正本化

### 更新規則
