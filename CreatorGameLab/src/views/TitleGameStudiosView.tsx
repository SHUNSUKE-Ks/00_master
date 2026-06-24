import { For } from "solid-js";
import { ExternalLink, MonitorPlay } from "lucide-solid";
import { ProgressBar } from "../components/ProgressBar";
import type { DevindexData, TitleGameStudio } from "../data/devindex";
import type { LabState } from "../state/labState";

function engineEntries(studio: TitleGameStudio) {
  return [
    ["novel", studio.engineBinding.adventure],
    ["battle", studio.engineBinding.battle],
    ["collection", studio.engineBinding.collection],
  ] as const;
}

export function TitleGameStudiosView(props: { lab: LabState; data: DevindexData }) {
  const openStudioWorkspace = (studio: TitleGameStudio) => {
    props.lab.openWorkspace({
      kind: "title-game-studio",
      id: studio.studioId,
      label: studio.title,
      componentKey: studio.componentKey,
      routeState: {
        studioId: studio.studioId,
        standaloneHtmlPath: studio.standaloneHtmlPath,
        packageManifestPath: studio.packageManifestPath,
        runtimeManifestPath: studio.runtimeManifestPath,
      },
    });
  };

  return (
    <div class="view-stack title-studio-view">
      <section class="view-heading">
        <p>TITLE GAME STUDIOS</p>
        <h1>Engineより先に作るStudio</h1>
        <span>Layout、画面State、素材、Fix Logを固めてから novel / battle / collection Engine を当てます。</span>
      </section>

      <section class="title-studio-grid">
        <For each={props.data.titleStudios}>
          {(studio) => (
            <article class="tile-window title-studio-card">
              <div class="title-studio-card-head">
                <div>
                  <span>{studio.studioKind}</span>
                  <h2>{studio.title}</h2>
                </div>
                <strong>{studio.status}</strong>
              </div>
              <p>{studio.summary}</p>

              <div class="studio-metrics">
                <div><b>{studio.screenCount}</b><span>Screens</span></div>
                <div><b>{studio.assetCount}</b><span>Assets</span></div>
                <div><b>{studio.fixLogCount}</b><span>Fix Logs</span></div>
              </div>

              <ProgressBar value={studio.progressPercent} />

              <div class="engine-binding-list">
                <For each={engineEntries(studio)}>
                  {([slot, engine]) => (
                    <div>
                      <span>{slot}</span>
                      <strong>{engine.modelId}</strong>
                      <em>{engine.status}</em>
                    </div>
                  )}
                </For>
              </div>

              <div class="studio-paths">
                {studio.standaloneHtmlPath && (
                  <code>{studio.standaloneHtmlPath}</code>
                )}
                {studio.runtimeManifestPath && (
                  <code>{studio.runtimeManifestPath}</code>
                )}
                {studio.packageManifestPath && (
                  <code>{studio.packageManifestPath}</code>
                )}
              </div>

              <div class="studio-actions">
                <button onClick={() => openStudioWorkspace(studio)}>
                  <MonitorPlay size={16} />
                  <span>Workspace</span>
                </button>
                {studio.standaloneHtmlPath && (
                  <button onClick={() => console.info("[CG_TITLE_STUDIO_HTML]", studio.standaloneHtmlPath)}>
                    <ExternalLink size={16} />
                    <span>HTML Path</span>
                  </button>
                )}
              </div>
            </article>
          )}
        </For>
      </section>
    </div>
  );
}
