# CreatorGameLab Style / Layout / UI Sheet Inventory

## 目的

EngineやTitle本体に直接レイアウト設定やUI値を埋め込まず、外部Sheetとして分離する。

まず実物のサンプルを置き、後でSchema化して、選択するだけで再利用できる形にする。

## 推奨する置き場所

第一候補:

```txt
C:\00_master\CreatorGameLab\public\data-sources\{source_id}\presets
```

理由:

- Viteアプリからruntime fetchで読める。
- Engine本体を汚さない。
- Title JSONから `layoutSheetId` / `uiSheetId` で参照できる。
- Sourceごとにプリセットを差し替えられる。

現時点のサンプル:

```txt
C:\00_master\CreatorGameLab\public\data-sources\sample\presets
├─ layout-sheets
│  ├─ android_portrait_game.layout.json
│  └─ wide_landscape_game.layout.json
└─ ui-sheets
   ├─ novel_soft_dark.ui.json
   └─ bright_adventure.ui.json
```

## 名前案

### Layout Sheet

画面の領域、向き、安全領域、stage/dialogue/controlsの位置を決める。

候補名:

- `layout-sheets`
- `layout-presets`
- `screen-layouts`

推奨:

```txt
layout-sheets
```

理由:

`layoutProfile` より具体的で、JSONの中身が「使える設定シート」だと分かる。

### UI Sheet

Button、dialog、settings、background、色、radius、密度などを決める。

候補名:

- `ui-sheets`
- `theme-sheets`
- `style-sheets`

推奨:

```txt
ui-sheets
```

理由:

CSSのStyleSheetと混同しにくく、ゲーム内UI全体の設定だと分かる。

## 2枚のLayout Sheet

### Android Portrait

```txt
android_portrait_game.layout.json
```

用途:

- Android縦画面
- 片手操作
- 下部Nav
- dialogue領域を下に固定

### Wide Landscape

```txt
wide_landscape_game.layout.json
```

用途:

- PC横画面
- Android横画面
- iPad横画面
- stageとsidePanelを横に並べる

## UI Sheet

UI Sheetは、ゲームごとに差し替える。

対象:

- button
- dialog
- settings
- background treatment
- color tokens
- radius
- density

初期サンプル:

```txt
novel_soft_dark.ui.json
bright_adventure.ui.json
```

## Titleからの参照イメージ

将来のTitle JSON:

```json
{
  "titleId": "realm_of_aether",
  "layoutSheetId": "android_portrait_game",
  "uiSheetId": "novel_soft_dark"
}
```

または、より細かくする場合:

```json
{
  "layoutProfileId": "android_portrait_standard",
  "layoutSheetId": "android_portrait_game",
  "uiSheetId": "novel_soft_dark"
}
```

## Layout Profileとの関係

`layoutProfile` は選択肢の説明。

`layoutSheet` は実際に使う寸法・領域設定。

```txt
layoutProfile
  Android Portrait Standard

layoutSheet
  stage / dialogue / controls / safeArea の具体値
```

## DevLayerとの関係

DevLayerは、Engine Modelに対するTitle別の上書き。

Layout SheetとUI Sheetは、DevLayerから参照してもよい。

```json
{
  "devLayerId": "devlayer_sample",
  "layoutSheetId": "android_portrait_game",
  "uiSheetId": "novel_soft_dark"
}
```

## まだSchema化しない理由

現時点では、まず実物のJSONを見て、名前と置き場所が自然か確認する。

Schema化は次の後で行う。

1. Layout Sheet名が決まる。
2. UI Sheet名が決まる。
3. Title JSONからどう参照するか決まる。
4. DevLayerから参照するか、Titleから直接参照するか決まる。

## 次の確認ポイント

- フォルダー名は `presets/layout-sheets` と `presets/ui-sheets` でよいか。
- PC / Android / iPad横を1つの `wide_landscape_game` にまとめてよいか。
- UI Sheetは `ui-sheets` でよいか、`theme-sheets` の方が感覚に近いか。
- Titleが直接 `layoutSheetId` / `uiSheetId` を持つか、DevLayer経由にするか。
