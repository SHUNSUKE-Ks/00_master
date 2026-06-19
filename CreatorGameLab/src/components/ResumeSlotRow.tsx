import { ArrowRight } from "lucide-solid";
import type { DevindexData, DevSaveSlot } from "../data/devindex";
import { findTitle } from "../data/devindex";
import type { LabState } from "../state/labState";

export function ResumeSlotRow(props: { slot: DevSaveSlot; lab: LabState; data: DevindexData }) {
  const title = () => findTitle(props.data, props.slot.targetTitleId);
  return (
    <button
      class="resume-row"
      onClick={() => {
        console.info("[CG_SAVE_RESUME]", props.slot);
        props.lab.openWorkspace({
          kind: "dev-save-slot",
          id: props.slot.slotId,
          label: props.slot.label,
          componentKey: props.slot.componentKey,
          routeState: props.slot.routeState,
        });
      }}
    >
      <span class={`row-thumb theme-${title()?.theme ?? "adventure"}`} />
      <span>
        <strong>{title()?.title ?? props.slot.targetTitleId}</strong>
        <small>{props.slot.label} / {props.slot.workPhase ?? "phase pending"}</small>
      </span>
      <code>{props.slot.componentKey}</code>
      <ArrowRight size={17} />
    </button>
  );
}
