# CreatorGameLab 画面別仕様書

## 画面構成

実装は4分割ではなく、各画面をフルページで表示します。

```txt
Sidebar + Full Page View
```

Workspace以外のHub画面は、サンプル画像の方向性を基準に `tile-window` 調の本番寄せLayoutで作ります。
Workspaceだけはワイヤーフレームのまま遷移先を確保し、本体機能は実装しません。

## 実装レベル

| Screen | Layout Level | Transition | Function |
|---|---|---|---|
| TitleSelect | production-like tile-window | Workspace Placeholderへ遷移 | console commentのみ |
| EngineSandbox | production-like tile-window | Workspace Placeholderへ遷移 | console commentのみ |
| DevSaveLoad | production-like tile-window | Workspace Placeholderへ遷移 | console commentのみ |
| ComponentRegistry | production-like tile-window | detail/preview想定まで | console commentのみ |
| WorkspacePlaceholder | wireframe | Back遷移のみ | 開発しない |

## Screen: TitleSelect

目的:

- 制作するゲームタイトルを選ぶ。
- 選択中のタイトルを視覚的に浮かび上がらせる。
- `Open` または `Resume` でWorkspace Placeholderへ遷移する。

Sections:

| Section | Component | 役割 | Console Prefix |
|---|---|---|---|
| Header | TitleSelectHeader | 画面タイトルとNew Title | `CG_TITLE_HEADER` |
| Gallery | TitleTileGrid | タイトルカード一覧 | `CG_TITLE_GRID` |
| Gallery | TitleTile | hover/selected/focus対象 | `CG_TITLE_TILE` |
| Actions | TitleOpenButton | Workspaceへ開く | `CG_TITLE_OPEN` |
| Actions | TitleResumeButton | 最新Save Slotから再開 | `CG_TITLE_RESUME` |

Action Token:

- `idle`
- `title_selected`
- `title_tile_focused`

## Screen: EngineSandbox

目的:

- Engine単位で機能を隔離検証する。
- ゲームタイトルに組み込む前の安全な試験室にする。

Sections:

| Section | Component | 役割 | Console Prefix |
|---|---|---|---|
| Header | EngineSandboxHeader | 画面タイトル | `CG_ENGINE_HEADER` |
| Core Engines | EngineCard | Adventure/Battle/Collection表示 | `CG_ENGINE_CARD` |
| Core Engines | OpenSandboxButton | Sandbox起動 | `CG_ENGINE_OPEN` |
| Isolated Tests | TestEnvironmentRow | Empty/Performance/Network/UI | `CG_TEST_ROW` |

Action Token:

- `idle`
- `engine_selected`
- `test_environment_selected`

## Screen: DevSaveLoad

目的:

- 中断した作業をResume Pointから再開する。
- 複数タイトルをまたいで作業状態を保存する。

Sections:

| Section | Component | 役割 | Console Prefix |
|---|---|---|---|
| Header | DevSaveHeader | 画面タイトルとNew Save | `CG_SAVE_HEADER` |
| Save Slots | ResumeSlotTable | 保存スロット一覧 | `CG_SAVE_TABLE` |
| Save Slots | ResumeSlotRow | 1スロット表示 | `CG_SAVE_ROW` |
| Actions | ResumeButton | Workspaceへ復帰 | `CG_SAVE_RESUME` |

Action Token:

- `idle`
- `save_slot_selected`

## Screen: WorkspacePlaceholder

目的:

- 後続のNovelGameWorkspace開発までの仮入口。
- Back遷移を確認する。
- Active Targetを受け取れることだけ確認する。
- Workspace内部の制作機能は、このScaffoldでは実装しない。

Sections:

| Section | Component | 役割 | Console Prefix |
|---|---|---|---|
| Toolbar | BackButton | 直前画面へ戻る | `CG_WORKSPACE_BACK` |
| Toolbar | SaveStateButton | 将来のDev Save用 | `CG_WORKSPACE_SAVE` |
| Body | WorkspacePlaceholderPanel | 後続開発予定を表示 | `CG_WORKSPACE_PLACEHOLDER` |

Action Token:

- `idle`
- `workspace_open`

## View State Layering

CreatorGameLabでは、画面内の現在状態をひとつの `currentState` に混ぜない。

```ts
type AppPhase = "hub" | "workspace";
type ViewPhase = "titleSelect" | "engineSandbox" | "devSaveLoad" | "componentRegistry" | "activeWorkspace";
type ViewMode = "index" | "detail" | "preview";
type InteractionState = "idle" | "hovering" | "selecting" | "opening" | "saving" | "error";
type OverlayState = "none" | "inspector" | "quickCapture" | "confirm";
```

| Layer | 初期値 | 役割 |
|---|---|---|
| App Phase | `hub` | Hub表示中かWorkspace表示中か |
| View Phase | `titleSelect` | Sidebarで選択中の画面 |
| Active Target | `null` | 選択中のtitle / engine / save slot / component |
| View Mode | `index` | 一覧、詳細、プレビューの表示状態 |
| Interaction State | `idle` | hover、選択、保存中、エラーなどの一時状態 |
| Overlay State | `none` | inspector、Quick Capture、確認Dialogなど |

初期実装では、次のStateを持つ。

```ts
type ActiveTarget =
  | { kind: "game-title"; id: string; componentKey: string }
  | { kind: "engine-sandbox"; id: string; componentKey: string }
  | { kind: "dev-save-slot"; id: string; componentKey: string; routeState?: Record<string, unknown> }
  | { kind: "component-view"; id: string; componentKey: string }
  | null;
```

Backは `viewHistory` を使い、`activeWorkspace` から直前のHub画面へ戻す。
直前がない場合は `titleSelect` へ戻す。

## TaskTicket化の考え方

この仕様書の `Screen / Section / Component / Console Prefix` が、後でTaskTicketへ変換されます。

例:

```txt
Screen: TitleSelect
Section: Gallery
Component: TitleTile
Console Prefix: CG_TITLE_TILE
Ticket: TT-20260615-001-title-tile-interaction
```
