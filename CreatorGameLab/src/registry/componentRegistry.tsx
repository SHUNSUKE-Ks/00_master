import { findComponent, type DevindexData } from "../data/devindex";

export function resolveComponentLabel(data: DevindexData, componentKey: string) {
  const component = findComponent(data, componentKey);
  if (!component) {
    console.info("[CG_WORKSPACE_FALLBACK]", { componentKey });
    return "Fallback required";
  }

  return component.label;
}
