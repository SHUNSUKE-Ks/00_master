import { createResource } from "solid-js";
import type {
  ComponentView,
  DataSourceManifest,
  DevSaveSlot,
  DevindexData,
  EngineSandbox,
  EngineTest,
  GameTitle,
  LayoutProfile,
  MigrationItem,
} from "./schema";

const manifestPath = "/data-sources/source-manifest.json";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${path}`);
  }

  return response.json() as Promise<T>;
}

async function loadDevindex(): Promise<DevindexData> {
  const manifest = await loadJson<DataSourceManifest>(manifestPath);
  const source = manifest.sources.find((item) => item.id === manifest.activeSource);

  if (!source) {
    throw new Error(`activeSource not found: ${manifest.activeSource}`);
  }

  const base = source.basePath.replace(/\/$/, "");
  const [titleRegistry, engineRegistry, layoutRegistry, saveRegistry, componentRegistry, migrationRegistry] = await Promise.all([
    loadJson<{ titles?: GameTitle[] }>(`${base}/game-title.registry.json`),
    loadJson<{ sandboxes?: EngineSandbox[]; tests?: EngineTest[] }>(`${base}/engine-sandbox.registry.json`),
    loadJson<{ profiles?: LayoutProfile[] }>(`${base}/layout-profile.registry.json`),
    loadJson<{ slots?: DevSaveSlot[] }>(`${base}/dev-save-slots.json`),
    loadJson<{ components?: ComponentView[] }>(`${base}/component-view.registry.json`),
    loadJson<{ items?: MigrationItem[] }>(`${base}/migration-queue.registry.json`),
  ]);

  const data: DevindexData = {
    source,
    titles: titleRegistry.titles ?? [],
    engines: engineRegistry.sandboxes ?? [],
    tests: engineRegistry.tests ?? [],
    layoutProfiles: layoutRegistry.profiles ?? [],
    saveSlots: saveRegistry.slots ?? [],
    components: componentRegistry.components ?? [],
    migrations: migrationRegistry.items ?? [],
  };

  console.info("[CG_DEVINDEX_LOAD]", {
    source: source.id,
    basePath: source.basePath,
    titles: data.titles.length,
    engines: data.engines.length,
    layoutProfiles: data.layoutProfiles.length,
    saveSlots: data.saveSlots.length,
    components: data.components.length,
  });

  return data;
}

export function createDevindexResource() {
  return createResource(loadDevindex);
}

export function findTitle(data: DevindexData, titleId: string) {
  return data.titles.find((title) => title.titleId === titleId);
}

export function findComponent(data: DevindexData, componentKey: string) {
  return data.components.find((component) => component.componentKey === componentKey);
}

export function findLatestSlot(data: DevindexData, titleId: string) {
  return data.saveSlots.find((slot) => slot.targetTitleId === titleId);
}

export type {
  ComponentView,
  DataSourceManifest,
  DevSaveSlot,
  DevindexData,
  EngineSandbox,
  EngineTest,
  GameTitle,
  LayoutProfile,
  MigrationItem,
};
