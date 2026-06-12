# DevLibrary Flow

`scenario_main.json` は脚本、`dev_library.default.json` は制作DBとして扱います。

## 役割

```txt
scenario_main.json
  title / scenes / talk / tags / cgHints

dev_library.default.json
  characters / locations / assetOrder / layoutPresets / assetPacks
```

## 参照の考え方

脚本内の `tags` は、Library側のDBを引くためのキーです。

```txt
char_knight -> characters[].id
bg_forest_entrance -> locations[].id
asset_char_knight_sheet_png -> assetOrder.SCENE.KNIGHT_STANDING.id
```

## 初期素材方針

背景や立ち絵は、まずPNG初期素材で作ります。UIパーツは調整しやすいSVGで作ります。

```txt
1. Libraryに必要素材を登録
2. PC横画面のlayoutPresetに合わせる
3. 背景・立ち絵はPNG初期素材を置く
4. UIはSVGで作る
5. 最終PNGや音声が届いたらfileName/pathを差し替える
```

## 初期パック

```txt
public/assets/packs/fantasy_novel_default
  backgrounds/
  characters/
  ui/

public/assets/sound/bgm/Unnamed Memory
```

## DevStudioでの編集

DevStudioの `Library` タブでは、Default Libraryを読み込みます。

`Editable JSON` の変更はブラウザのlocalStorageに保存します。ソースファイルそのものを更新する場合は、Codexに反映を依頼してください。
