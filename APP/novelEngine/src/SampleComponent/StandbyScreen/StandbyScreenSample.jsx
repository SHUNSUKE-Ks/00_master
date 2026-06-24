import { createSignal, For, Show } from "solid-js";
import "./StandbyScreenSample.css";

const frameModes = {
  pc: {
    label: "PC",
    note: "横画面 1280x720",
  },
  mobile: {
    label: "Mobile",
    note: "Pixel 6a 縦画面 412x915",
  },
};

const standbyCharacters = [
  {
    id: "knight",
    name: "騎士",
    role: "相談する",
    src: "/assets/packs/fantasy_novel_default/characters_safe/char_knight_serious_safe.png",
    line: "準備ができたら声をかけてくれ。森の奥へ向かおう。",
    className: "is-knight",
  },
  {
    id: "heroine",
    name: "ヒロイン",
    role: "話す",
    src: "/assets/packs/fantasy_novel_default/characters_safe/char_heroine_gentle_smile_safe.png",
    line: "焚き火のそばなら、少しだけ落ち着いて話せます。",
    className: "is-heroine",
  },
  {
    id: "scout",
    name: "斥候",
    role: "情報",
    src: "/assets/packs/fantasy_novel_default/characters_safe/char_knight_gentle_smile_safe.png",
    line: "北側の道に足跡がある。出発前に確認しておくか?",
    className: "is-scout",
  },
];

function StandbyStage(props) {
  const [selected, setSelected] = createSignal(standbyCharacters[1]);

  return (
    <div class={`standby-device-frame is-${props.mode}`} aria-label="待機画面サンプル">
      <div class="standby-stage-bg" />
      <div class="standby-vignette" />

      <header class="standby-header">
        <div class="standby-player">
          <div class="standby-avatar">P</div>
          <span>Player Level</span>
          <b>5</b>
        </div>
        <div class="standby-resource-list">
          <For each={["40500", "110", "120/120"]}>
            {(value) => (
              <div>
                <i>+</i>
                <strong>{value}</strong>
              </div>
            )}
          </For>
        </div>
        <div class="standby-header-actions">
          <button type="button" aria-label="チャット">•••</button>
          <button type="button" aria-label="メール">✉</button>
          <button type="button" aria-label="メニュー">▦</button>
        </div>
      </header>

      <button class="standby-event-button" type="button">
        <span>✦</span>
        <b>イベント</b>
      </button>

      <div class="standby-party-layer">
        <For each={standbyCharacters}>
          {(character) => (
            <button
              type="button"
              class={`standby-character ${character.className}`}
              classList={{ active: selected().id === character.id }}
              onClick={() => setSelected(character)}
              aria-label={`${character.name}と話す`}
            >
              <img src={character.src} alt={character.name} />
              <span>{character.name}</span>
            </button>
          )}
        </For>
        <div class="standby-campfire" aria-hidden="true">
          <span />
        </div>
      </div>

      <Show when={selected()}>
        <div class="standby-talk-prompt">
          <div>
            <b>{selected().name}</b>
            <span>{selected().role}</span>
          </div>
          <p>{selected().line}</p>
          <button type="button">話す</button>
        </div>
      </Show>

      <nav class="standby-bottom-nav" aria-label="待機画面メニュー">
        <For each={["英傑", "バッグ", "召喚", "ショップ"]}>
          {(label) => (
            <button type="button">
              <i />
              <span>{label}</span>
            </button>
          )}
        </For>
        <button type="button" class="primary">
          <i />
          <span>冒険</span>
        </button>
      </nav>
    </div>
  );
}

export default function StandbyScreenSample() {
  const [mode, setMode] = createSignal("pc");

  return (
    <section class="standby-screen-sample">
      <div class="sample-section-heading">
        <p>Standby Screen Sample</p>
        <h1>待機画面</h1>
      </div>

      <div class="standby-screen-tabs" role="tablist" aria-label="待機画面プレビュー切替">
        {Object.entries(frameModes).map(([id, item]) => (
          <button
            type="button"
            role="tab"
            aria-selected={mode() === id}
            classList={{ active: mode() === id }}
            onClick={() => setMode(id)}
          >
            <span>{item.label}</span>
            <small>{item.note}</small>
          </button>
        ))}
      </div>

      <div class="standby-frame-wrap">
        <StandbyStage mode={mode()} />
      </div>
    </section>
  );
}

export { StandbyStage };
