export function getTalk(scene, index) {
  if (!scene || !Array.isArray(scene.talk)) return null;
  return scene.talk[index] ?? null;
}

export function normalizeTalk(talk) {
  if (Array.isArray(talk)) {
    return {
      speaker: talk[0] ?? "",
      text: talk[1] ?? "",
      tags: []
    };
  }

  return {
    speaker: talk?.speaker ?? "",
    text: talk?.text ?? "",
    tags: talk?.tags ?? []
  };
}

export function collectScenarioTags(scenario) {
  const tags = new Set();
  for (const scene of scenario.scenes ?? []) {
    for (const tag of scene.tags ?? []) tags.add(tag);
    for (const talk of scene.talk ?? []) {
      for (const tag of normalizeTalk(talk).tags ?? []) tags.add(tag);
    }
  }
  for (const hint of scenario.cgHints ?? []) {
    for (const tag of hint.tags ?? []) tags.add(tag);
  }
  return [...tags].sort();
}

export function categorizeScenarioTags(scenario) {
  const categories = {
    bg: [],
    char: [],
    face: [],
    cg: [],
    bgm: [],
    se: [],
    fx: [],
    cam: [],
    mood: [],
    flag: [],
    ev: [],
    req: [],
    memo: [],
    fn: [],
    ui: [],
    other: []
  };

  for (const tag of collectScenarioTags(scenario)) {
    const prefix = tag.includes("_") ? tag.split("_")[0] : "other";
    const key = Object.hasOwn(categories, prefix) ? prefix : "other";
    categories[key].push(tag);
  }

  return categories;
}

export function validateScenario(scenario) {
  const issues = [];
  const scenes = Array.isArray(scenario.scenes) ? scenario.scenes : [];

  if (!scenario.title || typeof scenario.title !== "string") {
    issues.push({ level: "error", message: "title が未設定です。" });
  }

  if (!scenes.length) {
    issues.push({ level: "error", message: "scenes が空です。" });
  }

  const sceneIds = new Set();
  for (const [sceneIndex, scene] of scenes.entries()) {
    if (!scene.id) {
      issues.push({ level: "warning", message: `scene ${sceneIndex + 1} に id がありません。` });
    } else if (sceneIds.has(scene.id)) {
      issues.push({ level: "error", message: `scene id "${scene.id}" が重複しています。` });
    } else {
      sceneIds.add(scene.id);
    }

    if (!scene.scene) {
      issues.push({ level: "warning", message: `${scene.id ?? `scene ${sceneIndex + 1}`} に scene 名がありません。` });
    }

    if (!Array.isArray(scene.talk) || scene.talk.length === 0) {
      issues.push({ level: "error", message: `${scene.id ?? `scene ${sceneIndex + 1}`} に talk がありません。` });
      continue;
    }

    for (const [talkIndex, talk] of scene.talk.entries()) {
      const normalized = normalizeTalk(talk);
      if (!normalized.speaker) {
        issues.push({
          level: "warning",
          message: `${scene.id ?? `scene ${sceneIndex + 1}`} talk ${talkIndex + 1} に speaker がありません。`
        });
      }
      if (!normalized.text) {
        issues.push({
          level: "error",
          message: `${scene.id ?? `scene ${sceneIndex + 1}`} talk ${talkIndex + 1} に text がありません。`
        });
      }
    }

    if (scene.next && !scenes.some((candidate) => candidate.id === scene.next)) {
      issues.push({ level: "warning", message: `${scene.id} の next "${scene.next}" が scenes 内にありません。` });
    }
  }

  return {
    ok: issues.every((issue) => issue.level !== "error"),
    issues
  };
}

export function getScenarioStats(scenario) {
  const scenes = Array.isArray(scenario.scenes) ? scenario.scenes : [];
  const talks = scenes.reduce((total, scene) => total + (Array.isArray(scene.talk) ? scene.talk.length : 0), 0);
  return {
    scenes: scenes.length,
    talks,
    tags: collectScenarioTags(scenario).length,
    cgHints: Array.isArray(scenario.cgHints) ? scenario.cgHints.length : 0
  };
}
