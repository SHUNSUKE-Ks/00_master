# OneShot / Scene・部位Prompt辞書 / 目的メモ

> 状態: 保留設計。
>
> 注意: この資料の元チャットには具体的なPrompt語彙やKingsAIの実装内容はない。ここでは、後で語彙を集めるための目的と構造だけを保存する。

## 目的

OneShotのSceneを作る時、毎回Promptをゼロから書かず、Scene・人体部位・構図・表情・衣装・演出を辞書から選び、指示を組み立てられるようにする。

## 辞書の分離案

### Scene辞書

Sceneの目的、時間帯、場所、登場人物、感情、行動、必要素材を管理する。

```text
scene_id
scene_purpose
location_id
time_tag
character_refs
emotion_tag
action_tag
asset_refs
```

### 人体部位辞書

人物生成で崩れやすい部位や、見せたい部位を指定するための辞書。

```text
body_part_id
display_name
pose_relation
camera_relation
prompt_tokens
negative_tokens
reference_notes
```

対象例は顔、目、口、手、腕、脚、全身、衣装、髪。実際のtokenはモデルや生成環境ごとに検証してから登録する。

### 構図・カメラ辞書

```text
camera_id
shot_size
angle
subject_position
focus_part
composition_tag
```

### 演出辞書

光、天候、色、時間帯、被写界深度、motion感、効果をSceneへ付与する。

## OneShot指示の組み立て

```text
OneShot Scene
  + Character identity
  + Body part / Pose
  + Camera / Composition
  + Location / Time
  + Emotion / Action
  + Lighting / Effect
  + Asset requirements
  -> Prompt draft / AssetSpec / Scene list
```

## 先に決めること

1. どの生成環境・モデルへ渡す辞書か。
2. Prompt tokenを正本にするか、意味tagを正本にするか。
3. OneShot JSONのSceneにどのIDを持たせるか。
4. 生成結果と採用素材をどのAssetRegistryへ戻すか。

## 今の扱い

この資料は実装開始の合図ではない。具体的なKingsAIまたは生成用Promptの記事が見つかった時に、Scene辞書と部位辞書の実データを追加するための棚として残す。
