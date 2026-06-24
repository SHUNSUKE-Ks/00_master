# Note Study Blog 設計索引

## 目的

Noteアプリを開発した過程を、再利用可能な技術知識へ分解する。
主な読者は開発者本人と将来のLocal AIであり、一般向けブログの読み物にはしない。

## 文書

| 文書 | 用途 |
| --- | --- |
| [01_layout_spec.md](./01_layout_spec.md) | Android中心の画面構成、閲覧動線、文字と余白の基準 |
| [02_functional_spec.md](./02_functional_spec.md) | Module/Card/Tag/Relation、検索、版管理、受入条件 |

## 情報階層

```text
Study Blog
├ Module       複数のCardを学習順・依存順に束ねる
│  ├ Card      再利用可能な最小知識
│  │  └ Section 見出し、説明、コード、検証
│  └ Relation  前提、関連、後続
├ Tag DB       技術、設計、領域、用途、状態
├ Glossary     用語定義と関連記事
└ Index        検索、目次、フィルター用View
```

## 実装前提

- 初期版は読み取り専用。
- 記事はリポジトリ内のMarkdown/JSONから読む。
- 既存の投稿用`Blog`とは別機能にする。
- Android縦画面を第一対象とする。
- アプリ本体のリファクタリング記録を最初の記事群にする。

