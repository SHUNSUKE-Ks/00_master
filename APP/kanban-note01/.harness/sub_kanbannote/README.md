# Sub_KanbanNote 作業ログ

Sub_KanbanNote チャット（細かな修正・質問の担当）が kanban-note01 に加えた変更の記録置き場。
メインのチャット（KEYDECK HUB統合とキーボード連動）は、毎回ではなく、必要なときにここを読んで状況を合わせる。

## 置き場

```
.harness/sub_kanbannote/
  README.md            ← このファイル（きまり）
  INDEX.md             ← 1件1行の目録（新しいものを上に足す）
  OPUS_CONSULT.md      ← Sonnet で解決しきれない課題の相談リスト（あとで一括相談）
  entries/
    YYYYMMDD_HHMM_<短い英小文字slug>.md   ← 1件の作業報告
```

## いつ書くか

- ファイルを1つでも変えたら、その作業のひと区切りごとに1件（会話の途中で細かく分けなくてよい）
- 変更しなかった質問・相談だけの回は書かない
- デプロイしたら、同じ件に追記するか、デプロイだけの1件を書く

## 1件の書き方（entries/ の .md）

```markdown
# <何をしたか 1行>

- 日時: 2026-09-27 14:05
- 依頼: <利用者の依頼を1〜2行で。スクショがあれば中身を文字で>
- 変更ファイル:
  - src/v21/xxx.tsx（何を変えたか）
- 検証: <tsc / vite build / 目で見た / テストなど。やっていないことは「未実施」と書く>
- デプロイ: 未 / 済（URL・時刻）
- メインへの申し送り: <設計に関わる判断・迷った点・触らないでほしい所。無ければ「なし」>
- HarnessBoard Report: <出したときは reportId。出していなければ「なし」>
```

## INDEX.md の1行

```
- 2026-09-27 14:05 [<slug>](entries/20260927_1405_<slug>.md) — <何をしたか 1行>（デプロイ: 未/済）
```

## 守ること（kanban-note01 の約束）

- 既定は V2.1（`src/v21/`）。Vol1.1（旧画面）は凍結。直すときは V2.1 側だけ
- 開発サーバーは自動で起動しない（C:\00_master\AGENTS.md）
- git の commit / push は利用者に頼まれたときだけ
- 本番デプロイは、利用者がその回に「デプロイして」と言ったときだけ。コマンド: `npx --yes vercel --prod --yes`（作業ディレクトリ `C:\00_master\APP\kanban-note01`）。本番は https://kanban-note01.vercel.app
- 最低限の確認: `npx tsc -b` と `npx vite build` が通ること
- 人が読む文書は日本語
- 候補のHooks（`src/v21/sideNav.tsx` の `CANDIDATE_HOOKS`）・会話ログの書式（`src/utils/talkLog.ts`）・下書き/メモの保存形（`src/v21/drafts.ts`）は、メインで設計中。変えるときは「メインへの申し送り」に必ず書く
- 変更の経緯と設計: `docs/修正案_2026-09-25_テキスト化.md`、`docs/v21_情報設計_2026-09-25.md`、`.harness/reports/`

## テスト環境（開発サーバー）

- メインチャットが起動済み: http://localhost:5180 （Vite。ソースを保存すると自動で反映）
- 止まっていたら利用者に伝える（自分では起動しない。起動設定は `C:\00_master\.claude\launch.json` の `kanban-note01-dev`）
- ここで触るデータは、この PC のブラウザの保存（localStorage）と Firestore。本番のスマホとは中身が違うことがある

## Opus へ上げる基準（最低限・ゆるめ。作業しながら足していく）

次のどれかに当たったら、無理に直さず OPUS_CONSULT.md に1件書く。安全な部分だけ直したなら、何を直したかも書く。

1. 同じ問題を2回直しても直らない、または原因が分からない
2. 設計に関わる変更: 候補のHooks（sideNav.tsx の CANDIDATE_HOOKS）、会話ログの書式（talkLog.ts）、下書き・メモの保存形（drafts.ts）、データの形（Notebook などの型・localStorage/Firestore の中身）、画面の追加や行き来（nav.ts の route）
3. 新しい画面・部品を作る、または3ファイル以上にまたがる変更になる
4. データが消える・壊れる恐れがある（削除、移行、既存データの一括書き換え）
5. 利用者の依頼が2通り以上に読めて、どちらかに決めると後戻りしにくい
6. 外とつながる所: KeyDeck Hub、Firebase、デプロイ設定、PWA（service worker・manifest）
7. tsc やビルドが通らず、直すには今の動きを変える必要がある

上げなくてよいもの: 文言・色・余白・並びの微調整、原因が見えている1ファイル内の不具合、質問への回答、ログや文書の整理。
迷ったら、直す前に利用者へ「Opus 相談リストに入れますか？」と聞いてよい。
