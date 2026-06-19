# CreatorGameLab Title Workflow / Save Load Plan

## 目的

Titleから直接Workspaceへ入らず、Title別のSave / Loadを挟んで作業を開始する。

## 作業の切り分け

### Engine Development

- 対象: AdventureEngine / BattleEngine / CollectionEngineそのもの
- 入口: Engine Sandbox
- 例: engine API、共通状態、共通DATABASE参照、描画/戦闘/収集ロジックの改造

### Title Content Work

- 対象: 完成済みEngineの上で作るタイトル固有コンテンツ
- 入口: Title Select -> Title別 Save Slots -> Workspace Placeholder
- 例: scenario、background、character、dialogue、quest、battle setup、collection table

## 導線

```txt
Title Select
  -> Title別 Save Slots
  -> 作業スロット選択
  -> Workspace Placeholder
```

TitleカードのクリックはWorkspaceへ直接飛ばさない。
Titleカードには次のアイコンを置く。

- Preview: game test play / preview用
- Workspace: Title別Save Slotsへ移動

## Save Slotに必要な情報

```json
{
  "slotId": "save_slot_realm_001",
  "targetTitleId": "realm_of_aether",
  "label": "Overworld / Verdant Plains",
  "componentKey": "novelDialogueSceneEditor",
  "workScope": "title-content",
  "workPhase": "scenario_draft",
  "stepTodo": [
    {
      "stepId": "realm_step_001",
      "label": "scene goalを確認する",
      "status": "doing"
    }
  ]
}
```

## 次の実装候補

1. Save Slotの `workPhase` と `stepTodo` をDev Save / Load画面に表示する。
2. Title別にSave Slotが0件の場合のEmpty Stateを作る。
3. PreviewアイコンをGame Test Playの仮画面へ接続する。
4. Workspace Placeholderで `stepTodo` を読めるようにする。
