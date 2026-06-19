import { ArrowLeft, Save } from "lucide-solid";
import type { LabState } from "../state/labState";

export function WorkspaceToolbar(props: { lab: LabState }) {
  const target = () => props.lab.activeTarget();

  return (
    <header class="workspace-toolbar tile-window">
      <button onClick={() => props.lab.backToHub()}>
        <ArrowLeft size={17} />
        Back
      </button>
      <div>
        <strong>{target()?.label ?? "No Active Target"}</strong>
        <small>{target()?.kind ?? "workspace placeholder"}</small>
      </div>
      <button onClick={() => console.info("[CG_WORKSPACE_SAVE]", target())}>
        <Save size={17} />
        Save State
      </button>
    </header>
  );
}
