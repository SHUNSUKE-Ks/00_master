# overview: 現在の推奨構成

## 結論

```txt
描画: PixiJS
状態: SolidJS
UI機能: Ark UI
状態機械: ZagJS
見た目: TailwindCSS
部品集: NovelUI
保存: Dexie
Desktop: Tauri
```

## なぜこの構成か

NovelEngine、CreatorHub、HermesKanban、AIHarnessはいずれも「状態を見て画面を変える」設計。
そのため、見た目だけのUIライブラリより、StateMachineやHeadless UIと相性が良い。

## アプリとゲームの分担

| 領域 | 主担当 |
|---|---|
| アプリ全体 | SolidJS |
| ゲーム描画 | PixiJS |
| Dialog / Menu / Tabs | Ark UI |
| UI内部状態 | ZagJS |
| Theme | TailwindCSS |
| ローカル保存 | Dexie |
| Desktop化 | Tauri |

## 最終イメージ

```txt
NovelEngine
  ├ Core: SolidJS
  ├ Render: PixiJS
  ├ UI: Ark UI / NovelUI
  ├ StateMachine: ZagJS
  ├ Theme: TailwindCSS
  ├ Storage: Dexie
  └ Desktop: Tauri
```

