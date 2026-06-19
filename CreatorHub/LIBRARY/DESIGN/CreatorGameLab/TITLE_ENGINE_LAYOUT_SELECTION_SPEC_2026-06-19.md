# CreatorGameLab Title Engine / Layout Selection Spec

## 目的

Title作成時に、3つの共通Engineそれぞれへ搭載する `model/version` と、最初の画面Layout Profileを選ぶ。

## 用語

`model` という呼び方は妥当。
実装上は `engine model` または `engine profile` と呼ぶ。

- `engineId`: AdventureEngine / BattleEngine / CollectionEngine
- `modelId`: Engine内の振る舞いパターン
- `version`: modelのバージョン
- `layoutProfileId`: Android縦、Android横、Desktopなどの初期レイアウト設定

## Titleの搭載設定

Titleは3つのEngine Slotを持つ。

```json
{
  "engineSlots": {
    "adventure": {
      "engineId": "AdventureEngine",
      "modelId": "adventure_novel_core",
      "version": "0.1.0",
      "status": "selected"
    },
    "battle": {
      "engineId": "BattleEngine",
      "modelId": "battle_turn_core",
      "version": "0.1.0",
      "status": "candidate"
    },
    "collection": {
      "engineId": "CollectionEngine",
      "modelId": "collection_loop_core",
      "version": "0.1.0",
      "status": "candidate"
    }
  },
  "layoutProfileId": "android_portrait_standard"
}
```

## Layout Profile

初期候補:

- `android_portrait_standard`: Android縦画面
- `android_landscape_standard`: Android横画面
- `desktop_editor_standard`: PC編集画面

## 導線

```txt
New Title
  -> Engine model/version selection
  -> Layout profile selection
  -> Title Save Slots
  -> Workspace
```

## 実装メモ

- 2026-06-19時点では、Schemaとsample dataに追加済み。
- Titleカードにはlayout orientationとEngine versionの短い表示を追加した。
- New Title Wizard本体は未実装。

## 次の実装候補

1. `New Title` ボタンで `TitleSetupView` を開く。
2. 3 Engine Slotを選ぶセレクタを作る。
3. Layout Profileを選ぶセレクタを作る。
4. 選択結果を新規Title JSONとして保存するためのTaskTicketを切る。
