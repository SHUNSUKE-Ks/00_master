# CreatorGameLab 開発思考まとめ 2026-06-19

## 目的

この文書は、CreatorGameLabを作る中で整理した開発思考をまとめる。

アプリ内には載せない。
後続のAIや開発者が、なぜ今の設計になったかを理解するための読み物として扱う。

## 中心テーマ

CreatorGameLabは、ゲーム制作エディタ本体ではない。

制作途中の作業、プロジェクト、保存地点、Engine Sandboxへ素早く戻るためのDashboard / Hosting Shellである。

最初の画面は、説明ページではなく作業再開のための実用画面にする。

```txt
Dashboard / Resume Board
  -> Title別 Save Slots
  -> Workspace Placeholder
```

## Workspaceの扱い

Workspace本体は、この段階では作り込まない。

理由:

- NovelGameWorkspaceは別途集中して設計する必要がある。
- 初期段階でWorkspaceまで作ると、Dashboardの役割がぼやける。
- まずは「どの作業を再開するか」を管理するHubを安定させる必要がある。

このため、Workspaceはワイヤーフレームの遷移先だけにした。

```txt
Workspace Placeholder
  - Active Targetを受け取る
  - componentKeyを表示する
  - Backで戻る
  - 本体機能は作らない
```

## TitleからWorkspaceへ直接飛ばさない

Titleカードをクリックして、すぐWorkspaceへ入る導線は避ける。

Titleには複数の作業途中地点がある。
そのため、Titleを選んだら、まずTitle別のSave / Load画面に移動する。

```txt
Title Select
  -> Title別 Save Slots
  -> 作業スロットを選択
  -> Workspace Placeholder
```

この考え方により、Title単位の作業履歴、フェーズ、Step TODOを整理しやすくなる。

## Engine改造とTitle制作を分ける

作業は大きく2つに分ける。

### Engine Development

共通Engineそのものを改造・検証する作業。

対象:

- AdventureEngine
- BattleEngine
- CollectionEngine

入口:

```txt
Engine Sandbox
```

例:

- Engine APIの変更
- 状態管理の変更
- 共通DATABASE参照
- Battle / Collection / Adventureの汎用処理

### Title Content Work

完成済みEngineの上で、Title固有のコンテンツを作る作業。

入口:

```txt
Title Select
  -> Title Save Slots
```

例:

- scenario
- background
- character
- dialogue
- quest
- battle setup
- collection table

この切り分けにより、Engineそのものの開発と、Titleごとの制作作業を混ぜない。

## 3 Engine Slot構想

各Titleは、3つの共通Engineをそれぞれどのmodel/versionで積むかを持つ。

```txt
Title
  ├─ AdventureEngine: model/version
  ├─ BattleEngine: model/version
  └─ CollectionEngine: model/version
```

ここでいう `model` は妥当な呼び方。
ただしAI modelなどと混ざらないよう、実装上は `engine model` または `engine profile` と呼ぶ。

例:

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
  }
}
```

## Layout Profile構想

Title作成時には、最初に画面レイアウトも選ぶ。

特にAndroidは縦画面と横画面でUIの設計が大きく違うため、早い段階で設定として持つ。

初期候補:

- Android Portrait
- Android Landscape
- Desktop Editor

例:

```json
{
  "layoutProfileId": "android_portrait_standard"
}
```

## New Titleの予定導線

新規Title作成は、次の順で進める。

```txt
New Title
  -> Engine model/version selection
  -> Layout profile selection
  -> Title Save Slots
  -> Workspace
```

この時点では、New Title Wizard本体は未実装。
まずSchemaとサンプルデータで受け皿を作った。

## データと画面ひな型を分離する

今後データを入れると、画面が荒れやすくなる。

そのため、画面ひな型と流し込むデータを完全に分ける。

原則:

- データ追加だけなら `src/views` を触らない。
- データ追加だけなら `src/components` を触らない。
- データ追加だけなら `src/styles.css` を触らない。
- データは `public/data-sources` で差し替える。
- Schemaが変わる時だけ `src/data/schema.ts` を触る。

読み込み入口:

```txt
C:\00_master\CreatorGameLab\public\data-sources\source-manifest.json
```

Sourceフォルダー:

```txt
public\data-sources\{source_id}\devindex
```

必要なJSON:

```txt
game-title.registry.json
engine-sandbox.registry.json
layout-profile.registry.json
dev-save-slots.json
component-view.registry.json
migration-queue.registry.json
```

## 画面状態の分離

画面状態は、ひとつの `currentState` に混ぜない。

分ける:

- App Phase
- View Phase
- Active Target
- View Mode
- Interaction State
- Overlay State

これにより、Workspaceが表示されていないのにWorkspaceが点灯するような状態混線を避ける。

## 右下Workspace二重点灯から得た判断

モバイル下部NavでWorkspaceが常駐していたため、Workspace表示中でない時にも反応して見えた。

判断:

- Workspaceは通常Navに常駐させない。
- Workspace表示中だけ状態表示として出す。
- Titleカード側のWorkspaceアイコンは、直接WorkspaceではなくTitle別Save Slotsへの入口にする。

## 今後の優先順位

次にやるべきこと:

1. `TitleSetupView` を作る。
2. Engine model/version選択UIを作る。
3. Layout Profile選択UIを作る。
4. 選択結果をTitle JSONへ保存する方法を決める。
5. Save Slotの `workPhase` と `stepTodo` を画面上で見えるようにする。
6. PreviewアイコンをGame Test Playの仮画面へつなぐ。

まだやらないこと:

- NovelGameWorkspace本体の作り込み
- Game editor機能の実装
- 実Engineの深い改造
- 外部フォルダーをブラウザから直接読む実装

## 現在の結論

CreatorGameLabは、次の役割に絞る。

```txt
制作作業の入口を整理する
途中作業へ戻る
TitleごとのEngine構成を選ぶ
TitleごとのLayout Profileを選ぶ
Workspace本体へ渡すActive Targetを作る
```

この範囲に絞ることで、後続のNovelGameWorkspace、Engine改造、Title制作を混ぜずに進められる。
