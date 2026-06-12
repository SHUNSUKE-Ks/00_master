# BrainAgent

Brain 全体を整理・索引化・更新する agent の作業場所です。

## 役割

- `Brain\00_Index` の索引を更新する
- 新しいアプリ、資料、module を登録する
- `ContextBlocks` のコピー用パスを更新する
- `Reports` や `Inbox` を分類する
- 原本テンプレートと派生アプリの住み分けを監視する

## 基本ルール

1. 何かを追加したら `Brain\00_Index` に登録する
2. 原本テンプレートは `Brain\1000_OriginalTemplates` に登録する
3. 実行系 module は `Brain\CommandModules` に置く
4. カンバンへ渡す短い context は `Brain\ContextBlocks` に置く

