import { Boxes, Eye } from "lucide-solid";
import type { DevindexData } from "../data/devindex";
import type { LabState } from "../state/labState";
import { PanelChrome } from "../components/PanelChrome";

export function ComponentRegistryView(props: { lab: LabState; data: DevindexData }) {
  return (
    <div class="view-stack">
      <PanelChrome title="Component Registry" subtitle="移植候補、Fallback、ComponentKeyの目次。">
        <div class="component-list">
          {props.data.components.map((component) => (
            <button
              onClick={() => {
                console.info("[CG_COMPONENT_ROW]", component);
                props.lab.setActiveTarget({
                  kind: "component-view",
                  id: component.componentKey,
                  label: component.label,
                  componentKey: component.componentKey,
                });
                props.lab.setViewMode("detail");
              }}
            >
              <Boxes size={18} />
              <span>
                <strong>{component.label}</strong>
                <small>{component.summary}</small>
              </span>
              <code>{component.migrationStatus}</code>
              <Eye size={16} />
            </button>
          ))}
        </div>
      </PanelChrome>
    </div>
  );
}
