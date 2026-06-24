import { StandbyScreenSample } from "./StandbyScreen";
import { ConversationScreenSample } from "./ConversationScreen";
import { ConversationLogSamples } from "./ConversationLog";
import { StepperTileWindow } from "./Stepper";

export default function SampleComponentPreview() {
  return (
    <main class="sample-component-preview">
      <div class="sample-component-stack">
        <StandbyScreenSample />
        <ConversationScreenSample />
        <ConversationLogSamples />
        <section class="sample-stepper-showcase">
          <div class="sample-section-heading">
            <p>Component Sample</p>
            <h1>ステッパー・タイルウィンドウ</h1>
          </div>
          <StepperTileWindow />
        </section>
      </div>
    </main>
  );
}
