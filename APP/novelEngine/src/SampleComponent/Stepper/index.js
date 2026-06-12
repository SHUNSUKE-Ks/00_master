import StepperTileWindow, {
  defaultChoices,
  defaultConnectors,
  defaultLocks,
} from "./StepperTileWindow";

export { defaultChoices, defaultConnectors, defaultLocks, StepperTileWindow };

export const stepperTileWindowInfo = {
  id: "sample.stepper.tile-window",
  name: "StepperTileWindow",
  displayName: "ステッパー・タイルウィンドウ",
  category: "Stepper",
  component: StepperTileWindow,
  source: "src/SampleComponent/Stepper/StepperTileWindow.jsx",
  style: "src/SampleComponent/Stepper/StepperTileWindow.css",
  status: "sample",
  tags: ["solidjs", "jsx", "tile-window", "choice", "lock-stepper"],
  props: {
    choices: defaultChoices,
    locks: defaultLocks,
    connectors: defaultConnectors,
    ariaLabel: "Sample stepper tile window",
  },
};
