# APP04 スカフォールド Consoleテスト TODO

作成日: 2026-06-28

## 進捗サマリー

総合進捗: `0 / 55`

| Phase | 内容 | 進捗 |
| --- | --- | --- |
| Phase 0 | 準備・拡張機能 | `0 / 5` |
| Phase 1 | Header / Titleプルダウン | `0 / 3` |
| Phase 2 | Gallery Header表示切替 | `0 / 4` |
| Phase 3 | Pinterest Masonry操作 | `0 / 4` |
| Phase 4 | Asset Tag DB入口 | `0 / 2` |
| Phase 5 | ログ確認・合格条件 | `0 / 2` |
| Phase 6 | PWAローカル写真追加 | `0 / 3` |
| Phase 7 | Blog表紙への利用 | `0 / 3` |
| Phase 8 | Asset Tag DB専用ページ | `0 / 4` |
| Phase 9 | Asset Tag DBローカル保存 | `0 / 4` |
| Phase 10 | Gallery画像の利用先明確化 | `0 / 2` |
| Phase 11 | Notebookト書きフォーマット | `0 / 3` |
| Phase 12 | Pinterest詳細Overlay / ト書き独立ページ復元 | `0 / 4` |
| Phase 13 | Global DB Hub | `0 / 4` |
| Phase 14 | Note DBお気に入り / ノート編集 | `0 / 4` |
| Phase 15 | DB Hub原本リスト化 | `0 / 4` |

## 目的

APP04の見た目スカフォールドについて、画面操作ごとにコンソールログが出ているか確認する。

Chrome拡張 `Console Log Exporter` でログを取得し、チェックボックスで達成状況を管理する。

## 重要

拡張機能は `console.log / warn / error` を取得する。

そのためAPP04のスカフォールドログは `console.log` を使う。

## Expected番号

拡張のExpected欄に貼る用:

```txt
1-1 2-1 2-2 2-3 3-1 3-2 3-3 3-4 4-1 4-2 6-1 6-2 6-3 7-1 7-2 7-3 8-1 8-2 8-3 8-4 9-1 9-2 9-3 9-4 10-1 11-1 11-2 12-1 12-2 13-1 14-1 14-2 14-3
```

Filter欄に貼る用:

```txt
APP04
```

注意: 以前のDnDテスト用フィルター `[DnD` のままだと、APP04ログはすべて除外される。

## ログ接頭詞

| 接頭詞 | 対象 |
| --- | --- |
| `[APP04-GLOBAL-NAV]` | HeaderのTitleプルダウン、Gallery表示モード遷移 |
| `[APP04-GALLERY-HEADER]` | Gallery画面Header内の表示切替 |
| `[APP04-GALLERY-PINTEREST]` | Pinterest風Masonry内のBoard/Pin操作 |
| `[APP04-ASSETTAGDB-NAV]` | Asset Tag DB入口 |
| `[APP04-ASSETTAGDB]` | Asset Tag DB専用ページ内の操作 |
| `[APP04-LOCAL-GALLERY]` | PWAローカル写真追加・削除 |
| `[APP04-BLOG-COVER]` | Blog表紙へのGallery写真利用 |
| `[APP04-GALLERY-DETAIL]` | Gallery詳細から利用先へ送る操作 |
| `[APP04-NOTEBOOK-FORMAT]` | Notebookのト書きフォーマット作成・挿入 |

## トラブルシュート

- [ ] ポップアップのFilter欄が `[DnD` のままになっていないか確認する。
  - APP04テストでは `APP04` または `APP04-GALLERY` を使う。

- [ ] DevTools上に `[APP04-...]` が出ているのに拡張に出ない場合、Filter欄を空にしてRefreshする。

- [ ] Filterを空にしても出ない場合、対象ページをリロードする。
  - 拡張はページ読み込み後にconsole wrapperを注入するため。

- [ ] Expected numbersには `1-1 2-1 ...` のような番号だけを入れる。
  - Filter欄とExpected欄は別物。

## Phase 0: 準備・拡張機能

進捗: `0 / 5`

- [ ] `0-1` Chromeで `chrome://extensions/` を開く。
- [ ] `0-2` デベロッパーモードをONにする。
- [ ] `0-3` `C:\00_master\DevApps\chrome_extensions\extension_console_logger` を読み込む。
- [ ] `0-4` 対象アプリ `http://127.0.0.1:5185/` を開く。
- [ ] `0-5` 拡張を有効化した後、対象ページをリロードする。

dev serverを起動していない場合:

```powershell
cd C:\00_master\APP\kanban-note01
npm run dev -- --host 127.0.0.1 --port 5185
```

## Phase 1: Header / Titleプルダウン

進捗: `0 / 3`

- [ ] `1-1` HeaderのTitleプルダウンからGallery表示へ遷移できる。
  - 期待ログ: `[APP04-GLOBAL-NAV] 1-1 Gallery view switch scaffold`

- [ ] `1-2` Titleプルダウンに `Instagram Grid` が色付きアイコン付きで見える。
  - ログ不要。見た目確認。

- [ ] `1-3` Titleプルダウンに `Pinterest Masonry` と `Asset Tag DB` が色付きアイコン付きで見える。
  - ログ不要。見た目確認。

## Phase 2: Gallery Header表示切替

進捗: `0 / 4`

- [ ] `2-1` Gallery HeaderでInstagram Gridを選択できる。
  - 期待ログ: `[APP04-GALLERY-HEADER] 2-1 Instagram Grid selected`

- [ ] `2-2` Gallery HeaderでPinterest Masonryを選択できる。
  - 期待ログ: `[APP04-GALLERY-HEADER] 2-2 Pinterest Masonry selected`

- [ ] `2-3` Gallery HeaderでListを選択できる。
  - 期待ログ: `[APP04-GALLERY-HEADER] 2-3 List selected`

- [ ] `2-4` Pinterest Masonry表示時に左GallerySidebarが畳まれ、画像面が広くなる。
  - ログ不要。見た目確認。

## Phase 3: Pinterest Masonry操作

進捗: `0 / 4`

- [ ] `3-1` Pinterest Masonry上部のBoardタブを押せる。
  - 期待ログ: `[APP04-GALLERY-PINTEREST] 3-1 Board filter placeholder`

- [ ] `3-2` Pinterest Masonryの仮Pinを押せる。
  - 期待ログ: `[APP04-GALLERY-PINTEREST] 3-2 Open scaffold pin detail`

- [ ] `3-3` 仮Pinのホバー/フォーカス時だけ出る `詳細` 入口がログを出す。
  - 期待ログ: `[APP04-GALLERY-PINTEREST] 3-3 Open pin action detail placeholder`
  - 備考: 常時表示はしない。将来は長押し/詳細画面/アクションバーへ寄せる。

- [ ] `3-4` 仮Pinの三点メニュー入口がログを出す。
  - 期待ログ: `[APP04-GALLERY-PINTEREST] 3-4 Open pin menu placeholder`

## Phase 4: Asset Tag DB入口

進捗: `0 / 2`

- [ ] `4-1` HeaderのAsset TagsショートカットからAsset Tag DBへ遷移できる。
  - 期待ログ: `[APP04-ASSETTAGDB-NAV] 4-1 Asset Tag DB page opened`

- [ ] `4-2` Gallery Header内のTagsショートカットがログを出す。
  - 期待ログ: `[APP04-GALLERY-HEADER] 4-2 Asset Tag DB shortcut placeholder`

## Phase 5: ログ確認・合格条件

進捗: `0 / 2`

- [ ] `5-1` 拡張ポップアップで `APP04` フィルターを使い、対象ログだけ抽出できる。
- [ ] `5-2` Expected番号のうち、実施済み番号がMissingに残らない。

## Phase 6: PWAローカル写真追加

進捗: `0 / 3`

- [ ] `6-1` Gallery画面の画像追加から端末写真を追加し、Galleryに表示される。
  - 期待ログ: `[APP04-LOCAL-GALLERY] 6-1 Gallery page photo added`

- [ ] `6-2` 右側Galleryパネルから端末写真を追加し、共通Gallery保存に入る。
  - 期待ログ: `[APP04-LOCAL-GALLERY] 6-2 Side gallery photo added`

- [ ] `6-3` Gallery写真を削除すると、共通Gallery保存からも消える。
  - 期待ログ: `[APP04-LOCAL-GALLERY] 6-3 Local gallery photo deleted`

## Phase 7: Blog表紙への利用

進捗: `0 / 3`

- [ ] `7-1` Blog memo画面でカバー画像ピッカーを開くと、Gallery写真数がログに出る。
  - 期待ログ: `[APP04-BLOG-COVER] 7-1 Cover picker opened`

- [ ] `7-2` Gallery写真をBlog表紙として選択できる。
  - 期待ログ: `[APP04-BLOG-COVER] 7-2 Gallery photo selected as blog cover`

- [ ] `7-3` Blog表紙ピッカーの端末アップロードが、表紙反映とGallery保存を同時に行う。
  - 期待ログ: `[APP04-BLOG-COVER] 7-3 Uploaded cover saved to local gallery`

## Phase 8: Asset Tag DB専用ページ

進捗: `0 / 4`

- [ ] `8-1` Asset Tag DBページで `新規Tag` の仮操作ができる。
  - 期待ログ: `[APP04-ASSETTAGDB] 8-1 Create tag placeholder`

- [ ] `8-2` Asset Tag DBページでJSON出力の仮操作ができる。
  - 期待ログ: `[APP04-ASSETTAGDB] 8-2 Export schema placeholder`

- [ ] `8-3` Scope Filterで `Gallery / Note / NovelEngine` の切り替え仮操作ができる。
  - 期待ログ: `[APP04-ASSETTAGDB] 8-3 Scope filter placeholder`

- [ ] `8-4` Tag行を押して詳細表示の仮操作ができる。
  - 期待ログ: `[APP04-ASSETTAGDB] 8-4 Open asset tag detail placeholder`

## Phase 9: Asset Tag DBローカル保存

進捗: `0 / 4`

- [ ] `9-1` 新規Tagを作成するとlocalStorageへ保存される。
- [ ] `9-2` 日本語ラベル / 英語ラベル / Group / Descriptionを編集できる。
- [ ] `9-3` Scope Filterで表示対象が絞り込まれる。
- [ ] `9-4` JSONボタンでAsset Tag DBをエクスポートできる。

## Phase 10: Gallery画像の利用先明確化

進捗: `0 / 2`

- [ ] `10-1` Gallery詳細の `Blog表紙に使う` を押すと、表示中画像がBlog表紙に反映される。
  - 期待ログ: `[APP04-GALLERY-DETAIL] 10-1 Use image as blog cover`

- [ ] `10-2` 旧 `ノートへ使う / Note` の曖昧な入口が、一覧では `詳細` に寄せられている。
  - ログ不要。見た目確認。

## Phase 11: Notebookト書きフォーマット

進捗: `0 / 3`

- [ ] `11-1` `+ ト書きノート` または `+ ト書きページ` から、柱・ト・セリフのフォーマット入りページを作成できる。
  - 期待ログ: `[APP04-NOTEBOOK-FORMAT] 11-1 Add togaki formatted page`

- [ ] `11-2` 既存ページの `Template` から `ト書きノート` を挿入できる。
  - 期待ログ: `[APP04-NOTEBOOK-FORMAT] 11-2 Insert notebook format template`

- [ ] `11-3` 作成されたページ内で `CharacterA / CharacterB` をその場で編集できる。
  - ログ不要。CharacterタブまたはCharacterシートで見た目確認。

## Phase 12: Pinterest詳細Overlay / ト書き独立ページ復元

進捗: `0 / 4`

- [ ] `12-1` Pinterest Galleryの画像クリックでLightboxではなく詳細Overlayが開く。
  - 期待ログ: `[APP04-GALLERY-PINTEREST] 12-1 Open pinterest overlay detail`

- [ ] `12-2` Pinterest詳細Overlayを閉じると、GalleryのMasonry幅が戻る。
  - 期待ログ: `[APP04-GALLERY-PINTEREST] 12-2 Toggle pinterest detail overlay`

- [ ] `12-3` ト書きノート作成後、会話ログではなく独立した `Note` ページとして開く。
  - 見た目確認: `Note` タブで `# ト書きノート` のフォーマットが表示される。

- [ ] `12-4` `Template > ト書きノート` からも会話ログへ混ざらず、現在のNote本文へフォーマットを挿入できる。
  - 期待ログ: `[APP04-NOTEBOOK-FORMAT] 11-2 Insert notebook format template`

## Phase 13: Global DB Hub

進捗: `0 / 4`

- [ ] `13-1` InBox DB画面で `InBox / InBox Tag DB / Archive DB / Asset Tag DB / Scenario DB` を切り替えられる。
  - 期待ログ: `[APP04-DB-HUB] 13-1 Switch global DB hub mode`

- [ ] `13-2` 旧InBox内の `tagDB` を専用DB場所から読める。
  - 見た目確認: `InBox Tag DB` タブにJSONプレビューが表示される。

- [ ] `13-3` Asset Tag DBをHubから一覧確認し、専用編集ページへ移動できる。
  - 見た目確認: `Asset Tag DB` タブの `専用ページで編集`。

- [ ] `13-4` Scenario DBタブから `Title DB / Character DB / Asset Tag DB` へ移動できる。
  - 見た目確認。

## Phase 14: Note DBお気に入り / ノート編集

進捗: `0 / 4`

- [ ] `14-1` ノートブック一覧の編集モードで `☆ / ★` を切り替えられる。
  - 期待ログ: `[APP04-NOTE-DB] 14-1 Toggle notebook favorite`

- [ ] `14-2` 編集モードでノートブックを上下に並び替えられる。
  - 期待ログ: `[APP04-NOTE-DB] 14-2 Move notebook`

- [ ] `14-3` ノートブック一覧ヘッダーの `編集` で管理UIを出し入れできる。
  - 期待ログ: `[APP04-NOTE-DB] 14-3 Toggle notebook edit mode`

- [ ] `14-4` `Note DB` タブで★付きノートだけが表示される。
  - 見た目確認。

## Phase 15: DB Hub原本リスト化

進捗: `0 / 4`

- [ ] `15-1` 左サイドバーのデータベース欄が `DB` だけになっている。
  - 見た目確認。

- [ ] `15-2` Headerの `DB` / `Asset Tags` が専用DB Hub内の該当タブへ移動する。
  - 見た目確認。

- [ ] `15-3` `Note DB / InBox Tag DB / Archive DB / Asset Tag DB / Scenario DB` がカラム付きリストで表示される。
  - 必須カラム: `Name / Type / Relation / Status / Updated`

- [ ] `15-4` Relation列が全DBリストに表示される。
  - 見た目確認。

## 合格条件

- [ ] 画面操作でエラーログが出ない。
- [ ] TitleDBに関係するログや変更が混ざらない。
- [ ] `Copy for Codex` または `Export JSON` で結果を取得できる。

## 実装テストログ

### Run APP04-PWA-LOCAL-001

日時: 2026-06-28

対象:

```txt
http://127.0.0.1:5185/
```

目的:

- ローカルGallery保存レイヤーを追加する。
- Gallery画面、右側Galleryパネル、Blog表紙ピッカーを同じ `nacc_gallery` に接続する。
- FirebaseなしでPWA写真追加からBlog表紙利用までの導線を確認する。

実装ログ番号:

```txt
6-1 6-2 6-3 7-1 7-2 7-3
```

確認方法:

- Buildで型・構文を確認する。
- ブラウザ操作でconsoleに上記番号が出るか確認する。

結果:

- `npm run build`: pass
- AIブラウザ直接操作: 環境側の安全ポリシーにより `http://127.0.0.1:5185/` 操作がブロックされたため未実施。
- 手動確認時はChrome拡張 `Console Log Exporter` のFilterに `APP04` を入れる。

Build出力メモ:

```txt
tsc -b && vite build: pass
PWA generateSW: pass
```

## AI自動確認結果

確認日: 2026-06-28

対象:

```txt
http://127.0.0.1:5185/
```

AI側のブラウザ操作で、consoleログを直接取得して確認した。

Observed:

```txt
1-1 2-1 2-2 2-3 3-1 3-2 3-3 3-4 4-1 4-2
```

Missing:

```txt
なし
```

確認できたログ:

```txt
[APP04-GLOBAL-NAV] 1-1 Gallery view switch scaffold
[APP04-GALLERY-HEADER] 2-1 Instagram Grid selected
[APP04-GALLERY-HEADER] 2-2 Pinterest Masonry selected
[APP04-GALLERY-HEADER] 2-3 List selected
[APP04-GALLERY-HEADER] 4-2 Asset Tag DB shortcut placeholder
[APP04-GALLERY-PINTEREST] 3-1 Board filter placeholder
[APP04-GALLERY-PINTEREST] 3-2 Open scaffold pin detail
[APP04-GALLERY-PINTEREST] 3-3 Open pin action detail placeholder
[APP04-GALLERY-PINTEREST] 3-4 Open pin menu placeholder
[APP04-ASSETTAGDB-NAV] 4-1 Asset Tag DB page opened
```

メモ:

- Chrome拡張で手動確認する場合はFilter欄に `APP04` を入れる。
- AI自動確認では拡張機能の保存ログではなく、ブラウザのconsoleログを直接読む。
- `Asset Tag DB` はまだ専用ページ未接続。現段階では入口ログのみ合格。
- `Asset Tag DB` は専用ページスカフォールドを追加済み。現段階では表示と操作ログのみ。

## 今後の修正メモ

- `ノートへ使う` は全カード常時表示から外した。Gallery詳細の `Blog表紙に使う` へ具体化した。
- `Asset Tag DB` は現状入口だけ。Title DB / Character DBを触らず、次段階で専用ページを追加する。
- Pinterest風の仮Pinは、実データ接続後に削除または空状態専用表示へ移す。
