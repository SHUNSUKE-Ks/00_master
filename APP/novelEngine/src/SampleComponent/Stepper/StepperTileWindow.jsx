import { For } from "solid-js";
import "./StepperTileWindow.css";

const defaultChoices = [
  { key: "A", text: "鵲かごを外せ！" },
  { key: "B", text: "鵲かごを飛ばせ！" },
];

const defaultLocks = [
  {
    id: "mental-lock-1",
    label: "Mental Lock #2",
    tone: "danger",
    x: 29,
    y: 52,
    angle: 48,
  },
  {
    id: "mental-lock-2",
    label: "Mental Lock #2",
    tone: "danger",
    x: 42,
    y: 52,
    angle: 48,
  },
];

const defaultConnectors = [
  { id: "top-link", type: "vertical", x: 30.5, y: 24, height: 28 },
  { id: "left-link", type: "vertical", x: 24.5, y: 45, height: 52 },
  { id: "right-link", type: "vertical", x: 37.5, y: 45, height: 52 },
];

function DiamondLock(props) {
  const tone = () => props.tone || "neutral";

  return (
    <div
      class={`stepper-lock is-${tone()}`}
      style={{
        "--lock-x": `${props.x}%`,
        "--lock-y": `${props.y}%`,
        "--lock-angle": `${props.angle || 45}deg`,
      }}
    >
      <div class="stepper-lock-gem">
        <span class="stepper-lock-hole" />
      </div>
      <div class="stepper-lock-label">{props.label}</div>
    </div>
  );
}

function Connector(props) {
  return (
    <span
      class={`stepper-connector is-${props.type || "vertical"}`}
      style={{
        "--connector-x": `${props.x}%`,
        "--connector-y": `${props.y}%`,
        "--connector-height": `${props.height || 28}%`,
      }}
    />
  );
}

export default function StepperTileWindow(props) {
  const choices = () => props.choices || defaultChoices;
  const locks = () => props.locks || defaultLocks;
  const connectors = () => props.connectors || defaultConnectors;

  return (
    <section
      class="stepper-tile-window"
      aria-label={props.ariaLabel || "Sample stepper tile window"}
    >
      <div class="stepper-choice-stack">
        <For each={choices()}>
          {(choice) => (
            <button class="stepper-choice" type="button" onClick={choice.onSelect}>
              <span class="stepper-choice-key">{choice.key}.</span>
              <span>{choice.text}</span>
            </button>
          )}
        </For>
      </div>

      <div class="stepper-stage" aria-hidden="true">
        <For each={connectors()}>{(connector) => <Connector {...connector} />}</For>

        <div class="stepper-red-pin is-top" />
        <DiamondLock label="避雷針で雷を逸らした" tone="success" x={30} y={30} angle={48} />

        <div class="stepper-branch" />
        <For each={locks()}>{(lock) => <DiamondLock {...lock} />}</For>

        <span class="stepper-terminal is-left" />
        <span class="stepper-terminal is-right" />
      </div>
    </section>
  );
}

export { defaultChoices, defaultConnectors, defaultLocks };
