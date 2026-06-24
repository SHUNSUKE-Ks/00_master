import { createSignal, Match, Switch } from "solid-js";
import AudioDirector from "./audio/AudioDirector";
import GameManager from "./screens/00_GameManager/GameManager";
import DevStudio from "./DevStudio/DevStudio";
import SRPGStudio from "./TitleGameStudio/SRPGStudio";
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
          classList={{ active: mode() === "srpgstudio" }}
          onClick={() => setMode("srpgstudio")}
        >
          2D SRPGStudio
        </button>
        <button
          type="button"
          classList={{ active: mode() === "sample" }}
          onClick={() => setMode("sample")}
        >
          Sample
        </button>
      </div>
      <Switch>
        <Match when={mode() === "engine"}>
          <GameManager />
        </Match>
        <Match when={mode() === "devstudio"}>
          <DevStudio />
        </Match>
        <Match when={mode() === "srpgstudio"}>
          <SRPGStudio />
        </Match>
        <Match when={mode() === "sample"}>
          <SampleComponentPreview />
        </Match>
      </Switch>
    </>
  );
}
