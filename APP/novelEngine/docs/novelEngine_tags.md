# NovelEngine TAG一覧

Version:0.1

AIと人間が共通で使用する演出辞書。

---

# 使用方法

```json
"tags":[
  "bgm_peaceful",
  "fx_fade_in",
  "cam_zoom_slow"
]
```

複数指定可能。

実行順:

```txt
ui_
bg_
char_
face_
bgm_
se_
fx_
cam_
ev_
flag_
req_
memo_
fn_
```

---

# BGM

## bgm_

| Tag | 説明 |
|---|---|
| bgm_title | タイトル曲 |
| bgm_peaceful | 日常 |
| bgm_forest | 森 |
| bgm_tension | 緊張 |
| bgm_battle | 戦闘 |
| bgm_boss | ボス |
| bgm_sad | 悲しい |
| bgm_mystery | 謎 |
| bgm_hope | 希望 |
| bgm_end | エンディング |

---

# SE

## se_

| Tag | 説明 |
|---|---|
| se_click | ボタン |
| se_next | 次へ |
| se_open | 開く |
| se_close | 閉じる |
| se_item | アイテム |
| se_magic | 魔法 |
| se_attack | 攻撃 |
| se_damage | ダメージ |
| se_heal | 回復 |
| se_complete | 完了 |

---

# 背景

## bg_

| Tag | 説明 |
|---|---|
| bg_title | タイトル |
| bg_village | 村 |
| bg_village_night | 夜の村 |
| bg_forest | 森 |
| bg_town | 街 |
| bg_castle | 城 |
| bg_room | 部屋 |
| bg_school | 学校 |
| bg_night | 夜空 |

---

# キャラクター

## char_

| Tag | 説明 |
|---|---|
| char_hero | 主人公 |
| char_heroine | ヒロイン |
| char_knight | 騎士 |
| char_witch | 魔女 |
| char_npc | NPC |

---

# 表情

## face_

| Tag | 説明 |
|---|---|
| face_normal | 通常 |
| face_happy | 笑顔 |
| face_sad | 悲しい |
| face_angry | 怒り |
| face_surprised | 驚き |
| face_thinking | 考える |
| face_shy | 照れ |

---

# エフェクト

## fx_

| Tag | 説明 |
|---|---|
| fx_fade_in | フェードイン |
| fx_fade_out | フェードアウト |
| fx_flash | 白フラッシュ |
| fx_blackout | 暗転 |
| fx_fog_slow | 霧 |
| fx_shake_small | 小揺れ |
| fx_shake_big | 大揺れ |
| fx_bloom | 発光 |
| fx_rain | 雨 |
| fx_snow | 雪 |

---

# カメラ

## cam_

| Tag | 説明 |
|---|---|
| cam_zoom_in | ズーム |
| cam_zoom_out | 縮小 |
| cam_zoom_slow | ゆっくりズーム |
| cam_pan_left | 左移動 |
| cam_pan_right | 右移動 |
| cam_pan_up | 上移動 |
| cam_pan_down | 下移動 |

---

# UI

## ui_

| Tag | 説明 |
|---|---|
| ui_show_dialog | 会話表示 |
| ui_hide_dialog | 会話非表示 |
| ui_show_name | 名前表示 |
| ui_show_choice | 選択肢 |
| ui_show_backlog | ログ |
| ui_show_menu | メニュー |

---

# イベント

## ev_

| Tag | 説明 |
|---|---|
| ev_next_scene | 次シーン |
| ev_branch | 分岐 |
| ev_unlock | 解放 |
| ev_reward | 報酬 |
| ev_game_start | ゲーム開始 |
| ev_game_end | ゲーム終了 |

---

# フラグ

## flag_

| Tag | 説明 |
|---|---|
| flag_hero_join | 主人公加入 |
| flag_witch_join | 魔女加入 |
| flag_route_a | Aルート |
| flag_route_b | Bルート |
| flag_good_end | GoodEnd |
| flag_bad_end | BadEnd |

---

# 条件

## req_

| Tag | 説明 |
|---|---|
| req_item_key | 鍵所持 |
| req_level_5 | Lv5以上 |
| req_flag_clear | クリア済 |
| req_route_a | Aルート条件 |

---

# メモ

## memo_

| Tag | 説明 |
|---|---|
| memo_world | 世界観 |
| memo_character | 人物 |
| memo_item | アイテム |
| memo_keyword | 用語 |

---

# 関数系TAG

## fn_

| Tag | 説明 |
|---|---|
| fn_save | セーブ |
| fn_load | ロード |
| fn_auto | オート |
| fn_skip | スキップ |
| fn_backlog | バックログ |
| fn_title | タイトルへ戻る |
| fn_retry | リトライ |
| fn_home | ホームへ戻る |

---

# 将来追加候補

| Prefix | 用途 |
|---|---|
| anim_ | アニメーション |
| voice_ | ボイス |
| quest_ | クエスト |
| state_ | 状態管理 |
| battle_ | 戦闘管理 |
| card_ | 補助カード |
| achievement_ | 実績 |
| collection_ | 図鑑 |
| save_ | セーブ情報 |

---

# AIへの指示例

```txt
未来を打ち直す鍛冶屋 第1話を作成して。
使用できる演出tagは novelEngine_tags.md のみ。
納品形式は conversation_log_v0_1 または scenario_oneshot。
```
