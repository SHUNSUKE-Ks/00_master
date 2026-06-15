# CreatorGameLab レイアウト仕様

## 目的

`CreatorGameLab` は、旧 `100_gamecollection` を再整理した実験場・制作ランチャーです。

最初に作る画面は、ゲーム制作対象を選び、Engine Sandboxを選び、途中作業を再開し、Active Workspaceから前の画面へ戻れるところまでにします。

## 保存したデザイン

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\creator_game_lab_layout_concept_2026-06-15.png
```

## 画面構成

```txt
CreatorGameLab AppShell
├─ Sidebar
│  ├─ Title Select
│  ├─ Engine Sandbox
│  ├─ Dev Save / Load
│  └─ Component Registry
│
└─ Main Surface
   ├─ TitleSelectView
   ├─ EngineSandboxView
   ├─ DevSaveLoadView
   └─ ActiveWorkspaceView
```

## 1. Title Select

ゲームタイトルをサムネイル付きギャラリーで選ぶ画面です。

表示項目:

- thumbnail
- title
- status
- engine
- progress
- lastEditedAt
- Resume button
- Open button

主な操作:

- `Open`: 選択したゲームタイトルのActive Workspaceへ移動。
- `Resume`: そのタイトルに紐づく最新Dev Save Slotから再開。

## 2. Engine Sandbox

本番に入れる前の隔離実験を選ぶ画面です。

表示する入口:

- AdventureEngine Sandbox
- BattleEngine Sandbox
- CollectionEngine Sandbox
- Isolated UI Test
- Empty Prototype Slot

主な操作:

- `Open Sandbox`: 対象SandboxのActive Workspaceへ移動。
- `Pin to Migration Queue`: 本番移植候補として記録。

## 3. Dev Save / Load

開発作業の中断・再開用画面です。

これはゲーム内セーブではなく、開発作業のセーブです。

保存するもの:

- slotId
- targetTitleId
- targetMode
- componentKey
- routeState
- memo
- updatedAt

主な操作:

- `Resume`: 保存されたcomponentKeyとrouteStateでActive Workspaceへ移動。
- `Archive`: 古いスロットを保管。

## 4. Active Workspace

選択したタイトル、Sandbox、または保存スロットを実際に開く作業画面です。

必須要素:

- Back button
- breadcrumb
- active title / sandbox name
- active component name
- save current state button
- right side inspector

戻り動作:

- `Back` は直前の一覧画面に戻る。
- 直前がなければ `Title Select` に戻る。
- Back時に `activeSelection` は保持する。

## SolidJS 状態設計

```ts
type LabView = "titleSelect" | "engineSandbox" | "devSaveLoad" | "componentRegistry" | "activeWorkspace";

type LabHistoryItem = {
  view: LabView;
  selectedId?: string;
};

type ActiveSelection = {
  kind: "game-title" | "engine-sandbox" | "dev-save-slot";
  id: string;
  componentKey: string;
  routeState?: Record<string, unknown>;
};
```

## Dynamic Component 方針

`ActiveWorkspaceView` は `componentKey` で中身を差し替えます。

最初は汎用Workspaceではなく、NovelGame制作専用のWorkspaceとして作ります。

詳細は次を参照します。

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\novel_game_workspace_modes_2026-06-15.md
```

```tsx
<Dynamic component={componentRegistry[activeSelection().componentKey]} />
```

最初に用意するcomponentKey:

- `novelTitleScreenEditor`
- `novelDialogueSceneEditor`
- `escapeRoomSceneEditor`
- `srpgEncounterSetup`
- `emptyPrototypeWorkspace`

## 画面遷移

```txt
Title Select
  ├─ Open title -> Active Workspace
  └─ Resume -> Active Workspace

Engine Sandbox
  └─ Open Sandbox -> Active Workspace

Dev Save / Load
  └─ Resume slot -> Active Workspace

Active Workspace
  └─ Back -> previous view
```

## デザイン方針

- ページを増やしすぎない。
- Sidebarは入口を4つまでに絞る。
- Active Workspace内をDynamicで差し替える。
- 実験用画面と本番移植候補を混ぜない。
- すべての機能は `_devindex` に登録する。

## 実装前チェック

- Title SelectからActive Workspaceへ移動できる。
- Engine SandboxからActive Workspaceへ移動できる。
- Dev Save / LoadからActive Workspaceへ移動できる。
- Active WorkspaceからBackで直前の画面に戻れる。
- componentKeyが存在しない場合はFallback画面を出す。
- 画面名、componentKey、移植候補は `_devindex` に保存できる。
