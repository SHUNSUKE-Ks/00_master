# scenarioOneShot：下書きをruntime JSONへ変換する

`scenario_oneshot`はNoteやChatから書きやすい形で受け取る下書き。runtimeは`scenario_main`を読むので、間に変換層を置く。

## 要点

| Key | 意味 |
| --- | --- |
| 受取 | NoteやChatが書いた短いJSON |
| 正規 | idやnextをruntimeの形式に寄せる |
| 補完 | speakerからCharacter tagを推定する |
| 変換 | scene配列をruntime用sceneへ作り替える |
| 検査 | 必須項目が欠けていないかissuesにする |

## 読むコード

```js
function normalizeSceneId(id, index) {
  // 正規: sc_001でもscene_001でもruntime側のscene_001へ寄せる。
  if (!id) return `scene_${String(index + 1).padStart(3, "0")}`;
  if (id.startsWith("scene_")) return id;
  if (id.startsWith("sc_")) return `scene_${id.slice(3)}`;
  return `scene_${id}`;
}

function normalizeTalk(talk, talkIndex, sceneCharacters) {
  // 受取: 配列形式 ["話者", "本文", ["tag"]] も許す。
  if (Array.isArray(talk)) {
    const speaker = talk[0] ?? "";
    const text = talk[1] ?? "";
    const tags = Array.isArray(talk[2]) ? talk[2] : [];
    return {
      id: `talk_${String(talkIndex + 1).padStart(3, "0")}`,
      speaker,
      text,
      tags: unique([...defaultCharacterTags(sceneCharacters, speaker), ...tags])
    };
  }
}
```

## 変換の中心

```js
export function convertOneShotToScenarioMain(oneShot) {
  const scenes = oneShot?.scenes ?? [];

  const convertedScenes = scenes.map((scene, sceneIndex) => ({
    id: normalizeSceneId(scene.id, sceneIndex),
    scene: scene.title ?? scene.id ?? `Scene ${sceneIndex + 1}`,
    phase: "PLAYING",
    tags: sceneTags(scene),
    talk: (scene.talk ?? []).map((talk, talkIndex) =>
      normalizeTalk(talk, talkIndex, scene.characters)
    ),
    next: normalizeNextId(scene.next) ?? inferNextSceneId(scenes, sceneIndex)
  }));

  return {
    meta: {
      projectName: oneShot?.meta?.title ?? "Untitled Scenario",
      sourceFormat: oneShot?.meta?.format ?? "scenario_oneshot"
    },
    engine: {
      startScreen: "TITLE",
      startPhase: "TITLE",
      startScene: convertedScenes[0]?.id ?? "scene_001"
    },
    scenes: convertedScenes
  };
}
```

## 学習メモ

書きやすい形式と動かしやすい形式は違っていい。間に変換層を置くと、Note側の入力UXとEngine側のruntimeを分離できる。

