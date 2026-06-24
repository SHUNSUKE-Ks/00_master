function normalizeSceneId(id, index) {
  if (!id) return `scene_${String(index + 1).padStart(3, "0")}`;
  if (id.startsWith("scene_")) return id;
  if (id.startsWith("sc_")) return `scene_${id.slice(3)}`;
  return `scene_${id}`;
}

function normalizeNextId(id) {
  if (!id) return null;
  if (id.startsWith("scene_")) return id;
  if (id.startsWith("sc_")) return `scene_${id.slice(3)}`;
  return `scene_${id}`;
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeTalk(talk, talkIndex, sceneCharacters) {
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

  return {
    id: talk?.id ?? `talk_${String(talkIndex + 1).padStart(3, "0")}`,
    speaker: talk?.speaker ?? "",
    text: talk?.text ?? "",
    tags: unique([...defaultCharacterTags(sceneCharacters, talk?.speaker), ...(talk?.tags ?? [])])
  };
}

function defaultCharacterTags(sceneCharacters, speaker) {
  if (!speaker || !Array.isArray(sceneCharacters)) return [];
  const normalizedSpeaker = String(speaker).toLowerCase();
  const candidate = sceneCharacters.find((character) => {
    const id = character.id ?? "";
    return (
      id.toLowerCase().includes(normalizedSpeaker) ||
      (speaker === "主人公" && id.includes("hero")) ||
      (speaker === "ミア" && id.includes("mia"))
    );
  });
  if (!candidate) return [];
  return unique([candidate.id, candidate.face]);
}

function sceneTags(scene) {
  const characterTags = (scene.characters ?? []).flatMap((character) => [character.id, character.face]);
  return unique([scene.bg, ...characterTags, ...(scene.tags ?? [])]);
}

function normalizeChoice(choice) {
  if (!choice) return undefined;
  return {
    id: choice.id ?? "choice_001",
    text: choice.text ?? "",
    options: (choice.options ?? []).map((option, index) => ({
      id: option.id ?? `option_${String(index + 1).padStart(2, "0")}`,
      label: option.label ?? "",
      next: normalizeNextId(option.next),
      setFlags: option.setFlags ?? [],
      tags: option.tags ?? []
    }))
  };
}

export function convertOneShotToScenarioMain(oneShot) {
  const scenes = oneShot?.scenes ?? [];
  const convertedScenes = scenes.map((scene, sceneIndex) => {
    const converted = {
      id: normalizeSceneId(scene.id, sceneIndex),
      scene: scene.title ?? scene.id ?? `Scene ${sceneIndex + 1}`,
      phase: "PLAYING",
      tags: sceneTags(scene),
      talk: (scene.talk ?? []).map((talk, talkIndex) => normalizeTalk(talk, talkIndex, scene.characters)),
      next: normalizeNextId(scene.next) ?? inferNextSceneId(scenes, sceneIndex)
    };
    const choice = normalizeChoice(scene.choice);
    if (choice) converted.choice = choice;
    return converted;
  });

  const title = oneShot?.meta?.title ?? "Untitled Scenario";
  return {
    meta: {
      projectName: title,
      version: "1.1",
      format: "one_json_novel",
      language: "ja",
      sourceFormat: oneShot?.meta?.format ?? "scenario_oneshot",
      sourceEpisode: oneShot?.meta?.episode ?? null
    },
    title,
    engine: {
      startScreen: "TITLE",
      startPhase: "TITLE",
      startScene: convertedScenes[0]?.id ?? "scene_001"
    },
    initialState: {
      screen: "TITLE",
      phase: "TITLE",
      sceneIndex: 0,
      talkIndex: 0
    },
    scenes: convertedScenes,
    assetPrompts: oneShot?.assetPrompts ?? {},
    assetOrderHint: {
      purpose: "scenario_oneshotから抽出。DevStudio Asset Workshopで素材発注へ接続する。",
      categories: ["Backgrounds", "Characters", "Faces", "BGM", "SE", "FX", "UI"]
    }
  };
}

function inferNextSceneId(scenes, sceneIndex) {
  const next = scenes[sceneIndex + 1];
  return next ? normalizeNextId(next.id) : null;
}

export function inspectOneShot(oneShot) {
  const issues = [];
  if (!oneShot?.meta?.title) issues.push({ level: "error", message: "meta.title がありません。" });
  if (!Array.isArray(oneShot?.scenes) || oneShot.scenes.length === 0) {
    issues.push({ level: "error", message: "scenes が空です。" });
  }

  for (const [sceneIndex, scene] of (oneShot?.scenes ?? []).entries()) {
    if (!scene.id) issues.push({ level: "warning", message: `scene ${sceneIndex + 1} に id がありません。` });
    if (!Array.isArray(scene.talk) || scene.talk.length === 0) {
      issues.push({ level: "error", message: `${scene.id ?? `scene ${sceneIndex + 1}`} に talk がありません。` });
    }
  }

  return {
    ok: issues.every((issue) => issue.level !== "error"),
    issues
  };
}
