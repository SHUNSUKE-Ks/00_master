# game-ui-architecture: ゲーム制作での構成

## NovelEngine構造

```txt
NovelEngine
  ├ ScreenState
  ├ PixiJS
  ├ NovelUI
  └ Theme
```

## 役割分担

| 層 | 技術 | 役割 |
|---|---|---|
| Core | SolidJS | 画面、状態、UI接続 |
| Render | PixiJS | ゲーム描画 |
| UI | Ark UI / NovelUI | Dialog、Choice、Menu |
| StateMachine | ZagJS | UI内部状態 |
| Theme | TailwindCSS | 見た目 |

## 例: 会話選択UI

```txt
GameState
  currentScene
  currentLine
  choices

NovelUI
  ui_dialog
  ui_choice

PixiJS
  background
  character
  effect
```

## ゲーム制作で試す価値

PixiJSは描画、SolidJSはUIと状態、Ark UIはUI機能に集中できる。
Canvas内に全部詰めるより、ゲーム本体と操作UIを分けやすい。

