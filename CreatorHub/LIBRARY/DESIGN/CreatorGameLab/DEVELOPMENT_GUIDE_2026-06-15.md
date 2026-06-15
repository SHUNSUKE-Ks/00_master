# CreatorGameLab 開発ガイド

## 目的

この資料は、`C:\00_master\CreatorGameLab` を実装する開発者が最初に読む開発ガイドです。

CreatorGameLabはゲーム制作エディタ本体ではなく、次の入口をまとめるHub / Hosting Shellとして作る。

- 制作タイトル選択
- Engine Sandbox選択
- Dev Save / Load
- Component Registry
- Workspace Placeholder

NovelGameWorkspace本体、BattleEngine本体、CollectionEngine本体、画像生成、素材発注はこの初期実装に含めない。

## 開発前に読む順番

1. `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\screenLayout\screen_specs.md`
2. `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\SCAFFOLD_LAYOUT_2026-06-15.md`
3. `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\DEVINDEX_SCHEMA_2026-06-15.md`
4. `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\IMPLEMENTATION_CHECKLIST_2026-06-15.md`
5. `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\taskticket`

## 技術スタック

SolidStateを使う。

```txt
SolidJS
Vite
TypeScript
lucide-solid
通常CSS
localStorageによる初期永続化
```

初期構築コマンド案:

```powershell
Set-Location C:\00_master
npm create vite@latest CreatorGameLab -- --template solid-ts
Set-Location C:\00_master\CreatorGameLab
npm install
npm install lucide-solid
npm run build
```

ローカルdev serverは自動起動しない。必要な場合はユーザーが手動で実行する。

```powershell
Set-Location C:\00_master\CreatorGameLab
npm run dev -- --host 127.0.0.1 --port 5185
```

## 実装の境界

### CreatorGameLabが持つもの

- AppShell
- Sidebar
- TitleSelectView
- EngineSandboxView
- DevSaveLoadView
- ComponentRegistryView
- WorkspacePlaceholderView
- `_devindex`
- Back navigation
- console prefix

### CreatorGameLabが持たないもの

- NovelGameWorkspace本体
- Dialogue音声録音/再生
- Escape Room Hotspot編集本体
- SRPG戦闘本体
- 本番AdventureEngine移植
- 素材生成、素材発注
- 旧 `100_gamecollection` の一括移植

## View State Layering

状態は次に分ける。

```ts
type AppPhase = "hub" | "workspace";
type ViewPhase = "titleSelect" | "engineSandbox" | "devSaveLoad" | "componentRegistry" | "activeWorkspace";
type ViewMode = "index" | "detail" | "preview";
type InteractionState = "idle" | "hovering" | "selecting" | "opening" | "saving" | "error";
type OverlayState = "none" | "inspector" | "quickCapture" | "confirm";
```

実装では、これらをまとめて1つの巨大な `currentState` にしない。

推奨:

```ts
const [appPhase, setAppPhase] = createSignal<AppPhase>("hub");
const [viewPhase, setViewPhase] = createSignal<ViewPhase>("titleSelect");
const [activeTarget, setActiveTarget] = createSignal<ActiveTarget>(null);
const [viewMode, setViewMode] = createSignal<ViewMode>("index");
const [interactionState, setInteractionState] = createSignal<InteractionState>("idle");
const [overlayState, setOverlayState] = createSignal<OverlayState>("none");
const [viewHistory, setViewHistory] = createSignal<LabHistoryItem[]>([]);
```

## 画面遷移

```txt
Title Select
  ├─ Open title -> Workspace Placeholder
  └─ Resume -> Workspace Placeholder

Engine Sandbox
  └─ Open Sandbox -> Workspace Placeholder

Dev Save / Load
  └─ Resume slot -> Workspace Placeholder

Component Registry
  └─ Open component -> Workspace Placeholder

Workspace Placeholder
  └─ Back -> previous Hub view
```

## Console Prefix

実装時の確認ログは必ずprefixを付ける。

```txt
CG_SHELL_NAV
CG_STATE_VIEW_PHASE
CG_STATE_ACTIVE_TARGET
CG_DEVINDEX_LOAD
CG_DEVINDEX_FALLBACK
CG_TITLE_TILE
CG_TITLE_OPEN
CG_TITLE_RESUME
CG_ENGINE_CARD
CG_ENGINE_OPEN
CG_SAVE_ROW
CG_SAVE_RESUME
CG_COMPONENT_ROW
CG_WORKSPACE_OPEN
CG_WORKSPACE_BACK
CG_WORKSPACE_FALLBACK
```

## 完了条件

- `npm run build` が通る。
- Title SelectからWorkspace Placeholderへ遷移できる。
- Engine SandboxからWorkspace Placeholderへ遷移できる。
- Dev Save / LoadからWorkspace Placeholderへ遷移できる。
- Component RegistryからWorkspace Placeholderへ遷移できる。
- Workspace PlaceholderからBackで直前画面へ戻れる。
- `_devindex` の初期データから描画している。
- componentKeyが存在しない場合にFallback表示になる。

