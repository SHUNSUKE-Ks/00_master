import { createSignal, Match, Show, Switch } from "solid-js";
import AudioControls from "./audio/AudioControls";
import AudioDirector from "./audio/AudioDirector";
import GameManager from "./screens/00_GameManager/GameManager";
import DevStudio from "./DevStudio/DevStudio";
import SampleComponentPreview from "./SampleComponent/SampleComponentPreview";

export default function App() {
  const [mode, setMode] = createSignal("engine");

  return (
    <>
      <AudioDirector />
      <div class="app-mode-switch" aria-label="App mode">
        <button
          type="button"
          classList={{ active: mode() === "engine" }}
          onClick={() => setMode("engine")}
        >
          Engine
        </button>
        <button
          type="button"
          classList={{ active: mode() === "devstudio" }}
          onClick={() => setMode("devstudio")}
        >
          DevStudio
        </button>
        <button
          type="button"
          classList={{ active: mode() === "sample" }}
          onClick={() => setMode("sample")}
        >
          Sample
        </button>
      </div>
      <Show when={mode() === "engine"}>
        <AudioControls />
      </Show>
      <Switch>
        <Match when={mode() === "engine"}>
          <GameManager />
        </Match>
        <Match when={mode() === "devstudio"}>
          <DevStudio />
        </Match>
        <Match when={mode() === "sample"}>
          <SampleComponentPreview />
        </Match>
      </Switch>
    </>
  );
}
