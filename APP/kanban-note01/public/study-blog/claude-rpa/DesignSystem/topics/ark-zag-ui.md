# ark-zag-ui: Ark UI / ZagJS

## Ark UI

概念: 状態駆動UI。

役割:

```txt
Dialog
Tabs
Menu
Select
Tooltip
Popover
```

特徴:

- Headless UI
- ZagJSベース
- React / Solid / Vue / Svelte対応
- 見た目なし
- StateMachine中心

評価:

| 項目 | 評価 |
|---|---|
| 将来性 | ◎ |
| 状態駆動 | ◎ |
| ゲームUI | ◎ |
| 学習コスト | △ |

## ZagJS

概念: 状態機械。

役割:

```txt
DialogState
MenuState
SelectState
TabsState
```

NovelEngineのScreenState、GameState、Flag、Gambit、Reducerと思想が近い。

## 使い分け

最初はArk UIを使う。
必要になったらZagJSを直接使う。

```txt
Phase2: Ark UI
Phase4: ZagJS直接利用
```

