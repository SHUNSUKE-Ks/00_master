import { Play } from "lucide-solid";
import type { DevindexData } from "../data/devindex";
import type { LabState } from "../state/labState";
import { EngineCard } from "../components/EngineCard";
import { PanelChrome } from "../components/PanelChrome";

export function EngineSandboxView(props: { lab: LabState; data: DevindexData }) {
  return (
    <div class="view-stack">
      <PanelChrome title="Engine Sandbox" subtitle="3つの共通エンジンそのものを改造・検証する場所です。Title固有のscenario/background/character作業とは分けます。">
        <div class="engine-grid">
          {props.data.engines.map((engine) => <EngineCard engine={engine} lab={props.lab} />)}
        </div>
      </PanelChrome>

      <PanelChrome title="Isolated Test Environments" subtitle="本体に混ぜる前の軽い試験場。">
        <div class="test-list">
          {props.data.tests.map((test) => (
            <button
              onClick={() => {
                console.info("[CG_TEST_ROW]", test);
                props.lab.openWorkspace({
                  kind: "engine-sandbox",
                  id: test.testId,
                  label: test.label,
                  componentKey: test.componentKey,
                });
              }}
            >
              <span>
                <strong>{test.label}</strong>
                <small>{test.summary}</small>
              </span>
              <Play size={16} />
            </button>
          ))}
        </div>
      </PanelChrome>
    </div>
  );
}
