# CreatorGameLab _devindex 仕様

## 目的

`_devindex` は、CreatorGameLabが最初に読む開発用Registryです。

DB本体ではなく、Hub画面を動かすための軽い目次として扱う。
本番DBは `C:\00_master\CreatorHub\LIBRARY\DATABASE` に置く。

## 配置

```txt
C:\00_master\CreatorGameLab\_devindex
├─ game-title.registry.json
├─ engine-sandbox.registry.json
├─ component-view.registry.json
├─ migration-queue.registry.json
└─ dev-save-slots.json
```

## game-title.registry.json

Title Selectで使う。

```json
{
  "registryId": "game_title_registry_20260615",
  "updatedAt": "2026-06-15T00:00:00+09:00",
  "titles": [
    {
      "titleId": "sample_novel_001",
      "title": "Sample Novel",
      "status": "prototype",
      "engine": "AdventureEngine",
      "progressPercent": 12,
      "thumbnailAssetId": null,
      "lastEditedAt": "2026-06-15T00:00:00+09:00",
      "componentKey": "novelDialogueSceneEditor",
      "latestSaveSlotId": "save_slot_001"
    }
  ]
}
```

## engine-sandbox.registry.json

Engine Sandboxで使う。

```json
{
  "registryId": "engine_sandbox_registry_20260615",
  "updatedAt": "2026-06-15T00:00:00+09:00",
  "sandboxes": [
    {
      "sandboxId": "sandbox_adventure_engine",
      "label": "AdventureEngine Sandbox",
      "engineId": "AdventureEngine",
      "status": "planned",
      "summary": "ノベル、会話、探索、分岐を検証する",
      "componentKey": "emptyPrototypeWorkspace",
      "targetPath": "C:/00_master/GAME/AdventureEngine"
    },
    {
      "sandboxId": "sandbox_battle_engine",
      "label": "BattleEngine Sandbox",
      "engineId": "BattleEngine",
      "status": "planned",
      "summary": "戦闘、ステータス、報酬イベントを検証する",
      "componentKey": "emptyPrototypeWorkspace",
      "targetPath": "C:/00_master/GAME/BattleEngine"
    }
  ]
}
```

## component-view.registry.json

Component Registryで使う。

```json
{
  "registryId": "component_view_registry_20260615",
  "updatedAt": "2026-06-15T00:00:00+09:00",
  "components": [
    {
      "componentKey": "novelTitleScreenEditor",
      "label": "Novel Title Screen Editor",
      "status": "placeholder",
      "targetWorkspace": "NovelGameWorkspace",
      "targetEngine": "AdventureEngine",
      "summary": "タイトル画面の背景、ロゴ、ボタン配置を編集する予定",
      "migrationStatus": "not_started"
    },
    {
      "componentKey": "emptyPrototypeWorkspace",
      "label": "Empty Prototype Workspace",
      "status": "ready",
      "targetWorkspace": "CreatorGameLab",
      "targetEngine": null,
      "summary": "未実装ComponentのFallback",
      "migrationStatus": "local"
    }
  ]
}
```

## dev-save-slots.json

Dev Save / Loadで使う。

```json
{
  "registryId": "dev_save_slots_20260615",
  "updatedAt": "2026-06-15T00:00:00+09:00",
  "slots": [
    {
      "slotId": "save_slot_001",
      "targetTitleId": "sample_novel_001",
      "label": "Dialogue scene 003 / line 12",
      "resumePoint": "dialogue_scene_003 / line 12",
      "componentKey": "novelDialogueSceneEditor",
      "routeState": {
        "sceneId": "dialogue_scene_003",
        "lineId": "line_012"
      },
      "memo": "会話ログの表示確認中",
      "updatedAt": "2026-06-15T00:00:00+09:00"
    }
  ]
}
```

## migration-queue.registry.json

旧実験場から本番Engineへ移す候補を記録する。

```json
{
  "registryId": "migration_queue_20260615",
  "updatedAt": "2026-06-15T00:00:00+09:00",
  "items": [
    {
      "migrationId": "migration_100_gamecollection_pending_scan",
      "sourcePath": "C:/202604_claude_workspace/100_gamecollection",
      "title": "100_gamecollection inventory pending scan",
      "targetEngine": "undecided",
      "status": "pending_scan",
      "componentKeys": [],
      "notes": "直接移植しない。まずComponentView、依存、素材参照を棚卸しする。"
    }
  ]
}
```

## 読み込みルール

- 読み込みに失敗したらFallbackデータを表示する。
- JSON schemaが足りない場合も画面を落とさない。
- consoleには `CG_DEVINDEX_LOAD` または `CG_DEVINDEX_FALLBACK` を出す。
- 実ファイルパスではなく、可能な限り `assetId`、`componentKey`、`engineId` を使う。

