# 2D_SRPGStudio Visual Asset Scaffold

meta:
  date: 2026-06-21
  target: C:\00_master\APP\novelEngine
  source: C:\Users\enjoy\InBox2026\InBox0601\UpNote_2026-06-21_11-18-00
  status: scaffold

## 目的

SRPGエンジン本体ではなく、見た目と画像素材の準備に集中する。

`2D_SRPGStudio` は、参照画像、画面構成、レイヤー、必要素材、生成プロンプト、採用状態を一覧化するためのDevStudio内Studioとして扱う。

## 方針

- まずHTML上で各画面の要素を作る。
- サンプル確認は一枚絵でもよい。
- 本番用は `UI / Object / Background / Character / FX` を個別画像として分離する。
- 左側ステータスはパーティ一覧ではなく、操作中Player 1人のHP / 状態 / portraitを表示する。
- 下部footer操作ガイドは後工程で各画面State別に作るため、現段階の画像素材からは外す。
- SRPGエンジン側には、画像そのものとlayer manifestを渡す。
- 参照画像はUpNote原本を触らず、アプリ内 `public/reference/srpg-upnote` にコピーして表示する。

## 画面候補

| Screen | Phase | 主な素材 |
|---|---|---|
| World Map | Map Select | world map background, mission marker, route object, player status |
| Battle Field | Tactical Action | battle background, terrain tile, player sprite, range overlay, command UI |
| Unit Roster | Player Status | player portrait, HP, state icon, stat UI |
| Equipment | Unit Customize | equipment panel, weapon/item icon, stat grid |
| Conversation | Story | dialogue background, character sprite, dialogue box, voice icon, player status |
| Battle Result | Reward | result panel, reward icon, exp bar, result FX |

## レイヤー分類

| Layer | 内容 |
|---|---|
| Background | 背景、一枚絵、戦場、ワールドマップ |
| Object | 地形タイル、道具、装備、マーカー、props |
| Character | ユニットスプライト、立ち絵、顔アイコン、ポートレート |
| UI | パネル、ボタン、footer、コマンド、ログ、ステータス |
| FX | 選択演出、光、ヒット、戦果、範囲表示 |

## 画面State案

各画面は後で `screenState` と `interactionState` を分けて作る。

| Screen | State候補 |
|---|---|
| Map | idle / marker_focus / mission_preview / route_confirm |
| Conversation | reading / log_open / auto_play / skip_confirm / choice_open |
| Battle | player_idle / move_preview / target_select / command_open / action_preview / enemy_turn |
| Unit Status | default / equipment_select / skill_select / state_detail |
| Result | reward_count / level_up / item_gain / next_confirm |

共通UIとして左側 `activePlayerStatus` を持つ。ここには `portrait`, `hp`, `stateIcons`, `activeBuffs`, `turnOrderIndex` を入れる。

## Gallery / 修正依頼ログ

`2D_SRPGStudio` は、各画面ごとにGallery形式で画像を確認する。

- Gallery section: Map / Conversation / Battle / Player Status / Battle Result
- 画像クリック: Lightboxを開く
- Lightbox操作: 左右ボタンで前後の画像へ移動
- コメント: 画像ID単位で `localStorage` に保存
- Fix Log: 画像コメントを修正依頼ログとして蓄積
- Copy Fix MD: 修正ログと現在の画像別コメントをMarkdownとしてコピー

保存キー:

```txt
devstudio_2d_srpg_fix_comments
devstudio_2d_srpg_fix_log
```

この工程は、今後の画像生成、採用、修正依頼で何度も使うため、正式には `Asset Review Workflow` または `Image Fix Request Workflow` としてSkill候補化できる。

## Runtime Manifest

SRPGエンジン側へ渡すための仮manifestを追加した。

保存先:

```txt
public/assets/srpg/srpg_runtime_manifest_v0_1.json
```

内容:

- Map / Conversation / Battle のlayer構成
- 各screenのstate候補
- background / character / ui / object の参照パス
- `player_walk_default` の仮grid: 5 columns x 4 rows
- `player_battle_action` の仮grid: 4 columns x 2 rows
- animation名とframe IDの対応

注意:

- 現段階のframe座標は、実trim前の仮grid。
- 実ゲーム投入時は、余白trim、anchor point、hitbox、effectBoxを追加する。
- Battle attack frameは剣エフェクト込みなので、後でCharacter本体とeffectを分ける可能性が高い。

## 生成プロンプト方針

共通スタイル:

```txt
tactical fantasy SRPG visual style, warm hand-painted pixel art look, HD-2D inspired isometric game screen, crisp readable UI, layered game asset production, muted parchment gold, deep navy shadows, soft bloom, dramatic but usable in-game composition, no logos, no watermark
```

Character / Object / UIの分離素材は、必要に応じてクロマキー背景で生成し、透明化を検討する。

今回生成済み:

- `public/assets/srpg/background/bg_world_map_01.png`
- `public/assets/srpg/background/bg_conversation_dock_01.png`
- `public/assets/srpg/background/bg_battle_field_forest_01.png`
- `public/assets/srpg/character/player_walk_default_alpha.png`
- `public/assets/srpg/character/player_battle_action_alpha.png`

## 次にやること

- `2D_SRPGStudio` のAsset Manifestを見ながら、最初の一枚絵サンプルを生成する。
- 採用できるスタイルが決まったら、Character sprite sheet / UI icon sheet / Backgroundを個別生成する。
- DevStudio側に受け入れ状態 `prompt_ready / generated / accepted / needs_fix` を持たせる。
