import { Match, Switch } from "solid-js";
import { createDevindexResource } from "./data/devindex";
import { AppShell } from "./shell/AppShell";
import { createLabState } from "./state/labState";
import { DashboardView } from "./views/DashboardView";
import { TitleSelectView } from "./views/TitleSelectView";
import { EngineSandboxView } from "./views/EngineSandboxView";
import { DevSaveLoadView } from "./views/DevSaveLoadView";
import { TitleGameStudiosView } from "./views/TitleGameStudiosView";
import { ComponentRegistryView } from "./views/ComponentRegistryView";
import { WorkspacePlaceholderView } from "./views/WorkspacePlaceholderView";

export default function App() {
  const lab = createLabState();
  const [devindex] = createDevindexResource();

  return (
    <AppShell lab={lab}>
      <Switch>
        <Match when={devindex.loading}>
          <div class="view-stack"><section class="tile-window data-state">Loading data source...</section></div>
        </Match>
        <Match when={devindex.error}>
          <div class="view-stack">
            <section class="tile-window data-state error">
              <h1>Data source failed</h1>
              <p>{String(devindex.error)}</p>
              <code>/data-sources/source-manifest.json</code>
            </section>
          </div>
        </Match>
        <Match when={lab.viewPhase() === "dashboard"}>
          <DashboardView lab={lab} data={devindex()!} />
        </Match>
        <Match when={lab.viewPhase() === "titleSelect"}>
          <TitleSelectView lab={lab} data={devindex()!} />
        </Match>
        <Match when={lab.viewPhase() === "engineSandbox"}>
          <EngineSandboxView lab={lab} data={devindex()!} />
        </Match>
        <Match when={lab.viewPhase() === "devSaveLoad"}>
          <DevSaveLoadView lab={lab} data={devindex()!} />
        </Match>
        <Match when={lab.viewPhase() === "titleGameStudios"}>
          <TitleGameStudiosView lab={lab} data={devindex()!} />
        </Match>
        <Match when={lab.viewPhase() === "componentRegistry"}>
          <ComponentRegistryView lab={lab} data={devindex()!} />
        </Match>
        <Match when={lab.viewPhase() === "activeWorkspace"}>
          <WorkspacePlaceholderView lab={lab} data={devindex()!} />
        </Match>
      </Switch>
    </AppShell>
  );
}
