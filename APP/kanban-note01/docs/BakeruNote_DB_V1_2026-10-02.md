# Bakeru Note（V3.1）DB V1

作成日: 2026-10-02
置き場所: この端末の localStorage `bakeru-note-v31`（写真だけ IndexedDB `bakeru-note-v31-images`）
実装: `src/v31/store.ts`

## 全体

```
ノートDB (notebooks) ──< ページDB (pages)        ページ.notebookId → ノート
       │
       └── dictIds >── 辞書DB (dicts) ──< 単語 (words)   単語.dicts → 辞書（複数）
```

- **ページ**が書く単位。旧「ノート」をページと呼び替えた。
- **ノート**は本棚に並ぶ本。ページをまとめる入れ物。
- **辞書**はコピペリストの辞書（表紙は漢字1字）。ノートに紐づけると、そのノートを開いている間は左の NAV にその辞書だけが出る。
- **単語**は1つの表だけ（WordInBox）。辞書への振り分けは印（複数可）で、表を分けない。

## ページDB `pages`

| 項目 | 型 | 説明 |
|---|---|---|
| id | string | `nt_…` |
| title | string | 空でもよい（空なら本文の最初の行を名前に使う） |
| body | string | 本文。1行＝1段落、`#`〜`####` は見出し、表は1行の `::table {JSON}`、写真は `![](bnimg:ID)` |
| notebookId | string \| null | 属するノート（リレーション）。null＝どの本にも入っていない |
| pinned | boolean? | ピン留め |
| createdAt / updatedAt | ISO文字列 | |

## ノートDB `notebooks`

| 項目 | 型 | 説明 |
|---|---|---|
| id | string | `nb_…` |
| title | string | 背表紙に縦書きで出る |
| cover | string | 表紙の1字（無地の背景に出る） |
| hue | number | 本の色（色相） |
| genres | string[] | ジャンル（マルチセレクト）。候補は全部の本のジャンルを集めたもの |
| shelf | number | 本棚の何段目か（0〜3、4段） |
| order | number | 段の中の並び |
| dictIds | string[] | 紐づける辞書（リレーション） |
| createdAt / updatedAt | ISO文字列 | |

## 辞書DB `dicts`

| 項目 | 型 | 説明 |
|---|---|---|
| id | string | `bk_…`（初期の3冊は `bk_hito`・`bk_basho`・`bk_kotoba`） |
| kanji | string | 表紙の漢字1字 |
| name | string | 辞書の名前 |
| hue | number | 色 |

## 単語 `words`

| 項目 | 型 | 説明 |
|---|---|---|
| id | string | `wd_…` |
| text | string | 200字まで。同じ文字の単語は作らない（先頭へ上げる） |
| dicts | string[] | 振り分けた辞書（0個なら InBox だけ） |
| from | 'copy' \| 'mark' \| 'hand' | コピーで入った／選んで登録／手で足した |
| createdAt | ISO文字列 | |

## 画面の状態（DBではないが同じ所に保存）

`openIds`・`activeId`（2段目のタブ）、`split`・`rightIds`・`rightActive`（2カラム）、`shelf`（本棚の段）、`shelfBook`（本棚で選んだ本。null＝最近のページ）。

## 旧形式からの読み替え（load で自動）

- `notes` → `pages`（`notebookId` は null）
- `books` → `dicts`
- 単語の `books` → `dicts`
