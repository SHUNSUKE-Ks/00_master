import { WorkspaceToolbar } from "../components/WorkspaceToolbar";
import type { DevindexData } from "../data/devindex";
import { resolveComponentLabel } from "../registry/componentRegistry";
import type { LabState } from "../state/labState";

export function WorkspacePlaceholderView(props: { lab: LabState; data: DevindexData }) {
  const target = () => props.lab.activeTarget();
  const studio = () =>
    target()?.kind === "title-game-studio"
      ? props.data.titleStudios.find((item) => item.studioId === target()?.id)
      : null;

  return (
    <div class="workspace-wireframe">
      <WorkspaceToolbar lab={props.lab} />

      <section class="workspace-body tile-window">
        <div class="wireframe-canvas">
          <div class="wireframe-box large" />
          <div class="wireframe-row">
            <div class="wireframe-box" />
            <div class="wireframe-box" />
            <div class="wireframe-box" />
          </div>
        </div>
        <aside class="workspace-inspector">
          <h2>{studio() ? "TitleGameStudio Workspace" : "Workspace Reserved"}</h2>
          <p>
            {studio()
              ? "TitleGameStudio単体でLayout、素材、State、Runtime Manifestを先に固め、後からEngineを当てます。"
              : "NovelGameWorkspace本体は後続Scaffoldで開発します。ここでは遷移、Active Target、Backだけ確認します。"}
          </p>
          <dl>
            <div><dt>componentKey</dt><dd>{target()?.componentKey ?? "none"}</dd></div>
            <div><dt>component</dt><dd>{target() ? resolveComponentLabel(props.data, target()!.componentKey) : "Fallback required"}</dd></div>
            <div><dt>viewMode</dt><dd>{props.lab.viewMode()}</dd></div>
          </dl>
          {studio() && (
            <div class="workspace-studio-summary">
              <h3>{studio()!.title}</h3>
              <p>{studio()!.summary}</p>
              <code>{studio()!.standaloneHtmlPath || "standalone HTML pending"}</code>
              <code>{studio()!.runtimeManifestPath || "runtime manifest pending"}</code>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
