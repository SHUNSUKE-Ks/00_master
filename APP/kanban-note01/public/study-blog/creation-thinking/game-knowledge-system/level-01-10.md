# 攻略本化 / Level 01-10

## Level 01: HTML HP

最小の公開導線を作る。

```text
index.html
about.html
contact.html
```

目的は公開、配信、SNS、ストア導線である。

## Level 02: タイトル別HP

ゲームタイトルごとに、メイン、ゲームシステム、世界観、キャラクター、ギャラリーを分ける。

```text
project_witchknight/
├ page_top.html
├ page_world.html
├ page_character.html
├ page_system.html
└ page_gallery.html
```

この段階でタイトル別HPは攻略Wikiの前段階になる。

## Level 03-05: 情報JSON分離

HTMLへ直接情報を書かない。キャラクター、世界、敵、スキルなどをMasterDataに分ける。

```text
data_character.json
data_world.json
data_enemy.json
data_skill.json
```

```text
HTML / Component = View
JSON = MasterData
```

## Level 06: 攻略本をデータベース化

キャラクター情報を、ゲーム内部、HP、攻略本、図鑑、UI、バランス調整で共有する。

```json
{
  "character_id": "char_knight",
  "name": "騎士",
  "class": "Knight",
  "hp": 120,
  "skills": ["skill_slash", "skill_guard"]
}
```

## Level 07: 攻略本をComponent化

攻略本そのものを再利用できるUI部品として作る。

```text
CharacterCard
SkillTable
EnemyDrop
QuestFlow
MapPanel
```

攻略サイト、ゲーム内図鑑、タイトルHP、開発ツールで同じ部品を使う。

## Level 08: 攻略本からゲームへ逆流

```text
攻略本で編集
  -> JSON更新
    -> ゲーム更新
    -> HP更新
    -> 図鑑更新
```

情報を更新すると、各Viewへ反映されるCMS的な制作環境にする。

## Level 09: イメージボード統合

画像、パラメーター、説明、演出tag、使用Sceneをまとめる。

```text
ui_hud_battle
bg_forest_dark
char_witch_idle
```

## Level 10: GameKnowledgeSystem

```text
Playable Game
+ Browsable Database
+ Visual Encyclopedia
+ Asset Browser
+ Lore Book
```

ゲームは世界情報の一つの表示方法になる。最終目標は「作品を単発で作る」よりも、世界情報を再利用可能な形で構築すること。

## 現行スタックへの注記

元メモにはReactが含まれていたが、現在の主軸はSolidJSである。Componentの考え方は共通だが、実装はSolidJS + Viteを第一候補にする。
