# DesignSystem / SolidJS UI技術選定 利用マニュアル

## 目的

このノートブックは、RPA記事や技術Cardを作るための **デザイン編の資料棚**。
アプリ制作ではSolidUI系の部品、ゲーム制作ではSolidJS + PixiJS + Ark UI + ZagJS + Tailwindを試す。

## 読み方

まず `overview.md` で全体結論を見る。
次に `tech-role-map.md` で各技術の責務を確認する。
ゲームUIとして組む場合は `game-ui-architecture.md`、自作部品集を作る場合は `novelui-theme.md` を読む。

## 判断軸

| 判断軸 | 見ること |
|---|---|
| 状態駆動 | ScreenState / GameState / DialogStateへ自然に繋がるか |
| Headless | 見た目と機能を分離できるか |
| Theme | 魔女風、学園風、SF風などへ差し替えられるか |
| AI相性 | Codexが部品を生成・修正しやすいか |
| PWA | Android PWAで保存・同期しやすいか |
| Desktop | Tauriへ移行しやすいか |

## 最初の採用候補

```txt
SolidJS
PixiJS
TailwindCSS
Dexie
Tauri
```

次段階:

```txt
Ark UI
ZagJS
SolidUI
Park UI
Kobalte
```

