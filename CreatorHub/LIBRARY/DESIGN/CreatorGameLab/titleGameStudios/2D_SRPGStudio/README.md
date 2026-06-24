# 2D_SRPGStudio

GameLab WorkSpaceで、Engineより先に作るTitleGameStudioの単体HTML scaffold。

## 目的

- 新しいゲームの見た目、画面State、素材、修正ログを先に決める。
- その後に novel / battle / collection Engineを当てる。
- Engine未接続でもHTMLで確認できるようにする。

## 開き方

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio\index.html
```

TODO確認:

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio\todo.html
```

Runtime JSON納品TODO:

```txt
C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\titleGameStudios\2D_SRPGStudio\runtime-json-todo.html
```

## 現在の範囲

- Map / Conversation / Battle / Player Statusの素材確認
- 生成済み画像のGallery
- 画面State案
- Engine連結前のTitleGameStudio方針
- TitleGameStudio package manifest
- Game情報をattachするJSON slot一覧
- 工程TODO一覧
- 完成済みEngineへ渡すRuntime JSON納品TODO

## 次

- GameLab WorkSpaceにTitleGameStudio一覧を表示する。
- `srpg_runtime_manifest_v0_1.json` を正式に読み、frame座標JSONへ拡張する。
- 各画面State別のfooter / shortcut guideを追加する。
- slotごとにschemaを固め、依存関係を満たしたJSONだけEngineへ渡す。

## Package方針

TitleGameStudioは、別リポジトリではなく、1タイトル分の作業場packageとして扱う。

```txt
2D_SRPGStudio
├─ index.html
├─ studio.js
├─ styles.css
└─ package
   ├─ title-game-studio.package.json
   ├─ slots
   │  ├─ screen-layout.slot.json
   │  ├─ asset-manifest.slot.json
   │  ├─ runtime-manifest.slot.json
   │  ├─ engine-binding.slot.json
   │  ├─ fix-log.slot.json
   │  └─ engine-order.slot.json
   └─ schemas
      └─ *.schema.json
```

`slot` は空間であり、schemaを通したJSONをattachしていく。
前回のJsonSlotStudioで弱かった依存関係は、package manifestの `dependencies` と各slotの `dependsOn` で先に見えるようにする。

## Version

- packageVersion: `0.1.0`
- latest判定: `package/title-game-studio.package.json` の `latest` と `packageVersion` を見る。
- 命名ルール: `C:\00_master\CreatorHub\LIBRARY\DESIGN\CreatorGameLab\TITLE_GAME_STUDIO_NAMING_VERSION_RULES_2026-06-22.md`
