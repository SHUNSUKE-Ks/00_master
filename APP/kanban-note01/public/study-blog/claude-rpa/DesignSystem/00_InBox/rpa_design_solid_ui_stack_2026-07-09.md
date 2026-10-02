# RPA資料候補: SolidJS UI技術選定 / デザイン編

SolidJS UI選定まとめ。
NovelEngine / CreatorHub / HermesKanban / AIHarnessを共通基盤で運用するための、UI、状態機械、描画、保存、Desktop化の技術候補。

## 現在の結論

| 領域 | 採用候補 | 役割 |
|---|---|---|
| 描画 | PixiJS | ゲーム本体、マップ、キャラ、戦闘、エフェクト |
| 状態 | SolidJS | App全体、ScreenState、GameState、Signal、Store |
| UI機能 | Ark UI | Dialog、Menu、Select、Tabs、Tooltip |
| 状態機械 | ZagJS | Closed / Opening / Open / Closing などのUI内部状態 |
| 見た目 | TailwindCSS | Theme、色、余白、レイアウト |
| 部品集 | NovelUI | 自分専用UIライブラリ |
| 保存 | Dexie | IndexedDB、PWAローカル保存 |
| Desktop | Tauri | SolidJS + RustでDesktop化 |

## NovelEngine構造

```txt
NovelEngine
  ├ ScreenState
  ├ PixiJS
  ├ NovelUI
  └ Theme
```

## NovelUI候補

```txt
ui_dialog
ui_choice
ui_savecard
ui_inventory
ui_character
ui_menu
ui_sidebar
```

内部構成:

```txt
Ark UI + Tailwind
```

Theme:

```txt
theme_darkfantasy
theme_school
theme_scifi
theme_japanese
```

## CreatorHub構造

```txt
CreatorHub
  ├ Library
  ├ Inbox
  ├ Task
  ├ Agent
  ├ Dashboard
  └ Workspace
```

UI候補:

```txt
ui_taskcard
ui_agentcard
ui_workspace
ui_librarycard
```

## 技術候補

| 技術 | 評価 | 理由 |
|---|---|---|
| Kobalte | ◎ | 安定 |
| Ark UI | ◎◎ | StateMachine / Headless UI |
| ZagJS | ◎◎ | 状態駆動 |
| SolidUI | ○ | 雛形集 |
| Hope UI | △ | 完成品寄り |
| Chakra UI | △ | React中心 |

## 導入順

```txt
Phase1:
  SolidJS
  Tailwind
  PixiJS

Phase2:
  Ark UI
  ui_dialog
  ui_tabs
  ui_menu

Phase3:
  NovelUI
  ui_choice
  ui_inventory
  ui_savecard

Phase4:
  ZagJS直接利用
```

## 最終推奨

```txt
NovelEngine
  ├ Core
  │  └ SolidJS
  ├ State
  │  └ ZagJS
  ├ UI
  │  └ Ark UI
  ├ Theme
  │  └ Tailwind
  ├ Render
  │  └ PixiJS
  ├ Storage
  │  └ Dexie
  └ Desktop
     └ Tauri
```

この構成なら、NovelEngine / CreatorHub / HermesKanban / AIHarness をほぼ共通基盤で運用できる。

