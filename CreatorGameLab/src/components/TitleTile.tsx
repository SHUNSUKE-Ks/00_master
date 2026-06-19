import { Eye, MonitorPlay } from "lucide-solid";
import type { DevindexData, GameTitle } from "../data/devindex";
import { findLatestSlot } from "../data/devindex";
import type { LabState } from "../state/labState";
import { ProgressBar } from "./ProgressBar";

export function TitleTile(props: { title: GameTitle; lab: LabState; data: DevindexData }) {
  const slot = () => findLatestSlot(props.data, props.title.titleId);
  const layout = () => props.data.layoutProfiles.find((profile) => profile.layoutProfileId === props.title.layoutProfileId);
  const engineSlotLabels = () => {
    const slots = props.title.engineSlots;
    if (!slots) return [];
    return [slots.adventure, slots.battle, slots.collection].map((selection) => `${selection.engineId.replace("Engine", "")}:${selection.version}`);
  };
  const openTitleSaveLoad = () => {
    console.info("[CG_TITLE_OPEN_SAVELOAD]", props.title);
    props.lab.setActiveTarget({
      kind: "game-title",
      id: props.title.titleId,
      label: props.title.title,
      componentKey: props.title.componentKey,
    });
    props.lab.openHubView("devSaveLoad");
  };

  return (
    <article class={`title-tile theme-${props.title.theme}`} onClick={openTitleSaveLoad}>
      <div class="tile-art">
        <span>{props.title.engine}</span>
      </div>
      <div class="title-tile-body">
        <div>
          <h3>{props.title.title}</h3>
          <p>{slot()?.label ?? props.title.status}</p>
        </div>
        <div class="title-action-icons">
          <button
            aria-label={`Preview ${props.title.title}`}
            onClick={(event) => {
              event.stopPropagation();
              console.info("[CG_TITLE_PREVIEW]", props.title);
            }}
          >
            <Eye size={15} />
          </button>
          <button
            aria-label={`Open workspace slots for ${props.title.title}`}
            onClick={(event) => {
              event.stopPropagation();
              openTitleSaveLoad();
            }}
          >
            <MonitorPlay size={15} />
          </button>
        </div>
      </div>
      <div class="title-config-strip">
        <span>{layout()?.orientation ?? "layout?"}</span>
        <small>{engineSlotLabels().join(" / ")}</small>
      </div>
      <ProgressBar value={props.title.progressPercent} />
    </article>
  );
}
