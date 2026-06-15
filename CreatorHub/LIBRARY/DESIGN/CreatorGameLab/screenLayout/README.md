# CreatorGameLab screenLayout

## 目的

このフォルダーは、CreatorGameLabの実装前に画面レイアウトと遷移をHTMLで確認する場所です。

サンプル画像:

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\creator_game_lab_layout_concept_2026-06-15.png
```

Workspace以外は、このサンプル画像のLayoutを基準にします。
ただし実装では4分割画面にせず、`Sidebar + Full Page View` に分解します。

Workspaceだけは例外です。現時点ではワイヤーフレームのまま遷移先だけ確保し、NovelGameWorkspace本体の開発はしません。

## 実装範囲

- `Title Select` / `Engine Sandbox` / `Dev Save / Load` / `Component Registry` は、tile-window基調で本番デザインに近いHTML Layoutまで作る。
- 上記Hub画面は、画面遷移までScaffold対象にする。
- 機能本体は実装せず、クリック時の `console` コメントとConsole Prefixで将来接続点を残す。
- `Workspace Placeholder` は、Back遷移とActive Target表示だけを確認する。
- Workspace内部のエディタ、ゲーム制作UI、NovelGameWorkspace固有機能は後続開発へ回す。

## 使い方

ブラウザで次を開く。

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\screenLayout\index.html
```

確認する順番:

1. `00 Overview`
2. `01 Title Select`
3. `02 Engine Sandbox`
4. `03 Dev Save / Load`
5. `04 Workspace Placeholder`
6. `05 Scaffold Map`
7. `06 Dev Docs`

## Scaffold資料

Scaffold関連資料はこのHTMLから辿れるようにする。

- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\SCAFFOLD_LAYOUT_2026-06-15.md`
- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\DEVELOPMENT_GUIDE_2026-06-15.md`
- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\DEVINDEX_SCHEMA_2026-06-15.md`
- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\IMPLEMENTATION_CHECKLIST_2026-06-15.md`
- `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\taskticket`

## ルール

- 画面や遷移を変える時は、まずこのHTML layoutを更新する。
- HTML layoutが固まったら `screen_specs.md` を更新する。
- その後に `SCAFFOLD_LAYOUT` と `taskticket` を更新する。
- 実装コードへ進むのは最後にする。
