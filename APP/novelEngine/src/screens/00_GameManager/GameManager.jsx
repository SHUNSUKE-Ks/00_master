import { Dynamic } from "solid-js/web";
import { gameStore } from "../../stores/gameStore";
import TitleScreen from "../10_Title/TitleScreen";
import NovelScreen from "../20_Novel/NovelScreen";
import EndScreen from "../90_End/EndScreen";

const screens = {
  TITLE: TitleScreen,
  NOVEL: NovelScreen,
  END: EndScreen
};

export default function GameManager() {
  return (
    <main class="game-shell">
      <Dynamic component={screens[gameStore.screen()] ?? TitleScreen} />
    </main>
  );
}
