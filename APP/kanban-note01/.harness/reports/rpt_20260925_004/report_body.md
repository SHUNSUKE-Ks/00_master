# 会話ログVIEW（バックログ風）とKeyDeckへの書き出しを追加

## 完成状態

- Note_Story Menu に「会話ログ（TL）」を追加。開くと Title／ページ／範囲を選び、会話ログをゲームのバックログ風の暗い舞台で読み書きできる。
- データは既存の「ト書きノート > 会話ログ」タブと同じ場所（`page.body` または `page.scenarioLogs[key]`）。**VIEWが変わるだけで、どちらで書いても同じ内容になる**。
- 下の人物ドックまたは `Alt+1〜9` で、その人物の新しいセリフを**いまの発言の直下**に作り、すぐ書ける状態にする。KeyDeck の Deck ボタン（ALT+番号）を押しても同じことが起きる。
- 「KeyDeckへ書き出し」で登場人物（最大9人）を `keydeck.deck_import.v1` として保存。PCのKeyDeck「Deck編集 → 取り込み」で読める。

## 変更内容

- `src/pages/PageTalkLog.tsx` / `.css`: VIEW本体。名前札＋菱形付きの飾り線、明朝体の字下げ本文、端の消える区切り線、右にスピーカー（予定）とマイク（予定、図3の戻るボタンを置き換え）。柱とト書きは別の見た目。Event・Choice などの会話以外の書式は、そのまま残る枠で表示する。
- `src/utils/talkLog.ts`: 行ごとに発言へ分け、発言ごとに後ろの改行数を持つ。**編集した発言だけ書き戻し、他は1文字も変えない**。複数行のセリフの続き行は、既存の `dialogueIndent` と同じ幅で字下げする。
- `src/utils/keydeckExport.ts`: Deck の形（ALT+番号の chord、iconRef、1〜5列）、頭文字の四角アイコン（canvas で PNG を描く）、JSON のダウンロード。
- `App.tsx`・`Header.tsx`・`types/index.ts`: ページ `talklog` の追加のみ（追記）。
- 参考スクショ2枚は `docs/ref_talklog_backlog_parts_v1.md` にパーツ辞書として書き起こした（以後は画像を開かない）。

## 検証結果

- `npx tsc -b` exit 0、`npx vite build` 成功。
- talkLog 単体テスト14件 PASS: 5種の原文（テンプレ・複合・先頭空行・閉じ忘れ・空）で読み込み→書き戻しが完全一致。編集した発言だけが変わる。直下への挿入が空行区切りになる。目安判定。
- VIEW を単体でバンドルし jsdom 上で操作、20件 PASS: 初期表示、KeyDeck と同じ `Alt+Digit2` で直下に新ブロック・フォーカス・保存形式、入力保存、目安超え警告、Backspace 削除、未登録番号（Alt+9）の知らせ、話者変更、外からの書き換えの読み直し。
- **未実施**: 実ブラウザでの目視。AGENTS.md に従い開発サーバーを起動していない。

## 成果物

- `C:\00_master\APP\kanban-note01\src\pages\PageTalkLog.tsx` / `PageTalkLog.css`
- `C:\00_master\APP\kanban-note01\src\utils\talkLog.ts` / `keydeckExport.ts`
- `C:\00_master\APP\kanban-note01\docs\ref_talklog_backlog_parts_v1.md`
- KeyDeck 側の受け口は `C:\00_master\DevApps\APP_KeyDeck01\.harness\reports\rpt_20260925_001`

## 追記（同日・利用者の実機確認を受けて）

- 利用者が開くと「アイディア帳 / 00_アイディア索引」（会話0件）が表示され、表・見出しが灰色の枠で並んで「何をする画面か分からない」状態だった。
- 直したこと:
  - 最初に開くページは、いま開いているページに会話があればそこ、無ければ**会話のある最初のページ**にした。
  - ページの選択肢に「（会話 N）」を付けた。
  - 会話以外の書式は**既定で隠し**、「会話以外 N件を表示」で出せるようにした（データは消えない）。
  - 会話の無いページでは、画面の説明と「〇〇のセリフで始める」ボタン、「会話があるページ」一覧を出すようにした。
- 検証: 利用者の状況を再現した jsdom テスト12件 PASS、既存の20件＋1件 PASS、`tsc -b` と `vite build` も通過。

## 次の行動

- 利用者が `npm run dev` で目視し、見た目の調整点を出す。
- PCで Hub を再起動 → Deck編集 → 取り込み → レイアウトに置く → ALT+番号でセリフが増えることを実機で確認する。
- 将来: 名前札の左にキャラアイコン、スピーカーとマイクの実機能。
