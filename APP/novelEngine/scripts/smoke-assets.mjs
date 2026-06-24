import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");

const scenarioPath = path.join(root, "src", "data", "scenario", "scenario_main.json");
const libraryPath = path.join(root, "src", "data", "library", "dev_library.default.json");
const schemaPath = path.join(root, "docs", "scenario_delivery_schema.schema.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assetPathToFile(assetPath) {
  if (!assetPath || !assetPath.startsWith("/")) return null;
  return path.join(publicRoot, assetPath.slice(1));
}

function existsAsset(assetPath) {
  const filePath = assetPathToFile(assetPath);
  if (!filePath) {
    return { ok: false, filePath: "", size: 0 };
  }
  if (!fs.existsSync(filePath)) {
    return { ok: false, filePath, size: 0 };
  }
  const stat = fs.statSync(filePath);
  return { ok: stat.isFile() && stat.size > 0, filePath, size: stat.size };
}

function flattenAssetOrder(assetOrder) {
  const rows = [];
  for (const [section, entries] of Object.entries(assetOrder ?? {})) {
    for (const [slot, asset] of Object.entries(entries ?? {})) {
      rows.push({ section, slot, ...asset });
    }
  }
  return rows;
}

function collectScenarioTags(scenario) {
  const tags = new Set();
  for (const scene of scenario.scenes ?? []) {
    for (const tag of scene.tags ?? []) tags.add(tag);
    for (const talk of scene.talk ?? []) {
      for (const tag of talk.tags ?? []) tags.add(tag);
    }
  }
  return [...tags].sort();
}

function groupTags(tags) {
  return tags.reduce((result, tag) => {
    const prefix = tag.includes("_") ? tag.split("_")[0] : "other";
    result[prefix] ??= [];
    result[prefix].push(tag);
    return result;
  }, {});
}

function printCheck(label, status, detail = "") {
  const mark = status === "ok" ? "OK" : status === "warn" ? "WARN" : "NG";
  console.log(`[${mark}] ${label}${detail ? ` - ${detail}` : ""}`);
}

const scenario = readJson(scenarioPath);
const library = readJson(libraryPath);
const schemaExists = fs.existsSync(schemaPath);
const tags = collectScenarioTags(scenario);
const tagGroups = groupTags(tags);
const assetRows = flattenAssetOrder(library.assetOrder);

const errors = [];
const warnings = [];

if (!scenario.title) errors.push("scenario.title is missing");
if (!Array.isArray(scenario.scenes) || scenario.scenes.length === 0) errors.push("scenario.scenes is empty");
if (!schemaExists) errors.push("scenario schema is missing");

for (const scene of scenario.scenes ?? []) {
  if (!scene.id) errors.push("scene.id is missing");
  if (!Array.isArray(scene.talk) || scene.talk.length === 0) errors.push(`${scene.id} has no talk items`);
  if (scene.next && !scenario.scenes.some((candidate) => candidate.id === scene.next)) {
    warnings.push(`${scene.id}.next points to missing scene: ${scene.next}`);
  }
}

const runtimeAssets = [
  ...library.locations.map((location) => ({
    label: `background:${location.id}`,
    path: location.assetPath,
    kind: "background"
  })),
  ...library.characters.flatMap((character) => [
    {
      label: `character:${character.id}:default`,
      path: character.cutoutPath ?? character.demoPath ?? character.assetPath,
      kind: "character"
    },
    {
      label: `character:${character.id}:demo`,
      path: character.demoPath,
      kind: "character-demo"
    },
    {
      label: `character:${character.id}:cutout`,
      path: character.cutoutPath,
      kind: "character-cutout"
    },
    ...Object.entries(character.standingAssets ?? {}).map(([variant, assetPath]) => ({
      label: `character:${character.id}:${variant}`,
      path: assetPath,
      kind: "character"
    })),
    ...(character.assetSlots?.standing?.items ?? []).flatMap((item) => [
      {
        label: `character:${character.id}:${item.variant}:demo`,
        path: item.demoPath,
        kind: "character-demo"
      },
      {
        label: `character:${character.id}:${item.variant}:cutout`,
        path: item.cutoutPath,
        kind: "character-cutout"
      }
    ])
  ]),
  ...assetRows
    .filter((asset) => asset.path)
    .map((asset) => ({
      label: `${asset.section}.${asset.slot}`,
      path: asset.path,
      kind: asset.kind
    }))
];

const uniqueAssets = new Map();
for (const asset of runtimeAssets) {
  uniqueAssets.set(asset.path, asset);
}

for (const asset of uniqueAssets.values()) {
  const check = existsAsset(asset.path);
  if (!check.ok) {
    errors.push(`${asset.label} missing file: ${asset.path}`);
  }
}

const plannedSe = assetRows.filter((asset) => asset.kind === "se" && !asset.path);
for (const asset of plannedSe) {
  warnings.push(`${asset.section}.${asset.slot} is planned SE without path: ${asset.fileName}`);
}

console.log("novelEngine smoke:assets");
printCheck("scenario JSON", "ok", scenarioPath);
printCheck("scenario schema", schemaExists ? "ok" : "ng", schemaPath);
printCheck("scenario counts", "ok", `${scenario.scenes.length} scenes / ${tags.length} tags`);
printCheck("tag groups", "ok", Object.entries(tagGroups).map(([key, values]) => `${key}:${values.length}`).join(", "));
printCheck("character assets", "ok", `${library.characters.length} characters`);
printCheck("background assets", "ok", `${library.locations.length} locations`);
printCheck("BGM assets", "ok", `${assetRows.filter((asset) => asset.kind === "bgm" && asset.path).length} paths`);
printCheck("SE assets", plannedSe.length ? "warn" : "ok", plannedSe.length ? `${plannedSe.length} planned without path` : "ready");

for (const warning of warnings) {
  printCheck("warning", "warn", warning);
}

for (const error of errors) {
  printCheck("error", "ng", error);
}

if (errors.length) {
  process.exitCode = 1;
} else {
  printCheck("smoke result", "ok", "scenario, character, background, and BGM assets are loadable; SE is tracked as planned data");
}
