import StandbyScreenSample, { StandbyStage } from "./StandbyScreenSample";

export { StandbyScreenSample, StandbyStage };

export const standbyScreenSampleInfo = {
  id: "sample.standby-screen.pc-mobile",
  name: "StandbyScreenSample",
  displayName: "待機画面 PC/Mobile",
  category: "Screen",
  component: StandbyScreenSample,
  source: "src/SampleComponent/StandbyScreen/StandbyScreenSample.jsx",
  style: "src/SampleComponent/StandbyScreen/StandbyScreenSample.css",
  status: "sample",
  tags: ["solidjs", "jsx", "standby-screen", "character-talk", "pc", "pixel-6a"],
  props: {},
};

export default StandbyScreenSample;
