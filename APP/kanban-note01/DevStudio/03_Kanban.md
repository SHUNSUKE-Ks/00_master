# 03 Kanban

## APP04 DB Hub Source List Report 2026-06-29

### 完了

- 左サイドバーの個別DB表示を廃止し、`DB` 入口だけに集約
- Headerの `DB` と `Asset Tags` を専用DB Hub内の該当タブへ接続
- `Note DB / InBox Tag DB / Archive DB / Asset Tag DB / Scenario DB` をカラム付きリスト表示に統一
- 共通カラムとして `Name / Type / Relation / Status / Updated` を追加
- 各DBを今後のNotion風リスト型原本として扱える表示に変更

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

### 次アクション

- InBox本体も同じカラムリスト表示へ寄せるか判断
- Relation列を実データ編集可能にするPhaseを設計する

## APP04 Note DB Favorite / Notebook Edit Report 2026-06-29

### 完了

- Notebookに `favorite` フィールドを追加
- ノートブック一覧ヘッダーに `編集` ボタンを追加
- 編集モード中だけ `☆ / ★`、上下移動、削除を表示するようにした
- ★付きノートだけを `Global DB Hub > Note DB` に表示
- サイドバーのデータベース欄に `Note DB` 入口を追加
- Consoleテスト仕様にPhase 14を追加

### Console設計

```txt
14-1 14-2 14-3
```

接頭詞:

```txt
[APP04-NOTE-DB]
```

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

### 次アクション

- 編集モードの削除確認文言を最終調整
- Note DBに表示するメタ情報を増やすか検討する

## APP04 Global DB Hub Report 2026-06-29

### 完了

- `InBox DB` 画面を `Global DB Hub` として拡張
- `InBox / InBox Tag DB / Archive DB / Asset Tag DB / Scenario DB` のタブを追加
- 旧InBoxノート内の `tagDB` と `Archive DB` を専用DB場所からJSONプレビューできるようにした
- `Asset Tag DB` をHub内でサマリー表示し、専用編集ページへ移動できるようにした
- `Scenario DB` タブから `Title DB / Character DB / Asset Tag DB` へ移動できる入口を追加
- Consoleテスト仕様にPhase 13を追加

### Console設計

```txt
13-1
```

接頭詞:

```txt
[APP04-DB-HUB]
```

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

### 次アクション

- Hub表示で各DBタブを手動確認
- 次PhaseでDBごとの編集権限、表示専用/編集可能の境界を決める

## APP04 Gallery Overlay / Togaki Page Restore Report 2026-06-29

### 完了

- Pinterest Galleryの実画像クリックをLightboxではなく詳細Overlay表示へ変更
- Pinterest詳細は右サイド幅を奪わず、画面上に重なるOverlayとして表示するように変更
- 誤って混ぜた `会話ログ` 入力UI連携を取り消し
- `ト書きノート` 作成後は独立した `Note` ページとして開く状態へ戻した
- `Template > ト書きノート` も会話ログへ切り替えず、現在のNote本文へフォーマットを挿入する状態へ戻した
- Consoleテスト仕様にPhase 12を追加

### Console設計

```txt
12-1 12-2
```

接頭詞:

```txt
[APP04-GALLERY-PINTEREST]
```

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass
- ブラウザ表示確認: 未実施。ローカル起動済み画面でリロード後に手動確認する

### 次アクション

- `Gallery > Pinterest` で画像クリック時にOverlay詳細へ切り替わるか確認
- `+ ト書きノート` と `Template > ト書きノート` の両方が会話ログへ混ざらないか確認

## APP04 Notebook Togaki Format Report 2026-06-29

### 完了

- NotebookのTemplateに `ト書きノート` を追加
- `+ 新規ノート` の近くに `+ ト書きノート` を追加し、最初からフォーマット入りのノートを作れるようにした
- ページ一覧に `+ ト書きページ` を追加し、既存ノート内にもフォーマット入りページを追加できるようにした
- `CharacterA / CharacterB` はページ内Characterとして初期化し、その場で編集できる形にした
- Consoleテスト仕様にPhase 11を追加

### Console設計

```txt
11-1 11-2
```

接頭詞:

```txt
[APP04-NOTEBOOK-FORMAT]
```

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

### 次アクション

- Build確認後、ローカル画面で `+ ト書きノート` / `Template` の手動確認を行う
- 問題なければPWA反映確認は最後にまとめる

## APP04 Report 2026-06-28

### 完了

- APP04 Pinterest風Galleryビューをスカフォールドとして設計
- `GalleryView` に `pinterest` 表示を追加
- `GalleryPinterestGrid.tsx` を追加
- Titleプルダウンに `Instagram Grid` / `Pinterest Masonry` / `Asset Tag DB` の入口を追加
- Headerによく使う入口として `Gallery` / `Asset Tags` を配置
- `Title DB` / `Character DB` は触らない方針に修正
- Asset Tag DBは現段階では専用ページ未接続、入口ログのみ
- テスト仕様書 `09_APP04_Scaffold_Console_Test_Checklist.md` を作成
- AIがブラウザconsoleを直接読んでログ確認する手順を確立

### Console確認

対象URL:

```txt
http://127.0.0.1:5185/
```

確認済み番号:

```txt
1-1 2-1 2-2 2-3 3-1 3-2 3-3 3-4 4-1 4-2
```

Missing:

```txt
なし
```

### 関連ファイル

- `DevStudio/08_APP04_Pinterest_Gallery_Requirements_Layout.md`
- `DevStudio/09_APP04_Scaffold_Console_Test_Checklist.md`
- `src/pages/gallery/GalleryPinterestGrid.tsx`
- `src/pages/gallery/GalleryHeader.tsx`
- `src/components/Header.tsx`

### 次アクション

- APP04の一連の開発フローをスキル化する
- スキル候補名: `app-scaffold-console-test`
- 対象フロー: 要件定義 → 見た目スカフォールド → consoleログ番号設計 → テストTODO作成 → AI自動console確認 → カンバン報告
- Asset Tag DB専用ページは次Phaseで追加する
- `ノートへ使う` は長押し/詳細画面/アクションバーへ寄せる

## APP04 Local PWA Photo Report 2026-06-28

### 完了

- Firebase連携前のローカル実装として、共通Gallery保存レイヤー `src/dataBridge/localGallery.ts` を追加
- 既存の `nacc_gallery` localStorageデータを読み込み、ID未付与の古い写真にはIDを補完するようにした
- Gallery画面の画像追加を共通Gallery保存へ接続
- 右側Galleryパネルの画像追加・削除を共通Gallery保存へ接続
- Blog表紙ピッカーに `Gallery写真` セクションを追加
- Blog表紙ピッカーの端末アップロードを、表紙反映とGallery保存の両方に接続
- Consoleテスト仕様書にPhase 6 / Phase 7を追加

### Console設計

追加番号:

```txt
6-1 6-2 6-3 7-1 7-2 7-3
```

接頭詞:

```txt
[APP04-LOCAL-GALLERY]
[APP04-BLOG-COVER]
```

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass
- AIブラウザ直接操作: 環境側の安全ポリシーにより `http://127.0.0.1:5185/` 操作がブロックされたため未実施

### 次アクション

- 手動でChrome拡張 `Console Log Exporter` を使い、Filter `APP04` で `6-1`〜`7-3` を確認する
- 手動確認が取れたら、APP04の開発フローをスキル化する
- Firebaseはまだ入れず、次はIndexedDBまたはローカルAsset DBの設計に進む

## APP04 Skill化 Report 2026-06-29

### 完了

- APP04の開発フローを個人スキル `app-scaffold-console-test` として作成
- スキル配置:

```txt
C:\Users\enjoy\.codex\skills\app-scaffold-console-test
```

- 対象フローをスキル化:

```txt
要件定義 → 見た目スカフォールド → consoleログ番号設計 → テストTODO作成 → AI自動console確認 → カンバン報告
```

- チェックリスト雛形を追加:

```txt
C:\Users\enjoy\.codex\skills\app-scaffold-console-test\references\checklist-template.md
```

### 確認

- `SKILL.md`: 作成済み
- `agents/openai.yaml`: 作成済み
- `references/checklist-template.md`: 作成済み
- `quick_validate.py`: PyYAML依存不足により未実行

### 次アクション

- Asset Tag DB専用ページを次Phaseで追加する
- `ノートへ使う` は長押し / 詳細画面 / アクションバーへ寄せる
- PWA携帯調査用の手動チェックリストを作る
- クライアント確認用にログ依存ではない「写真追加 → Gallery表示 → Blog表紙」導線を整える

## APP04 PWA Mobile Client Report 2026-06-29

### 完了

- 携帯/PWA調査用TODOを追加

```txt
DevStudio/10_APP04_PWA_Mobile_Client_Test_TODO.md
```

- FirebaseなしでもBlogが残るように、BlogをlocalStorageへ保存する導線を追加
- Gallery写真追加済みデータとBlog表紙利用の調査が、リロード後も確認できるようにした
- `Note_Story` メニューに `ブログ表紙` 入口を追加
- Blog表紙更新時、Blog選択IDが未セットでも表示中の先頭Blogへ反映できるようにした

### 確認予定

- `npm run build`: pass
- PWA `generateSW`: pass
- 携帯/ブラウザで `写真追加 → Gallery表示 → Blog表紙に使う → リロード後も残る` を確認済み
- PWAホーム画面追加の表示名・アイコンを確認する
- consoleログ確認は補助扱い。今回の主目的は実機操作感とローカル保存の確認

### 次アクション

- 携帯幅でGallery HeaderとBlog表紙ピッカーの崩れを確認する
- Asset Tag DB専用ページの最小スカフォールドに進む

## APP04 Asset Tag DB Report 2026-06-29

### 完了

- Asset Tag DB専用ページ `PageAssetTags.tsx` を追加
- Headerの `Asset Tags` 入口とTitleメニューの `Asset Tag DB` を専用ページへ接続
- Sidebarのデータベース欄に `Asset Tag DB` を追加
- `Gallery / Note / NovelEngine` のマルチスコープ設計を見た目として配置
- `使用中 / 整理候補 / 非表示` の状態設計を見た目として配置
- Consoleテスト仕様にPhase 8を追加

### Console設計

```txt
8-1 8-2 8-3 8-4
```

接頭詞:

```txt
[APP04-ASSETTAGDB]
```

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

### 次アクション

- Asset Tag DBをlocalStorageまたはIndexedDBへ保存するか判断する
- Gallery詳細のタグ編集からAsset Tag DB候補を参照できるようにする
- `ノートへ使う` を長押し / 詳細画面 / アクションバーへ寄せる

## APP04 Asset Tag DB Local Save Report 2026-06-29

### 完了

- Asset Tag DBを固定配列から `src/dataBridge/assetTagDb.ts` のローカル保存レイヤーへ移行
- `note-story-asset-tag-db-v1` localStorageへ保存
- 新規Tag作成を実データ追加に変更
- 日本語ラベル、英語ラベル、Group、Description、Status、Appsを編集可能にした
- Scope Filterを実フィルターに変更
- JSONボタンでAsset Tag DBをエクスポート可能にした
- Consoleテスト仕様にPhase 9を追加

### 次アクション

- Buildを通す
- Gallery詳細のタグ編集からAsset Tag DB候補を参照する
- Pin / GalleryItemに `assetTagIds` を持たせるか検討する

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

## APP04 Gallery Use Action Report 2026-06-29

### 完了

- 曖昧だった `ノートへ使う / Note` を、一覧上では `詳細` 入口へ変更
- Gallery詳細に具体的な `Blog表紙に使う` アクションを追加
- `Blog表紙に使う` を押すと、表示中画像をBlog表紙へ反映してBlog画面へ移動する
- Blogがまだ無い場合は、新規Blogを作って表紙を設定する
- Consoleテスト仕様にPhase 10を追加

### Console設計

```txt
10-1
```

接頭詞:

```txt
[APP04-GALLERY-DETAIL]
```

### 次アクション

- Gallery詳細からAsset Tag DB候補を参照する
- `Scenario / Note本文へ貼る` は、挿入先ノート選択UIを決めてから実装する

## APP04 Pinterest Real Data Report 2026-06-29

### 完了

- Pinterest Masonryは、実画像が1枚でもある場合はサンプルPinを表示しないように変更
- Pinterest表示では、非表示の左Sidebarカテゴリ/タグフィルターを無視し、追加済み画像を優先表示するように変更
- 検索文字だけはPinterest表示でも反映する
- 絞り込み結果が0件の場合はサンプルではなく空状態を表示する
- Headerの枚数表示もPinterest用の実画像件数に合わせた

### 確認

- `npm run build`: pass
- PWA `generateSW`: pass

### 次アクション

- Boardタブを実フィルターにするか、Asset Tag DB連動にするか決める
- Gallery詳細のタグ編集からAsset Tag DB候補を参照する

## Inbox

- Decide final public app name display
- Decide whether Firebase remains in first usable version
- Decide whether old memo page stays visible during UPNOTE development
- Decide PWA icon direction

## Ready

- Add `sampleNotes.ts`
- Add local note repository
- Create `UpnoteEditor.tsx`
- Create `UpnoteList.tsx`
- Create `UpnoteSidePanel.tsx`
- Create `UpnoteRelationPanel.tsx`
- Rename visible DB01/DB02/DB03/DB10 labels gradually

## Doing

- Prepare UPNOTE state boundary
- Build DevStudio documentation

## Review

- Verify NACC sample data removal
- Verify Git remote setup
- Verify build output

## Done

- Clone NACC System into `06_AppList`
- Rename package/PWA metadata
- Empty product sample data
- Empty nutrient sample data
- Empty gallery sample data
- Empty initial blog sample data
- Add `src/features/upnote`
- Build succeeded
- Push to `SHUNSUKE-Ks/note00-gallerynotedb_vol1.1`
- APP04 scaffold console test passed on `kanban-note01` (`1-1`〜`4-2`, missingなし)

## Later

- Replace old route names
- Add keyboard shortcut map
- Add IndexedDB persistence
- Create dedicated Storybook or component preview if needed
- Submit component candidates to BrainNote Component Bank
- Turn APP04 scaffold-console-test workflow into a reusable Codex skill
