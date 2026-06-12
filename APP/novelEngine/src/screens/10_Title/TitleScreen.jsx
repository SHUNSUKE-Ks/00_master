import { gameStore } from "../../stores/gameStore";
import { audioManager } from "../../audio/audioManager";
import library from "../../data/library/dev_library.default.json";

export default function TitleScreen() {
  const titleScreen = gameStore.scenario.titleScreen ?? {};
  const title = titleScreen.title ?? gameStore.scenario.title;
  const titleAssets = library.assetOrder?.TITLE ?? {};
  const bg = titleAssets.TITLE_BG?.path;
  const logo = titleAssets.TITLE_LOGO?.path;
  function handleStart() {
    audioManager.unlock();
    gameStore.startGame();
  }

  return (
    <section class="screen title-screen" style={{ "--title-bg": `url("${bg}")` }}>
      <div class="title-vignette" />
      <div class="screen-inner title-content">
        <p class="screen-kicker">OneJson NovelEngine Vol1.1</p>
        <img class="title-logo" src={logo} alt={`${title} logo`} />
        <h1>{title}</h1>
        <p class="title-subtitle">{titleScreen.subtitle ?? "scenario_main.json だけで読む短編ノベル"}</p>
        <button type="button" class="primary-button" onClick={handleStart}>
          {titleScreen.startButtonLabel ?? "はじめる"}
        </button>
      </div>
    </section>
  );
}
