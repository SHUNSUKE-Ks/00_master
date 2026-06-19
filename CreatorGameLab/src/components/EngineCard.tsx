import { Box, Play } from "lucide-solid";
import type { EngineSandbox } from "../data/devindex";
import type { LabState } from "../state/labState";

export function EngineCard(props: { engine: EngineSandbox; lab: LabState }) {
  return (
    <article class="engine-card">
      <Box size={34} />
      <div>
        <h3>{props.engine.label}</h3>
        <p>{props.engine.summary}</p>
      </div>
      <button
        onClick={() => {
          console.info("[CG_ENGINE_OPEN]", props.engine);
          props.lab.openWorkspace({
            kind: "engine-sandbox",
            id: props.engine.sandboxId,
            label: props.engine.label,
            componentKey: props.engine.componentKey,
          });
        }}
      >
        <Play size={15} />
        Open Sandbox
      </button>
    </article>
  );
}
