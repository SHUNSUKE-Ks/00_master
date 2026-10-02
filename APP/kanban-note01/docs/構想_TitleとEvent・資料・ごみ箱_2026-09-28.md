# 構想: Title と Event、Title の資料、ごみ箱（2026-09-28）

## 利用者の依頼（要約）
- 見出しの Title の隣に **Event** を足す。前の Title 一覧の並べ方（サムネ＋名前＋Dict＋下書き）は Event に使い、Title タグ・Character タグを付ける
- 届いた納品は Event に入れない。Event のカードは増えたら下へ列が増える
- 「新しいメモ」は、どの Title にも属さないメモも作れる
- 新しい Title 画面: 届いた作品の欄は今の形のまま。Title は **Title＋サムネ＋Dict** にし、下に **三角の開閉リスト**。開閉の演出は UI カタログを参照
- Title・Event を消せるようにする。ふだんは場所を取らない（iPad の「選択」→ 削除のように）

## 決めたこと（利用者の回答）
| 問い | 決定 |
|---|---|
| 今ある作品は Title か Event か | **Title のまま**。Event はこれから新しく作る（データは動かさない） |
| Event を開いた中身 | **今の作品ページと同じ**（場面・登場人物・下書き・プロット）。会話ログでも Event を選んで書ける |
| Title の開閉リストの中身 | **その Title の Event**、登場人物・Scene・WW（アイテム・武器・スキル・用語）など、物語を組み立てるのに必ず要る資料を Title からまとめて見る |
| 消し方 | **ごみ箱へ**（戻せる。ごみ箱の中で完全に消す） |

## データの形
`Notebook` に次を足した（無い物は今までどおり Title）。
```ts
kind?: 'title' | 'event'     // 無し＝Title
titleIds?: string[]          // Event の Title タグ
characterRefs?: string[]     // Event の Character タグ "<TitleのID>:<枠ID>"
trashedAt?: string           // ごみ箱に入れた時刻（ある＝ごみ箱）
```
- 一覧の判定: `isTitleNotebook`（Title・ごみ箱以外）、`isEventNotebook`、`isStoryNotebook`（Title＋Event。会話ログ・ホーム・執筆デスクの候補・発注リスト）、`isTrashedNotebook`
- ギャラリーの「作品」は Title だけ（増えすぎないように）
- Title を外すと、その Title の Character タグも外す

## 画面
- **イベント**（新）: カード（サムネ・名前・Dict・Title タグ・Character タグ・場面数など・✎ 下書き）。検索は名前・Dict・人物、Title で絞る。「＋ 新しいイベント」はダイアログで名前・Dict・Title を聞く
- **タイトル**（作り直し）: 行（サムネ・名前・Dict）＋「▶ 資料」。資料 = Event（＋ イベント）／登場人物／Scene／アイテム／武器／スキル／用語。開いた状態は端末ごとに覚える。下に届いた納品
- **選択とごみ箱**: 見出しの小さな「選択」→ 押して選ぶ → 下の帯「ごみ箱へ」。ごみ箱に物があるときだけ見出しに「ごみ箱 n」。中で 戻す／完全に消す（クラウドからも消える）
- Title の行には ✎ 下書き を置かない（利用者の指定: Title はサムネ＋名前＋Dict）。Title の下書きは作品ページの「下書き」タブから

## 開閉の演出（UI カタログ）
`C:\00_CreatorHub\projects\DESIGN01_DesignLab\experiments\ui-catalog\patterns\expand-term-inline` に合わせた。
- 高さを `grid-template-rows: 0fr → 1fr`（.25s）で開く。開いた分だけ下が押し下がる
- `aria-expanded` と `aria-controls`、閉じている間は `inert`（Tab で中に入らない）
- 動きを減らす設定では動きを止める（開閉の結果は残る）
- 三角（▶）は開くと90度回る
- 本番に出したら、カタログの決まりどおり `expand-term-inline/meta.json` の `usedIn` に1行足す

## 今後（まだ作らない）
- **Library**: Title ごとに、Library（素材・人物・用語の共通の置き場）から要る物だけ足して使う
- **Template**: 新しい Title を、default の世界観 Template から選んで始める
- Event の登場人物（会話の話者の9枠）と Character タグを結ぶ（タグを付けたら空き枠に入れる、など）
- Title の資料に、アイテムリスト・スキルリストの詳しい表（MasterDB）をつなぐ

## UI カタログへの導線の確認（利用者の依頼）
結論: **カタログの中の案内は良いが、外からたどり着く道が弱い**。

| 見た所 | 結果 |
|---|---|
| カタログの README | 良い。AI の読む順（catalog.md → pattern.html → check.mjs）、`npm run cite`、使ったら usedIn に記録、が書いてある |
| DesignLab の AI_Memory | 良い。01_現在地・04_ファイル地図にカタログが載っている |
| `C:\00_master\AGENTS.md`・Claude のメモ | **無かった**。kanban-note01 から探す手がかりがゼロ（メモは今回足した） |
| `C:\00_CreatorHub\INDEX.md` | DESIGN01_DesignLab の行はあるが、説明が「—」。UI カタログがあると分からない |
| 呼び名 | 利用者は「CC の UI カタログ」と呼んだが、実体は CreatorHub。CreatorCompass には無い。正式名は「UI部品カタログ」で、「UIカタログ」で探すと電本屋の文書が先に当たる |
| 紛らわしい物 | `C:\00_master\HarnessEngineering\missions\VWF01_...\ui_catalog.html`（2026-07、別物） |
| 部品 | 「三角の開閉リスト」そのものの部品は無い。いちばん近い expand-term-inline の仕組みを使った |

提案:
1. `C:\00_master\AGENTS.md` に1行: 「UI の演出・部品は、まず UI部品カタログ（`C:/00_CreatorHub/projects/DESIGN01_DesignLab/experiments/ui-catalog/catalog.md`）を見る。読む順は同じフォルダーの README」
2. `C:\00_CreatorHub\INDEX.md` の DESIGN01_DesignLab の説明に「UI部品カタログ（experiments/ui-catalog）」
3. 今回の「三角の開閉リスト（資料）」をカタログの新しい部品（expand-disclosure-list など）にし、check.mjs で3条件を通す
