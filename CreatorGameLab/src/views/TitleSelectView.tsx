import { Grid2X2, List, Plus } from "lucide-solid";
import type { DevindexData } from "../data/devindex";
import type { LabState } from "../state/labState";
import { PanelChrome } from "../components/PanelChrome";
import { TitleTile } from "../components/TitleTile";

export function TitleSelectView(props: { lab: LabState; data: DevindexData }) {
  return (
    <div class="view-stack">
      <PanelChrome
        title="Title Select"
        subtitle="制作タイトルを選び、続きを開始します。"
        actions={
          <>
            <button onClick={() => console.info("[CG_TITLE_HEADER]", "new title placeholder")}><Plus size={16} />New Title</button>
            <button aria-label="grid view"><Grid2X2 size={16} /></button>
            <button aria-label="list view"><List size={16} /></button>
          </>
        }
      >
        <div class="title-grid">
          {props.data.titles.map((title) => <TitleTile title={title} lab={props.lab} data={props.data} />)}
        </div>
      </PanelChrome>
    </div>
  );
}
