# CodeAssets

meta:
  owner: codex
  created: 2026-06-20
  status: active
  purpose: 見た目、機能、言語別のコードスニペット資産を蓄積する場所

## 目的

CodeAssetsは、各PJで作ったUI、機能、状態管理、データ処理、アニメーション、テスト補助などを、再利用できるコード資産として保存する場所。

ただコードを置くだけではなく、何に使うか、入力、出力、依存、注意点、移植条件をコメント付きで残す。

## 基本ルール

1. PJから直接コピーしただけで終わらせない。
2. 機能単位に分解する。
3. 先頭コメントに用途、入力、出力、依存、注意点を書く。
4. SolidJS / React / CSS / Node.js など言語や用途で分ける。
5. UI系は見た目の用途も書く。
6. 本採用前のものは `candidate` として置く。

## ディレクトリ

| path | role |
|---|---|
| `snippets/solidjs` | SolidJSコンポーネント、signal、store、UI処理 |
| `snippets/css` | 見た目、レスポンシブ、カード、ボタン、レイアウト |
| `snippets/nodejs` | scan、変換、CLI、ファイル処理 |
| `snippets/schemas` | JSON schema、frontmatter schema |
| `patterns` | 複数ファイルにまたがる実装パターン |
| `index` | スニペット索引 |
| `templates` | 新規スニペット記入テンプレート |

## 最初に読むもの

1. `index/code_assets_index_2026-06-20.md`
2. `templates/code_snippet_template.md`
3. `templates/project_to_code_assets_agent_template.md`

