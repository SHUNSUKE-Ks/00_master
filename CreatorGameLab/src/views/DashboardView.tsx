import { ArrowRight, Clock3, FolderKanban, Layers3, Plus } from "lucide-solid";
import { findTitle, type DevindexData } from "../data/devindex";
import type { LabState } from "../state/labState";
import { PanelChrome } from "../components/PanelChrome";
import { ProgressBar } from "../components/ProgressBar";
import { ResumeSlotRow } from "../components/ResumeSlotRow";

export function DashboardView(props: { lab: LabState; data: DevindexData }) {
  const activeSlots = () => props.data.saveSlots.slice(0, 3);
  const primaryTitle = () => props.data.titles[0];

  return (
    <div class="view-stack dashboard-view">
      <section class="dashboard-hero tile-window">
        <div class="hero-copy">
          <h1>Resume Board</h1>
          <p>途中の作業、プロジェクト、Engine Sandboxを一画面に集めて、すぐ続きを始めるためのDashboardです。</p>
          <div class="hero-actions">
            <button
              class="primary-action"
              onClick={() => {
                console.info("[CG_DASHBOARD_RESUME_PRIMARY]", primaryTitle());
                props.lab.openWorkspace({
                  kind: "dashboard-work",
                  id: primaryTitle()?.titleId ?? "empty",
                  label: primaryTitle()?.title ?? "No active project",
                  componentKey: primaryTitle()?.componentKey ?? "emptyPrototypeWorkspace",
                });
              }}
            >
              <ArrowRight size={17} />
              Continue Latest
            </button>
            <button onClick={() => props.lab.openHubView("titleSelect")}>
              <FolderKanban size={17} />
              Browse Projects
            </button>
          </div>
        </div>
        <div class="hero-focus-card">
          <span>Current Focus</span>
          <h2>{primaryTitle()?.title ?? "No active project"}</h2>
          <p>{activeSlots()[0]?.label ?? "Add a save slot to begin"}</p>
          <ProgressBar value={primaryTitle()?.progressPercent ?? 0} />
          <small>{primaryTitle()?.progressPercent ?? 0}% ready</small>
        </div>
      </section>

      <div class="dashboard-grid">
        <PanelChrome
          title="作業再開パネル"
          subtitle={`Data Source: ${props.data.source.label}`}
          actions={<button onClick={() => console.info("[CG_DASHBOARD_NEW_WORK]", "new work placeholder")}><Plus size={16} />New</button>}
        >
          <div class="work-panel-grid">
            {activeSlots().map((slot) => {
              const title = findTitle(props.data, slot.targetTitleId);
              return (
                <button
                  class="work-panel"
                  onClick={() => {
                    console.info("[CG_DASHBOARD_OPEN_WORK]", slot);
                    props.lab.openWorkspace({
                      kind: "dashboard-work",
                      id: slot.slotId,
                      label: slot.label,
                      componentKey: slot.componentKey,
                      routeState: slot.routeState,
                    });
                  }}
                >
                  <span class={`work-art theme-${title?.theme ?? "adventure"}`} />
                  <strong>{title?.title ?? slot.targetTitleId}</strong>
                  <small>{slot.label}</small>
                  <code>{slot.componentKey}</code>
                </button>
              );
            })}
          </div>
        </PanelChrome>

        <PanelChrome title="Project Progress" subtitle="制作タイトルの進行状態。">
          <div class="progress-list">
            {props.data.titles.map((title) => (
              <button
                class="progress-item"
                onClick={() => {
                  console.info("[CG_TITLE_TILE]", title);
                  props.lab.openWorkspace({
                    kind: "game-title",
                    id: title.titleId,
                    label: title.title,
                    componentKey: title.componentKey,
                  });
                }}
              >
                <span>
                  <strong>{title.title}</strong>
                  <small>{title.engine}</small>
                </span>
                <ProgressBar value={title.progressPercent} tone={title.engine === "BattleEngine" ? "gold" : title.engine === "CollectionEngine" ? "green" : "cyan"} />
                <b>{title.progressPercent}%</b>
              </button>
            ))}
          </div>
        </PanelChrome>

        <PanelChrome title="Engine Shortcuts" subtitle="Engine単位の確認入口。">
          <div class="shortcut-list">
            {props.data.engines.map((engine) => (
              <button
                onClick={() => {
                  console.info("[CG_ENGINE_CARD]", engine);
                  props.lab.openWorkspace({
                    kind: "engine-sandbox",
                    id: engine.sandboxId,
                    label: engine.label,
                    componentKey: engine.componentKey,
                  });
                }}
              >
                <Layers3 size={18} />
                <span>
                  <strong>{engine.label}</strong>
                  <small>{engine.status}</small>
                </span>
              </button>
            ))}
          </div>
        </PanelChrome>

        <PanelChrome title="Recent Saves" subtitle="保存地点から直接再開。">
          <div class="resume-list compact">
            {activeSlots().map((slot) => <ResumeSlotRow slot={slot} lab={props.lab} data={props.data} />)}
          </div>
          <button class="text-link" onClick={() => props.lab.openHubView("devSaveLoad")}>
            <Clock3 size={16} />
            Open Dev Save / Load
          </button>
        </PanelChrome>
      </div>
    </div>
  );
}
