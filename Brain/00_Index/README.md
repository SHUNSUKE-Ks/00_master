# 00_Index

司令塔室全体の索引用フォルダーです。

## 目的

登録したアプリ、資料、module、テンプレート、context block を一覧化し、agent が必要なパスをすぐ参照できるようにします。

## 構成

- `master_index.json`  
  機械が読むための全体索引です。

- `master_index.md`  
  人間が読むための目次です。

- `dictionary.md`  
  用語、genre、分類ルールをまとめます。

## 項目の基本フィールド

- `id`
- `name`
- `genre`
- `kind`
- `updatedAt`
- `path`
- `description`

## Genre は必要か

必要です。
`genre` があると、app、template、agent、skill、hook、report、context などを横断的に絞り込めます。

