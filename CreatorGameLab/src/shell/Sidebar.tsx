import { Box, Database, Gamepad2, Gauge, LayoutDashboard, MonitorPlay, Save, Settings } from "lucide-solid";
import type { LabState, ViewPhase } from "../state/labState";

type NavItem = {
  id: ViewPhase;
  label: string;
  icon: typeof LayoutDashboard;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "titleSelect", label: "Title Select", icon: Gamepad2 },
  { id: "engineSandbox", label: "Engine Sandbox", icon: Box },
  { id: "devSaveLoad", label: "Dev Save / Load", icon: Save },
  { id: "componentRegistry", label: "Component Registry", icon: Database },
];

export function Sidebar(props: { lab: LabState }) {
  return (
    <aside class="lab-sidebar">
      <div class="brand-block">
        <div class="brand-mark"><Gauge size={18} /></div>
        <div>
          <strong>CreatorGameLab</strong>
          <small>resume dashboard</small>
        </div>
      </div>

      <nav class="side-nav" aria-label="CreatorGameLab views">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = () => props.lab.viewPhase() === item.id;
          return (
            <button
              classList={{ active: active() }}
              onClick={() => {
                props.lab.openHubView(item.id);
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
        {props.lab.appPhase() === "workspace" && (
          <button class="active workspace-nav-state" onClick={() => console.info("[CG_SHELL_NAV]", { current: "activeWorkspace" })}>
            <MonitorPlay size={18} />
            <span>Workspace</span>
          </button>
        )}
      </nav>

      <div class="sidebar-foot">
        <button onClick={() => console.info("[CG_SETTINGS_OPEN]", "settings placeholder")}>
          <Settings size={17} />
          <span>Settings</span>
        </button>
        <div class="env-chip">
          <span>Environment</span>
          <strong>Scaffold</strong>
        </div>
      </div>
    </aside>
  );
}
