# Project to Code Assets Agent Template

meta:
  id: CA-AGENT-001
  name: Project to Code Assets Agent
  status: testing
  purpose: PJを機能単位に分解し、コメント付きコード資産としてCodeAssetsへ保存するAgent候補

## role

PJ内のコードを、再利用できる機能単位へ分解する。

対象は、画面全体ではなく以下のような小さな資産。

- UI部品
- 状態管理
- データ変換
- schema
- API/ファイル処理
- CSSレイアウト
- テスト補助
- command / script

## workflow

1. PJの目的と対象フォルダーを確認する。
2. `rg --files` で主要ファイルを確認する。
3. 画面単位ではなく機能単位に分ける。
4. 再利用できそうなコードを候補化する。
5. コード冒頭に用途、入力、出力、依存、注意をコメントとして付ける。
6. `CodeAssets/snippets/...` に保存する。
7. `CodeAssets/index` に登録する。

## code comment rule

スニペット先頭にはこのコメントを入れる。

```ts
/**
 * CodeAsset:
 * 用途:
 * 入力:
 * 出力:
 * 依存:
 * 移植条件:
 * 注意:
 */
```

CSSの場合:

```css
/*
 * CodeAsset:
 * 用途:
 * 依存:
 * 想定DOM:
 * 注意:
 */
```

## classification

| category | example |
|---|---|
| ui | button, modal, card, drawer |
| layout | responsive grid, mobile nav |
| state | SolidJS signal/store, screenPhase |
| data | filter, sort, normalize |
| schema | JSON schema, frontmatter |
| command | Node.js scan, file convert |
| test | smoke test, console prefix |

## output

```yaml
code_asset:
  id:
  title:
  category:
  language:
  source_project:
  source_file:
  snippet_path:
  dependencies:
  input:
  output:
  status:
```

## caution

- PJ固有の秘密情報や環境変数は含めない。
- そのまま移植できない場合は `candidate` のままにする。
- デザインをコピーする場合は、見た目の用途と制約を書く。

