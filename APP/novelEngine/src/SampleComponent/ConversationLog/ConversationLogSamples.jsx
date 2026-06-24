import { createSignal, For } from "solid-js";
import "./ConversationLogSamples.css";

const timelineLines = [
  { speaker: "ベレット", text: "わっ、どこからこんなに魔物が出てきたのよ!" },
  { speaker: "楽俊", text: "奴らに構うな、早くここを抜けよう!" },
  { speaker: "アヴィア", text: "何かおかしいです。" },
  { speaker: "ベレット", text: "お嬢、私の後ろに下がって!" },
  { speaker: "ベレット", text: "お祭り〜楽しいお祭り〜\n飲むわよ〜どんどん飲むわよ〜\n蜂蜜サイコー!" },
  { speaker: "アヴィア", text: "ベレット! もう蜂蜜はダメだって言ったじゃないですか!" },
  { speaker: "ベレット", text: "今日の戴冠式には各国の君主が参加するのよ!" },
  { speaker: "楽俊", text: "それだけの人物が戴冠式のためだけに、はるばるやって来るのか?" },
  { speaker: "アヴィア", text: "ええ……" },
];

const bubbleLines = [
  {
    speaker: "レムナント",
    avatar: "R",
    text: "ははっ。\n鉱山の魔石という…",
    tone: "warm",
  },
  {
    speaker: "レムナント",
    avatar: "R",
    text: "あれこれ話していたら\nすぐに仲良くなったよ。",
    tone: "warm",
  },
  {
    speaker: "ラテル",
    avatar: "L",
    text: "魔石…ですか?",
    tone: "cool",
  },
  {
    speaker: "レムナント",
    avatar: "R",
    text: "この村の鉱山では稀に\n強力な力を持つ魔石が見つかるんだ。",
    tone: "warm",
  },
  {
    speaker: "ユースティア",
    avatar: "Y",
    text: "強力な魔石。\n確かにシェラが興味を…",
    tone: "soft",
  },
  {
    speaker: "ラテル",
    avatar: "L",
    text: "ま、まさかシェラという人は、\n魔石を探しに鉱山に入ったんですか?",
    tone: "cool",
  },
];

function SoundButton() {
  return (
    <button class="log-sound-button" type="button" aria-label="音声を再生">
      <span />
    </button>
  );
}

const logFrameModes = {
  pc: {
    label: "PC",
    note: "横画面 1280x720",
  },
  mobile: {
    label: "Mobile",
    note: "Pixel 6a 縦画面 412x915",
  },
};

function TimelineLogSample(props) {
  return (
    <section class={`sample-log-panel timeline-log-sample is-${props.mode}`} aria-label="縦ライン型 会話ログ">
      <div class="timeline-log-background" />
      <div class="timeline-log-close" aria-hidden="true">×</div>
      <div class="timeline-log-scroll">
        <For each={timelineLines}>
          {(line) => (
            <article class="timeline-log-row">
              <div class="timeline-log-name">{line.speaker}</div>
              <div class="timeline-log-marker" />
              <p>{line.text}</p>
            </article>
          )}
        </For>
      </div>
    </section>
  );
}

function BubbleLogSample(props) {
  return (
    <section class={`sample-log-panel bubble-log-sample is-${props.mode}`} aria-label="吹き出し型 会話ログ">
      <div class="bubble-log-header">
        <div>
          <h2>会話ログ</h2>
          <p><b>メイン</b> ダレフ病院の医者に会う</p>
        </div>
        <button type="button" aria-label="閉じる">×</button>
      </div>
      <div class="bubble-log-rule" />
      <div class="bubble-log-list">
        <For each={bubbleLines}>
          {(line) => (
            <article class="bubble-log-row">
              <div class={`bubble-log-avatar is-${line.tone}`}>{line.avatar}</div>
              <div class="bubble-log-card">
                <h3>{line.speaker}</h3>
                <p>{line.text}</p>
                <SoundButton />
              </div>
            </article>
          )}
        </For>
      </div>
    </section>
  );
}

export default function ConversationLogSamples() {
  const [mode, setMode] = createSignal("pc");

  return (
    <section class="conversation-log-samples">
      <div class="sample-section-heading">
        <p>Conversation Log Screens</p>
        <h1>会話ログ画面</h1>
      </div>

      <div class="conversation-log-tabs" role="tablist" aria-label="会話ログ画面プレビュー切替">
        {Object.entries(logFrameModes).map(([id, item]) => (
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

      <div class="conversation-log-grid">
        <div class={`conversation-log-screen-frame is-${mode()}`}>
          <TimelineLogSample mode={mode()} />
        </div>
        <div class={`conversation-log-screen-frame is-${mode()}`}>
          <BubbleLogSample mode={mode()} />
        </div>
      </div>
    </section>
  );
}

export { BubbleLogSample, TimelineLogSample, bubbleLines, timelineLines };
