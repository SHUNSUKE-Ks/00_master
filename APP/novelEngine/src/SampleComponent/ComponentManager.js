import { stepperTileWindowInfo } from "./Stepper";

const componentRegistry = [stepperTileWindowInfo];

export function listSampleComponents() {
  return componentRegistry.map(({ component, props, ...info }) => info);
}

export function getSampleComponentById(id) {
  return componentRegistry.find((entry) => entry.id === id) || null;
}

export function getSampleComponentsByCategory(category) {
  return componentRegistry.filter((entry) => entry.category === category);
}

export default {
  all: componentRegistry,
  list: listSampleComponents,
  getById: getSampleComponentById,
  getByCategory: getSampleComponentsByCategory,
};
