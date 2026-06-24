# Conversation Log Draft Format v0.1

meta:
  date: 2026-06-21
  target: NovelEngine / kanban-note01
  status: adopted
  purpose: Noteで作る会話ログと、NovelEngineのscenario_oneshotへ変換する前段の下書き形式を揃える

## 方針

会話ログは、画像参考のような「縦ログで読み返せる形式」で作成する。

`scenario_oneshot.json` はEngineへ渡すための下書きJSON。
この `conversation_log` は、人間が書きやすく、Noteで扱いやすい台本形式。

## 基本形

```text
【Scene】村入口の夜
【bg】bg_village_gate_night
【tags】bgm_tension_low, fx_fog_slow, cam_slow_zoom

ミア
🔊 また魔物の足音が近づいてる…

主人公
🔊 門はもたない。けど、まだ直せる。
【tags】face_serious, se_hammer_light

ミア
🔊 戦うの？

主人公
🔊 違う。守る道具を作るんだ。

【choice】主人公は何を優先する？
- 壊れた門を補強する -> sc_002
  flags: flag_gate_repaired
  tags: ev_repair_gate, se_hammer_heavy
- ミアを偵察に向かわせる -> sc_003
  flags: flag_mia_scout
  tags: ev_mia_scout, se_footstep_fast
```

## 書き方ルール

- 話者名は単独行にする。
- セリフ行は `🔊 ` から始める。
- `🔊` は音声再生アイコン相当。実音声がなくても付けてよい。
- Scene、背景、tags、choiceは `【key】` で書く。
- セリフ単位の表情、SE、演出は直後に `【tags】` を置く。
- 1つのSceneは短くする。まず1Sceneから納品してよい。

## scenario_oneshotへの対応

```text
【Scene】 -> scenes[].title
【bg】 -> scenes[].bg
【tags】 -> scenes[].tags
話者名 + 🔊本文 -> scenes[].talk の [speaker, text]
セリフ直後の【tags】 -> talk tuple の3番目
【choice】 -> scenes[].choice
```

## 注意

- 画像生成promptは本文に混ぜない。別途 `assetPrompts` へ分ける。
- Character IDが確定している場合だけ `【characters】` を追加する。
- 未確定名は人間向けの話者名でよい。DevStudioで `char_` に変換する。

## Character指定ありの例

```text
【Scene】村入口の夜
【bg】bg_village_gate_night
【characters】
- char_blacksmith_boy face_normal left
- char_mia face_worried right
【tags】bgm_tension_low, fx_fog_slow, cam_slow_zoom

ミア
🔊 また魔物の足音が近づいてる…

主人公
🔊 門はもたない。けど、まだ直せる。
【tags】face_serious, se_hammer_light
```

## 今後の変換

DevStudio側で次を作る。

- conversation_log text -> scenario_oneshot
- scenario_oneshot -> scenario_main
- conversation_logから不足Character / Background / SE / BGM tagを抽出
