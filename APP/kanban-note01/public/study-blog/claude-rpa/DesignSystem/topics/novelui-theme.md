# novelui-theme: NovelUIとTheme分離

## NovelUI

NovelUIは自分専用のUIライブラリ。
機能は同じで、見た目だけThemeで変える。

```txt
ui_dialog
ui_choice
ui_savecard
ui_inventory
ui_character
ui_menu
ui_sidebar
```

## 内部構成

```txt
Ark UI + TailwindCSS
```

Ark UIで機能を持ち、Tailwindで見た目を作る。

## Theme

```txt
theme_darkfantasy
theme_school
theme_scifi
theme_japanese
```

## 重要

```txt
機能は同じ
見た目だけ変更
```

この分離ができると、NovelEngine、CreatorHub、HermesKanbanで同じUI機能を使い回せる。

## CreatorHub UI候補

```txt
ui_taskcard
ui_agentcard
ui_workspace
ui_librarycard
```

