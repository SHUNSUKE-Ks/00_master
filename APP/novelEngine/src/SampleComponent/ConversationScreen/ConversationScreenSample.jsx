import { createSignal, Show } from "solid-js";
import "./ConversationScreenSample.css";

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

function ConversationStage(props) {
  const isMobile = () => props.mode === "mobile";

  return (
    <div
      class={`conversation-device-frame is-${props.mode}`}
      aria-label={`${frameModes[props.mode].label} conversation screen sample`}
    >
      <div class="conversation-stage-bg" />
      <div class="conversation-vignette" />

      <div class="conversation-character-layer">
        <img
          class="conversation-character is-left"
          src="/assets/packs/fantasy_novel_default/characters_safe/char_heroine_gentle_smile_safe.png"
          alt="ヒロイン立ち絵"
        />
        <img
          class="conversation-character is-right"
          src="/assets/packs/fantasy_novel_default/characters_safe/char_knight_serious_safe.png"
          alt="騎士立ち絵"
        />
      </div>

      <Show when={!isMobile()}>
        <aside class="conversation-side-menu" aria-label="会話画面メニュー">
          <button type="button">Log</button>
          <button type="button">Auto</button>
          <button type="button">Skip</button>
          <button type="button" class="is-menu">MENU</button>
        </aside>
      </Show>

      <div class="conversation-dialogue-panel">
        <div class="conversation-speaker">
          <span>エファ</span>
          <small>********************</small>
        </div>
        <p>
          「ああそうだ、先週ここで冒険者さんの鞄を拾ったんだ。
          <br />
          それでホールンに世界地図を買い取ってもらったんだよね」
        </p>
        <div class="conversation-next">◆</div>
      </div>

      <Show when={isMobile()}>
        <nav class="conversation-mobile-menu" aria-label="モバイル会話画面メニュー">
          <button type="button">Log</button>
          <button type="button">Auto</button>
          <button type="button">Skip</button>
          <button type="button">Menu</button>
        </nav>
      </Show>
    </div>
  );
}

export default function ConversationScreenSample() {
  const [mode, setMode] = createSignal("pc");

  return (
    <section class="conversation-screen-sample">
      <div class="sample-section-heading">
        <p>Conversation Screen Sample</p>
        <h1>会話画面</h1>
      </div>

      <div class="conversation-screen-tabs" role="tablist" aria-label="会話画面プレビュー切替">
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

      <div class="conversation-frame-wrap">
        <ConversationStage mode={mode()} />
      </div>
    </section>
  );
}

export { ConversationStage };
