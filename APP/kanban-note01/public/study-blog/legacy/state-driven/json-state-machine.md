# JSON状態機械 / 原文保管

> 作成時期: 2026-04-12 06:40
>
> 状態: 原文保管。現行採用ではない。

## 結論

「JSONは状態の定義だけ」「JS側が状態マシンとして解釈する」という分け方を基本とする。

## 全体構造

### JSON = 状態定義

```json
[
  { "id": "TITLE", "type": "SCREEN", "next": "TUTORIAL" },
  { "id": "TUTORIAL", "type": "EVENT", "event": "SHOW_TUTORIAL", "next": "NOVEL_01" },
  { "id": "NOVEL_01", "type": "SCENARIO", "scenarioId": "M_01_01_01", "next": "RESULT" },
  { "id": "RESULT", "type": "SCREEN" }
]
```

JSONには「状態と遷移」を書き、ロジックは書かない。

### JS = ステートマシン

```ts
const [currentState, setCurrentState] = useState("TITLE")

const getState = (id) => stateData.find((state) => state.id === id)

const runState = (stateId) => {
  const state = getState(stateId)

  switch (state.type) {
    case "SCREEN":
      setCurrentState(state.id)
      break
    case "EVENT":
      handleEvent(state.event)
      moveNext(state.next)
      break
    case "SCENARIO":
      startScenario(state.scenarioId)
      break
  }
}
```

## 発展案

### Choice

```json
{
  "id": "CHOICE_01",
  "type": "CHOICE",
  "choices": [
    { "label": "戦う", "next": "BATTLE" },
    { "label": "逃げる", "next": "ESCAPE" }
  ]
}
```

### Branch

```json
{
  "id": "CHECK_FLAG",
  "type": "BRANCH",
  "flag": "hasKey",
  "true": "OPEN_DOOR",
  "false": "LOCKED"
}
```

### Effect

```json
{
  "id": "GAIN_ITEM",
  "type": "EFFECT",
  "effects": ["add_sword"]
}
```

## 設計メモ

### 最小単位

- 1ステート = 1責務にする。
- `SCREEN` はUI表示、`SCENARIO` はノベル再生、`EVENT` は即時処理、`CHOICE` は分岐、`BRANCH` は条件分岐として役割を分ける。

### 接続イメージ

```text
GameManager (Reducer)
  -> StateMachine
    -> ScenarioEngine (既存JSON)
      -> UI (Screen)
```

StateMachineはシナリオの外側を制御し、`SCENARIO` typeでScenario JSONへ橋渡しする。

## 保管時の注記

ここで使う`useState`は当時の説明用記法である。現行SolidJSでは `createSignal` / `createStore` を使うため、実装へ再利用する際は現行資料で再検証する。
