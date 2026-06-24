# TitleGameStudio Package 仕様メモ

meta:
  date: 2026-06-22
  agent: codex
  topic: TitleGameStudio package / JsonSlotStudio再設計
  status: draft
  target: CreatorGameLab WorkSpace

## 結論

TitleGameStudioは別リポジトリではなく、1タイトル分の作業場packageとして扱う。
DevStudio単体HTMLを入口にし、Gameに必要な情報をslotとして空間化し、schemaを通したJSONをattachしていく。

## packageの役割

- 初期アイディアをHTML一枚で組む。
- 画面、素材、Fix Log、Engine注文書をTitle単位でまとめる。
- CreatorGameLabのWorkSpace / Save / Loadから再開できる単位にする。
- Engineへ渡す前に依存関係を見えるようにする。

## slotの考え方

slotは「空間」。
JSONはslotにattachされるデータ。
schemaは、そのslotに入れてよいJSONの契約。

基本slot:

- identity: TitleGameStudio package本体
- screen_layout: 画面、layer、state
- asset_manifest: 画像、音、UI、object
- runtime_manifest: Engineへ渡す実行時情報
- engine_binding: novel / battle / collection Engine候補
- fix_log: 画像や画面の修正依頼
- engine_order: Engine側への注文書

## JsonSlotStudioの反省点

前回は、slot自体はあったが、依存関係を満たすJSONを揃えきれなかった。
今回はpackage manifestに `dependsOn` を持たせ、どのslotが揃うとEngineへ渡せるかを先に見えるようにする。

## 2D_SRPGStudioでの適用

Package root:

`C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio`

Entry:

`index.html`

Package manifest:

`package\title-game-studio.package.json`

Slot JSON:

`package\slots\*.slot.json`

Schema:

`package\schemas\*.schema.json`

## 次TODO

- CreatorGameLab WorkSpaceからpackage manifestを表示する。
- Save / Loadの保存対象を `studioId + packageId + activeSlotId` に拡張する。
- slotのschema検証を追加する。
- Engine側へ渡す注文書を `engine-order.slot.json` に溜める。
