# App.jsx：modeで画面を切り替える

`App.jsx`はNovelEngine全体の入口。まず「どの制作画面を開いているか」を`mode`というStateにする。

## 要点

| Key | 意味 |
| --- | --- |
| 状態 | `mode()`が現在の画面名 |
| 選択 | buttonで`setMode()`を呼ぶ |
| 表示 | `Switch`と`Match`で表示Componentを分ける |
| 境界 | Engine本体、DevStudio、SRPGStudio、Sampleを分離する |

## 読むコード

```jsx
import { createSignal, Match, Switch } from "solid-js";

export default function App() {
  // 状態: 今どの大画面を開いているか。
  const [mode, setMode] = createSignal("engine");

  return (
    <>
      <div class="app-mode-switch" aria-label="App mode">
        {/* 選択: buttonはStateを書き換えるだけにする。 */}
        <button
          classList={{ active: mode() === "engine" }}
          onClick={() => setMode("engine")}
        >
          Engine
        </button>
      </div>

      {/* 表示: Stateに応じてComponentを差し替える。 */}
      <Switch>
        <Match when={mode() === "engine"}>
          <GameManager />
        </Match>
        <Match when={mode() === "devstudio"}>
          <DevStudio />
        </Match>
      </Switch>
    </>
  );
}
```

## 覚える型

```txt
状態: createSignalで現在地を持つ
選択: UIはset関数を呼ぶ
表示: Switch/Matchで画面を分岐する
境界: 大きな機能はComponent単位で隔離する
```

