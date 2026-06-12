import { Show } from "solid-js";
import { audioManager } from "./audioManager";

export default function AudioControls() {
  return (
    <div class="audio-controls" aria-label="BGM controls">
      <button
        type="button"
        onClick={() => audioManager.enabled() ? audioManager.setMuted(!audioManager.muted()) : audioManager.unlock()}
      >
        {audioManager.muted() ? "BGM OFF" : audioManager.enabled() ? "BGM ON" : "BGM START"}
      </button>
      <Show when={audioManager.currentTrack()}>
        <span>{audioManager.currentTrack().label}</span>
      </Show>
    </div>
  );
}
