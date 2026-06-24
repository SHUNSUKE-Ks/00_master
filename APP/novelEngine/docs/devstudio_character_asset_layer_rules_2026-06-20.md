# DevStudio Character Asset Layer Rules 2026-06-20

meta:
  date: 2026-06-20
  agent: codex
  topic: DevStudio Character DB / standing / face icon / sample image layer rules
  status: active
  target: C:\00_master\APP\novelEngine
  report_type: design

summary:
- `src\DevStudio` は、novelEngine本体にかぶせる開発確認Layerとして扱う。
- Character DB、立ち絵、顔Icon、サンプル画像は `src\data\library\dev_library.default.json` を中心に管理する。
- 元追加作業は `C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema` から引き継いだ。

source:
- original_app: C:\Users\enjoy\InBox2026\InBox0601\06_AppList\solidjs-novel-engine-01-short-schema
- working_app: C:\00_master\APP\novelEngine
- inherited_files:
  - C:\00_master\APP\novelEngine\src\DevStudio\DevStudio.jsx
  - C:\00_master\APP\novelEngine\src\DevStudio\DevStudio.css
  - C:\00_master\APP\novelEngine\src\data\library\dev_library.default.json
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\characters_safe
  - C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default\face_icons

principles:
- Engine runtimeは、最初は最小実装を維持する。
- DevStudioは、制作DB、素材確認、TaskTicket、Scenario検証を行うLayerとして使う。
- 背景や立ち絵などレイアウト確認に影響する素材はPNGで置く。
- UIパーツは調整しやすいSVGで置く。
- 新しい素材差分は、直接コードへ埋めず、まず `dev_library.default.json` に登録する。
- 将来のDevLayerは、このDBを上書きまたは合成してruntime DBを作る。

directory_rules:
- asset_pack_root: C:\00_master\APP\novelEngine\public\assets\packs\fantasy_novel_default
- backgrounds: 背景PNGを置く。
- characters: 元の立ち絵、シート、生成直後の素材を置く。
- characters_safe: DevStudioとRuntimeで安全にプレビューする立ち絵PNGを置く。
- face_icons: 会話ログ、メニュー、Character DBで使う顔Icon PNGを置く。
- ui: button、dialogue box、name plate、title logoなどのSVG UI素材を置く。

character_db_rules:
- Character DBは `dev_library.default.json` の `characters[]` で管理する。
- `characters[].id` は scenario tag の `char_*` と対応させる。
- `defaultFace` は初期表示や未指定時の顔IDとして使う。
- `assetPath` は代表立ち絵のプレビュー画像として使う。
- `standingVariants` は人間が見る差分名の一覧として残す。
- `standingAssets` は旧互換用。新規は `assetSlots.standing.items[]` を優先する。
- `faceAssets` は旧互換用。新規は `assetSlots.faceIcons.items[]` を優先する。

asset_slot_rules:
- `assetSlots.standing.default` は初期立ち絵ID。
- `assetSlots.standing.items[].id` は `standing_{character}_{variant}` 形式を推奨する。
- `assetSlots.standing.items[].variant` は `neutral`、`serious`、`worried` などの状態名。
- `assetSlots.standing.items[].path` は `/assets/...` から始まるpublic配下のパス。
- `assetSlots.faceIcons.default` は初期顔Icon ID。
- `assetSlots.faceIcons.items[].id` は `face_*` tagと対応させる。
- `assetSlots.faceIcons.items[].usage` は `conversation_log_menu` など用途を入れる。
- `costumes` と `hairstyles` は将来差分の予約枠として残す。

sample_image_rules:
- サンプル画像は、レイアウト確認に使うため最初から実ファイルを置く。
- 立ち絵の安全版は `characters_safe` に置き、Character DBの主参照にする。
- 顔Iconは `face_icons` に置き、横長カードやログで破綻しない正方形寄りの画像にする。
- 画像のパスを変えたら、必ず `npm run smoke:assets` で存在確認を行う。
- SEは未配置でも `planned` として残してよいが、SmokeではWARN扱いにする。

devstudio_layer_rules:
- `DevStudio` は `?mode=devstudio` で開く開発Layer。
- `Library` タブでCharacter DB、Location DB、AssetOrderを確認する。
- `Character DB` は立ち絵切り替え、顔Icon一覧、Costume/Hair予約枠を確認する場所。
- `Scenario` タブは `scenario_main.json` の再生可能性とtag分類を確認する場所。
- `Tickets` タブはEngine内の作業TODOの軽量Kanbanとして使う。
- `InBox` は外部報告や素材受け取りの一時メモ。正式ReportはKanban_June docsへ保存する。

runtime_notes:
- 現時点のRuntimeは、speaker名やface tagからキャラ画像を決めている。
- 次の改善では、scenario talkに `characterId`、`faceId`、`standingId` を持たせる。
- `scene.next` はschemaにあるが、現runtimeはscene配列順で進む。
- DevLayer実験では、base scenario + DevLayer = runtime scenario の合成で上記不足を吸収する。

verification:
- check: DevStudio Character DB view
  result: prepared
  note: `assetSlots` と `faceIcons` を表示できるDevStudioを引き継いだ。
- check: asset files
  result: prepared
  note: `characters_safe` と `face_icons` をAPP側へコピーした。
- check: smoke command
  command: npm run smoke:assets

next:
- `scenario_main.json` 次期schemaに `characterId` / `faceId` / `standingId` を追加する。
- DevLayerサンプルでCharacter DBとUI設定を上書きできる形を作る。
- CreatorGameLabのWorkspaceには、novelEngine DevStudioを直接編集対象ではなくLayer候補として接続する。
