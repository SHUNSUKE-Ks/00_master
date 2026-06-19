import { createSignal } from "solid-js";

export type AppPhase = "hub" | "workspace";
export type ViewPhase =
  | "dashboard"
  | "titleSelect"
  | "engineSandbox"
  | "devSaveLoad"
  | "componentRegistry"
  | "activeWorkspace";
export type ViewMode = "index" | "detail" | "preview";
export type InteractionState = "idle" | "hovering" | "selecting" | "opening" | "saving" | "error";
export type OverlayState = "none" | "inspector" | "quickCapture" | "confirm";

export type ActiveTarget =
  | { kind: "dashboard-work"; id: string; label: string; componentKey: string; routeState?: Record<string, unknown> }
  | { kind: "game-title"; id: string; label: string; componentKey: string }
  | { kind: "engine-sandbox"; id: string; label: string; componentKey: string }
  | { kind: "dev-save-slot"; id: string; label: string; componentKey: string; routeState?: Record<string, unknown> }
  | { kind: "component-view"; id: string; label: string; componentKey: string }
  | null;

export function createLabState() {
  const [appPhase, setAppPhase] = createSignal<AppPhase>("hub");
  const [viewPhase, setViewPhase] = createSignal<ViewPhase>("dashboard");
  const [activeTarget, setActiveTarget] = createSignal<ActiveTarget>(null);
  const [viewMode, setViewMode] = createSignal<ViewMode>("index");
  const [interactionState, setInteractionState] = createSignal<InteractionState>("idle");
  const [overlayState, setOverlayState] = createSignal<OverlayState>("none");
  const [viewHistory, setViewHistory] = createSignal<ViewPhase[]>([]);

  const openHubView = (nextView: ViewPhase) => {
    console.info("[CG_SHELL_NAV]", { from: viewPhase(), to: nextView });
    console.info("[CG_STATE_VIEW_PHASE]", nextView);
    setAppPhase("hub");
    setViewPhase(nextView);
    setViewMode("index");
    setInteractionState("idle");
    setOverlayState("none");
  };

  const openWorkspace = (target: Exclude<ActiveTarget, null>) => {
    console.info("[CG_WORKSPACE_OPEN]", target);
    console.info("[CG_STATE_ACTIVE_TARGET]", target);
    console.info("[CG_STATE_VIEW_PHASE]", "activeWorkspace");
    setViewHistory((history) => [...history, viewPhase()]);
    setActiveTarget(target);
    setAppPhase("workspace");
    setViewPhase("activeWorkspace");
    setViewMode("preview");
    setInteractionState("opening");
  };

  const backToHub = () => {
    const history = viewHistory();
    const previous = history[history.length - 1] ?? "dashboard";
    console.info("[CG_WORKSPACE_BACK]", { from: viewPhase(), to: previous });
    console.info("[CG_STATE_VIEW_PHASE]", previous);
    setViewHistory(history.slice(0, -1));
    setAppPhase("hub");
    setViewPhase(previous);
    setViewMode("index");
    setInteractionState("idle");
  };

  return {
    appPhase,
    viewPhase,
    activeTarget,
    viewMode,
    interactionState,
    overlayState,
    openHubView,
    openWorkspace,
    backToHub,
    setActiveTarget: (target: ActiveTarget) => {
      console.info("[CG_STATE_ACTIVE_TARGET]", target);
      setActiveTarget(target);
    },
    setViewMode,
    setInteractionState,
    setOverlayState,
  };
}

export type LabState = ReturnType<typeof createLabState>;
