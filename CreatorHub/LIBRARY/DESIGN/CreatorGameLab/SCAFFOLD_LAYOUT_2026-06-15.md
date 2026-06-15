# CreatorGameLab SCAFFOLD_LAYOUT

## 概要

このScaffoldは、CreatorGameLabをゲーム制作エディタ本体ではなく、制作対象、Engine Sandbox、作業再開地点をホストするHub / Hosting Shellとして実装するための設計分解です。

Workspace以外のHub画面は、サンプル画像のLayoutを基準に `tile-window` 調の本番寄せ画面としてScaffold化する。Workspaceはワイヤーフレームのまま遷移先だけ確保し、本体開発はしない。

実装前の正本:

- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\screenLayout\index.html`
- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\screenLayout\screen_specs.md`
- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\creator_game_lab_navigation_spec.json`

## 作成場所

```txt
C:\00_master\CreatorGameLab
```

旧実験場 `C:\202604_claude_workspace\100_gamecollection` は直接改名・削除しない。

## 初期フォルダー構成

```txt
CreatorGameLab
├─ package.json
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ src
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ styles.css
│  ├─ shell
│  │  ├─ AppShell.tsx
│  │  └─ Sidebar.tsx
│  ├─ views
│  │  ├─ TitleSelectView.tsx
│  │  ├─ EngineSandboxView.tsx
│  │  ├─ DevSaveLoadView.tsx
│  │  ├─ ComponentRegistryView.tsx
│  │  └─ WorkspacePlaceholderView.tsx
│  ├─ components
│  │  ├─ TitleTile.tsx
│  │  ├─ EngineCard.tsx
│  │  ├─ ResumeSlotRow.tsx
│  │  └─ WorkspaceToolbar.tsx
│  ├─ state
│  │  └─ labState.ts
│  └─ registry
│     └─ componentRegistry.tsx
└─ _devindex
   ├─ game-title.registry.json
   ├─ engine-sandbox.registry.json
   ├─ component-view.registry.json
   ├─ migration-queue.registry.json
   └─ dev-save-slots.json
```

## 状態レイヤー

画面状態は次に分ける。

| Layer | Type | 初期値 |
|---|---|---|
| App Phase | `hub` / `workspace` | `hub` |
| View Phase | `titleSelect` / `engineSandbox` / `devSaveLoad` / `componentRegistry` / `activeWorkspace` | `titleSelect` |
| Active Target | title / engine / save slot / component / null | `null` |
| View Mode | `index` / `detail` / `preview` | `index` |
| Interaction State | `idle` / `hovering` / `selecting` / `opening` / `saving` / `error` | `idle` |
| Overlay State | `none` / `inspector` / `quickCapture` / `confirm` | `none` |

## 初期画面

### Scaffold実装レベル

| Screen | 実装レベル | 遷移 | 機能 |
|---|---|---|---|
| Title Select | 本番寄せLayout | Workspace Placeholderへ遷移 | `console` コメント |
| Engine Sandbox | 本番寄せLayout | Workspace Placeholderへ遷移 | `console` コメント |
| Dev Save / Load | 本番寄せLayout | Workspace Placeholderへ遷移 | `console` コメント |
| Component Registry | 本番寄せLayout | detail/preview想定 | `console` コメント |
| Workspace Placeholder | ワイヤーフレーム | Back遷移のみ | 実装しない |

### Title Select

- `_devindex/game-title.registry.json` を読む。
- タイルを選択する。
- `Open` / `Resume` で `WorkspacePlaceholderView` へ遷移する。
- Console Prefix: `CG_TITLE_*`

### Engine Sandbox

- `_devindex/engine-sandbox.registry.json` を読む。
- Adventure / Battle / Collection / Isolated Testを選ぶ。
- `Open Sandbox` で `WorkspacePlaceholderView` へ遷移する。
- Console Prefix: `CG_ENGINE_*`, `CG_TEST_*`

### Dev Save / Load

- `_devindex/dev-save-slots.json` を読む。
- Resume Pointを選択する。
- `Resume` で `WorkspacePlaceholderView` へ遷移する。
- Console Prefix: `CG_SAVE_*`

### Component Registry

- `_devindex/component-view.registry.json` を読む。
- `componentKey` と移植先候補を確認する。
- 初期実装では表示確認だけに留める。
- Console Prefix: `CG_COMPONENT_*`

### Workspace Placeholder

- Active Targetを表示する。
- componentKeyの存在確認をする。
- Backで直前のHub画面へ戻る。
- Workspace内部の制作UIは実装しない。
- NovelGameWorkspace本体は後続Scaffoldで扱う。
- Console Prefix: `CG_WORKSPACE_*`

## 実装TODO

1. SolidJS + Vite + TypeScriptの最小構成を作る。
2. `_devindex` の初期JSONを作る。
3. AppShell / Sidebar / labStateを作る。
4. Title Selectを `_devindex` から描画する。
5. Engine Sandboxを `_devindex` から描画する。
6. Dev Save / Loadを `_devindex` から描画する。
7. Component Registryを `_devindex` から描画する。
8. Workspace PlaceholderとBack遷移を作る。
9. console prefixを各操作へ入れる。
10. Hub画面の未実装機能はconsole commentとして残す。
11. Workspace内部の作り込みが混ざっていないことを確認する。
12. `npm run build` で確認する。

## TaskTicket分解

初期TaskTicketは次の4件に絞る。

- `TT-CGL-20260615-001-scaffold-shell`
- `TT-CGL-20260615-002-devindex-registries`
- `TT-CGL-20260615-003-hub-views`
- `TT-CGL-20260615-004-workspace-placeholder`

詳細は `taskticket` フォルダーを参照する。
