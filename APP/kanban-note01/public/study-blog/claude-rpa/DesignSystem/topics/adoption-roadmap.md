# adoption-roadmap: 導入順

## Phase1

基礎。

```txt
SolidJS
TailwindCSS
PixiJS
```

目的:

- App全体の画面管理
- Game描画
- Themeの基本

## Phase2

Ark UI導入。

```txt
ui_dialog
ui_tabs
ui_menu
```

目的:

- Dialog / Tabs / Menuの機能をHeadless化する
- 見た目はTailwindで自作する

## Phase3

NovelUI作成。

```txt
ui_choice
ui_inventory
ui_savecard
ui_character
```

目的:

- NovelEngine / CreatorHub / HermesKanbanで再利用できる部品棚を作る

## Phase4

ZagJS直接利用。

目的:

- 状態機械を細かく制御する
- Complex UIやゲーム内UIの状態遷移を厳密にする

## 最終結論

```txt
SolidJS + Ark UI + ZagJS + TailwindCSS + PixiJS
```

状態駆動でUIを作る思想が、ScreenStateやGambitの考え方と自然につながる。

