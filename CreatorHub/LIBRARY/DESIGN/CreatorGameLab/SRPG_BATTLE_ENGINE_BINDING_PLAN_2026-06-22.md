# 2D_SRPG_BattleEngine_Ver1.1 接続計画

meta:
  date: 2026-06-22
  agent: codex
  topic: 2D_SRPGStudio と BattleEngine Model の接続
  status: draft
  target: CreatorGameLab / 2D_SRPGStudio / blenderTest06

## 目的

GameLab WorkSpaceでは、ゲームEngineより先にTitleGameStudioを作成し、その後にAdventure / Battle / Collection Engineを当てる。
本資料では、SRPG用BattleEngine候補として `2D_SRPG_BattleEngine_Ver1.1` を登録し、2D素材を使う接続方針を決める。

## Engine Model

- 表示名: `2D_SRPG_BattleEngine_Ver1.1`
- modelId: `battle_2d_srpg_ver_1_1`
- 原本パス: `C:\Users\enjoy\InBox2026\InBox0601\blenderTest06`
- 登録先: `C:\00_master\CreatorGameLab\public\data-sources\sample\devindex\engine-sandbox.registry.json`
- 種別: BattleEngine Model candidate
- 実体: Three.js / GLB / SRPG grid / Gambit AI / turn log を持つ3D基盤

## 原本保護

現時点では `blenderTest06` の実フォルダー名は変更しない。
GameLab側の登録名だけを `2D_SRPG_BattleEngine_Ver1.1` にする。

理由:

- 既存の `index.html`、`serve.js`、GLB参照、docs参照が壊れる可能性がある。
- 先にEngine Modelとして登録し、接続仕様が固まってからクローンまたは正式移管する方が安全。
- 原状復帰しやすい。

## 2D素材の扱い

2D_SRPGStudioで作成した素材を、BattleEngineの描画layerまたはbillboardとして使う。

素材元:

- `C:\00_master\APP\novelEngine\public\assets\srpg\srpg_runtime_manifest_v0_1.json`
- `C:\00_master\APP\novelEngine\public\assets\srpg\background`
- `C:\00_master\APP\novelEngine\public\assets\srpg\character`
- `C:\00_master\APP\novelEngine\public\assets\srpg\ui`
- `C:\00_master\APP\novelEngine\public\assets\srpg\object`

想定layer:

- Map: 背景または地形プレビュー
- Character: 歩行default sprite / Battle sprite
- Object: marker / cursor / target indicator
- UI: 操作中PlayerのHP、状態、行動候補
- Conversation: 会話画面に使う背景・立ち絵

## 接続方針

1. `2D_SRPGStudio` で画面、素材、Fix Log、Runtime Manifestを決める。
2. `CreatorGameLab` のTitleGameStudio一覧から `2D_SRPGStudio` を選ぶ。
3. Engine Bindingで BattleEngine に `2D_SRPG_BattleEngine_Ver1.1` を候補として表示する。
4. Adapterで `srpg_runtime_manifest_v0_1.json` を読み、BattleEngine側のscene loaderへ渡す。
5. 最初の検証では、ゲーム全体の完成よりも「2D素材がBattle画面に載る」ことをAcceptanceにする。

## View State Layering

- App Phase: `studio_design` -> `engine_binding` -> `battle_runtime_preview`
- View Phase: `gallery` -> `runtime_manifest` -> `battle_engine_preview`
- Active Target: `title_studio` / `engine_model` / `asset_layer` / `battle_scene`
- View Mode: `gallery` / `manifest` / `engine_binding` / `runtime_preview`
- Interaction State: `idle` / `binding_engine` / `previewing_asset_layer` / `testing_battle_scene`
- Overlay State: `none` / `engine_slot_picker` / `asset_lightbox` / `runtime_error`

## Acceptance

- GameLabのEngine registryに `2D_SRPG_BattleEngine_Ver1.1` が表示候補として登録されている。
- `2D_SRPGStudio` のBattle bindingが `battle_2d_srpg_ver_1_1` を参照する。
- `blenderTest06` は原本として参照され、実フォルダー名は変更しない。
- 2D素材のRuntime ManifestからBattleEngineへ渡す対象が明文化されている。

## 次TODO

- `blenderTest06` の起動確認と画面状態のスクリーン確認。
- BattleEngine側のasset adapter設計。
- `srpg_runtime_manifest_v0_1.json` をBattleEngineが読める形へ変換する小さなadapterを作る。
- 2D spriteをThree.js scene上でbillboard表示する最小検証。
- Engine Modelを `planned` から `ready` に上げる条件を決める。

## links

- `C:\Users\enjoy\InBox2026\InBox0601\blenderTest06`
- `C:\Users\enjoy\InBox2026\InBox0601\blenderTest06\docs\schema-v0.md`
- `C:\Users\enjoy\InBox2026\InBox0601\blenderTest06\docs\map-schema.md`
- `C:\Users\enjoy\InBox2026\InBox0601\blenderTest06\docs\AI_Studio\TODO.md`
- `C:\00_master\APP\novelEngine\public\assets\srpg\srpg_runtime_manifest_v0_1.json`
- `C:\00_master\CreatorGameLab\public\data-sources\sample\devindex\engine-sandbox.registry.json`
- `C:\00_master\CreatorGameLab\public\data-sources\sample\devindex\title-game-studio.registry.json`
