# 攻略本化 / 共通データ構造

## 最終構造

```text
project_game/
├ apps/
│ ├ game_client/       ゲーム本体
│ ├ web_site/          タイトル別HP
│ ├ wiki_book/         攻略本・図鑑
│ └ asset_manager/     素材管理
├ packages/
│ ├ ui_components/     CharacterCard等の再利用部品
│ ├ game_database/     キャラ、敵、スキル、アイテム
│ ├ scenario_database/ Scene、会話、選択肢
│ └ art_database/      素材の説明、tag、使用先
├ data/
│ ├ character/
│ ├ world/
│ ├ item/
│ ├ skill/
│ ├ enemy/
│ └ scenario/
├ assets/
│ ├ bg/
│ ├ char/
│ ├ ui/
│ └ bgm/
└ docs/
  ├ lore/
  ├ design/
  └ balance/
```

## 必要になる基盤

### system_masterdatabase

全データの共通定義。ID、Title relation、tag、更新日時、状態を持つ。

### schema_gameinfo

キャラクター、敵、アイテム、クエスト、用語、タグ、演出の形を定義する。

### ui_infobook

攻略本UI、図鑑UI、カードUI、比較UIを置く。ゲーム内・Web・開発用Viewの共通部品にする。

### system_assetlink

JSONの素材IDを画像、音声、UI素材へ解決する。使用Sceneや演出tagも追跡する。

## 制作順

1. 作品ごとのMasterDataとJSON Schemaを定義する。
2. CharacterCardなど攻略本View用の最小Componentを作る。
3. タイトルHPと攻略本で同じデータを読む。
4. NovelEngine / Game Clientから同じIDを参照する。
5. AssetRegistryへ素材、tag、使用先を追加する。

## 設計原則

- Viewに作品情報の正本を持たせない。
- 日本語の表示名と固定IDを分ける。
- 素材はファイルパスではなく素材IDで参照する。
- 攻略本で必要な情報は、ゲーム本体でも再利用できる形で定義する。
- 変更時はゲーム、HP、図鑑、アセット一覧への影響を確認する。
