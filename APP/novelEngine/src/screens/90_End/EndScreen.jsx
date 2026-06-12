import { gameStore } from "../../stores/gameStore";
import { collectScenarioTags } from "../../utils/scenario";

export default function EndScreen() {
  const tags = collectScenarioTags(gameStore.scenario);

  return (
    <section class="screen end-screen">
      <div class="screen-inner end-panel">
        <p class="screen-kicker">END</p>
        <h1>読了しました</h1>
        <p>最後まで再生できました。`scenario_main.json` の差し替え確認に使えます。</p>
        <div class="tag-preview" aria-label="素材候補タグ">
          {tags.slice(0, 16).map((tag) => (
            <span>{tag}</span>
          ))}
        </div>
        <button type="button" class="primary-button" onClick={gameStore.resetGame}>
          最初に戻る
        </button>
      </div>
    </section>
  );
}
