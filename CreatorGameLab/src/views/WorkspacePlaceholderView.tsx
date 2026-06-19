import { WorkspaceToolbar } from "../components/WorkspaceToolbar";
import type { DevindexData } from "../data/devindex";
import { resolveComponentLabel } from "../registry/componentRegistry";
import type { LabState } from "../state/labState";

export function WorkspacePlaceholderView(props: { lab: LabState; data: DevindexData }) {
  const target = () => props.lab.activeTarget();

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
          <h2>Workspace Reserved</h2>
          <p>NovelGameWorkspace本体は後続Scaffoldで開発します。ここでは遷移、Active Target、Backだけ確認します。</p>
          <dl>
            <div><dt>componentKey</dt><dd>{target()?.componentKey ?? "none"}</dd></div>
            <div><dt>component</dt><dd>{target() ? resolveComponentLabel(props.data, target()!.componentKey) : "Fallback required"}</dd></div>
            <div><dt>viewMode</dt><dd>{props.lab.viewMode()}</dd></div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
