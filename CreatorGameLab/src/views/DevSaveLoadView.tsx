import { Plus } from "lucide-solid";
import type { DevindexData } from "../data/devindex";
import type { LabState } from "../state/labState";
import { PanelChrome } from "../components/PanelChrome";
import { ResumeSlotRow } from "../components/ResumeSlotRow";

export function DevSaveLoadView(props: { lab: LabState; data: DevindexData }) {
  const selectedTitle = () => {
    const target = props.lab.activeTarget();
    return target?.kind === "game-title" ? props.data.titles.find((title) => title.titleId === target.id) : undefined;
  };
  const visibleSlots = () => {
    const title = selectedTitle();
    return title ? props.data.saveSlots.filter((slot) => slot.targetTitleId === title.titleId) : props.data.saveSlots;
  };

  return (
    <div class="view-stack">
      <PanelChrome
        title={selectedTitle() ? `${selectedTitle()!.title} / Save Slots` : "Dev Save / Load"}
        subtitle={selectedTitle() ? "Title内のscenario / background / characterなどの作業スロットからWorkspaceを開始します。" : "エンジン改造や共通検証を含む中断作業をResume Pointから再開します。"}
        actions={<button onClick={() => console.info("[CG_SAVE_HEADER]", "new save placeholder")}><Plus size={16} />New Save</button>}
      >
        <div class="scope-note">
          <strong>{selectedTitle() ? "Title Content Work" : "Global / Engine Work"}</strong>
          <span>{selectedTitle() ? "エンジンは完成済みとして、タイトル固有の制作作業を扱う。" : "3つの共通エンジン改造や、全体にまたがる作業を扱う。"}</span>
        </div>
        <div class="resume-table-head">
          <span>Title / Slot</span>
          <span>Component</span>
          <span>Action</span>
        </div>
        <div class="resume-list">
          {visibleSlots().map((slot) => <ResumeSlotRow slot={slot} lab={props.lab} data={props.data} />)}
        </div>
      </PanelChrome>
    </div>
  );
}
