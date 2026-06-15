# CreatorGameLab 画面別仕様書

## 画面構成

実装は4分割ではなく、各画面をフルページで表示します。

```txt
Sidebar + Full Page View
```

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

Sections:

| Section | Component | 役割 | Console Prefix |
|---|---|---|---|
| Toolbar | BackButton | 直前画面へ戻る | `CG_WORKSPACE_BACK` |
| Toolbar | SaveStateButton | 将来のDev Save用 | `CG_WORKSPACE_SAVE` |
| Body | WorkspacePlaceholderPanel | 後続開発予定を表示 | `CG_WORKSPACE_PLACEHOLDER` |

Action Token:

- `idle`
- `workspace_open`

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

