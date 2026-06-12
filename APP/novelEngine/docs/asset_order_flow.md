# Asset Order Flow

Vol1.1 Engine は素材表示を必須にしません。

ただし `scenario_main.json` 内の `tags` と `cgHints` は残し、`dev_library.default.json` の制作DBと照合します。

## タグ分類

```txt
bg_    背景
char_  キャラクター
face_  表情
cg_    一枚絵
bgm_   BGM
se_    SE
fx_    演出
ui_    UI素材
```

## 最小フロー

```txt
scenario_main.json
↓
scenes[].tags / scenes[].talk[].tags / cgHints[].tags
↓
dev_library.default.json
↓
カテゴリごとの素材候補
↓
画像生成または素材発注
```

## 初期素材

背景と立ち絵はPNG初期素材、UIはSVGで用意します。

```txt
public/assets/packs/fantasy_novel_default/backgrounds
public/assets/packs/fantasy_novel_default/characters
public/assets/packs/fantasy_novel_default/ui
```
