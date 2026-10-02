# tech-role-map: 各技術の役割

## SolidJS

責務: 画面管理。

```txt
App全体
ScreenState
GameState
Signal
Store
```

## PixiJS

責務: 描画。

```txt
マップ
キャラ
戦闘
エフェクト
SRPG
```

## ZagJS

責務: 状態機械。

```txt
Closed
Opening
Open
Closing
```

DialogState、MenuState、TabsState、SelectStateのように、UI内部の状態を厳密に扱う。

## Ark UI

責務: UI機能。

```txt
Dialog
Menu
Select
Tabs
Tooltip
Popover
```

見た目なしのHeadless UIとして使い、Tailwindや自作Themeで装飾する。

## TailwindCSS

責務: 見た目。

```txt
魔女風
学園風
SF風
和風
```

AI生成との相性が良く、Codexが短い差分で変更しやすい。

