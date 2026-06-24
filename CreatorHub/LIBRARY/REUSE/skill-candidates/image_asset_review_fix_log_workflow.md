# Image Asset Review Fix Log Workflow Skill候補

meta:
  date: 2026-06-21
  status: candidate
  source: C:\00_master\APP\novelEngine
  candidate_type: AgentSkill / Workflow / Template

## 目的

画像生成後の確認、コメント、修正依頼、再生成指示を定型化する。

## 入力

- 画像ファイル
- 画像ID
- screen / state / layer分類
- 人間のコメント

## 出力

- 画像別コメント
- 修正依頼ログ
- Copy可能なMarkdown
- 次回生成プロンプトの修正材料

## 現状

- `2D_SRPGStudio` に画面別Galleryを追加済み。
- 画像クリックでLightbox表示、左右移動が可能。
- 画像IDごとのコメントを `localStorage` に保存。
- Fix Logとして蓄積し、Markdownコピー可能。

## Skill化条件

- 同じ画像レビュー工程を2回以上使う。
- 修正依頼Markdownの形式が安定する。
- 画像生成、背景除去、採用判定、再生成指示まで一連の流れになる。

## 関連資料

- C:\00_master\APP\novelEngine\docs\2d_srpgstudio_visual_asset_scaffold_2026-06-21.md
- C:\00_master\APP\novelEngine\src\DevStudio\DevStudio.jsx
- C:\00_master\APP\novelEngine\src\DevStudio\srpgStudioData.js

