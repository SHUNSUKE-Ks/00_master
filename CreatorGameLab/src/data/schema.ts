export type DataSourceManifest = {
  schemaVersion: "creator-game-lab.data-source.v1";
  activeSource: string;
  sources: DataSourceEntry[];
};

export type DataSourceEntry = {
  id: string;
  label: string;
  basePath: string;
  description?: string;
};

export type GameTitle = {
  titleId: string;
  title: string;
  status: string;
  engine: string;
  engineSlots?: TitleEngineSlots;
  layoutProfileId?: string;
  progressPercent: number;
  theme?: "adventure" | "battle" | "collection" | "neon" | string;
  lastEditedAt: string;
  componentKey: string;
  latestSaveSlotId: string | null;
};

export type TitleEngineSlots = {
  adventure: EngineSelection;
  battle: EngineSelection;
  collection: EngineSelection;
};

export type EngineSelection = {
  engineId: "AdventureEngine" | "BattleEngine" | "CollectionEngine" | string;
  modelId: string;
  version: string;
  status: "selected" | "candidate" | "locked" | "planned";
};

export type EngineSandbox = {
  sandboxId: string;
  label: string;
  engineId: string;
  status: string;
  summary: string;
  componentKey: string;
  targetPath?: string;
  models?: EngineModel[];
};

export type EngineModel = {
  modelId: string;
  label: string;
  version: string;
  status: "ready" | "planned" | "deprecated";
  summary: string;
  sourcePath?: string;
  adapterKind?: "direct-app" | "devlayer-overlay" | "planned";
  devLayerSupport?: boolean;
};

export type EngineTest = {
  testId: string;
  label: string;
  summary: string;
  componentKey: string;
};

export type DevSaveSlot = {
  slotId: string;
  targetTitleId: string;
  label: string;
  resumePoint: string;
  componentKey: string;
  workScope?: "engine-development" | "title-content";
  workPhase?: string;
  stepTodo?: WorkStepTodo[];
  routeState?: Record<string, unknown>;
  memo?: string;
  updatedAt: string;
};

export type WorkStepTodo = {
  stepId: string;
  label: string;
  status: "todo" | "doing" | "blocked" | "done";
};

export type ComponentView = {
  componentKey: string;
  label: string;
  status: string;
  targetWorkspace: string;
  targetEngine: string | null;
  summary: string;
  migrationStatus: string;
};

export type TitleGameStudio = {
  studioId: string;
  title: string;
  status: "draft" | "designing" | "ready_for_engine_binding" | "connected" | string;
  targetTitleId?: string;
  summary: string;
  studioKind: "srpg" | "novel" | "collection" | "hybrid" | string;
  componentKey: string;
  standaloneHtmlPath?: string;
  packageManifestPath?: string;
  runtimeManifestPath?: string;
  designDocPath?: string;
  progressPercent: number;
  screenCount: number;
  assetCount: number;
  fixLogCount: number;
  engineBinding: TitleStudioEngineBinding;
  viewStateLayers: TitleStudioViewStateLayers;
  updatedAt: string;
};

export type TitleStudioEngineBinding = {
  adventure: EngineSelection;
  battle: EngineSelection;
  collection: EngineSelection;
};

export type TitleStudioViewStateLayers = {
  appPhase: string[];
  viewPhase: string[];
  activeTarget: string[];
  viewMode: string[];
  interactionState: string[];
  overlayState: string[];
};

export type MigrationItem = {
  migrationId: string;
  sourcePath: string;
  title: string;
  targetEngine: string;
  status: string;
  componentKeys: string[];
  notes: string;
};

export type DevindexData = {
  source: DataSourceEntry;
  titles: GameTitle[];
  engines: EngineSandbox[];
  tests: EngineTest[];
  layoutProfiles: LayoutProfile[];
  saveSlots: DevSaveSlot[];
  components: ComponentView[];
  titleStudios: TitleGameStudio[];
  migrations: MigrationItem[];
};

export type LayoutProfile = {
  layoutProfileId: string;
  label: string;
  targetDevice: "android" | "desktop" | "web" | string;
  orientation: "portrait" | "landscape";
  aspectHint: string;
  status: "ready" | "planned";
  summary: string;
};
