# gameStore：screen/phaseで進行を駆動する

NovelEngineのruntimeは、`screen`、`phase`、`sceneIndex`、`talkIndex`を分けている。

## 要点

| Key | 意味 |
| --- | --- |
| 画面 | `TITLE`、`NOVEL`、`END`などの大きな表示 |
| 段階 | `TITLE`、`PLAYING`、`END`などの進行状態 |
| 場面 | `sceneIndex`で現在Sceneを選ぶ |
| 台詞 | `talkIndex`で現在Talkを選ぶ |
| 派生 | `currentScene`や`currentTalk`はStateから計算する |

## 読むコード

```js
import { createMemo, createSignal } from "solid-js";
import scenario from "../data/scenario/scenario_main.json";

// 状態: runtimeの現在地を小さく分けて持つ。
const [screen, setScreen] = createSignal("TITLE");
const [phase, setPhase] = createSignal("TITLE");
const [sceneIndex, setSceneIndex] = createSignal(0);
const [talkIndex, setTalkIndex] = createSignal(0);

// 派生: 表示に必要な値はStateから計算する。
const currentScene = createMemo(() => scenario.scenes?.[sceneIndex()] ?? null);
const currentTalk = createMemo(() => normalizeTalk(getTalk(currentScene(), talkIndex())));

function startGame() {
  // 遷移: TitleからNovelへ入る時は、関連Stateをまとめて初期化する。
  setScreen("NOVEL");
  setPhase("PLAYING");
  setSceneIndex(0);
  setTalkIndex(0);
}
```

## 次の会話へ進む考え方

```js
function nextTalk() {
  const scene = currentScene();
  const talks = Array.isArray(scene.talk) ? scene.talk : [];

  // 台詞: まだ同じSceneにTalkが残っているならtalkIndexだけ進める。
  if (talkIndex() + 1 < talks.length) {
    setTalkIndex((index) => index + 1);
    return;
  }

  // 分岐: choiceがあるなら勝手に進めない。
  if (scene.choice) return;

  // 場面: nextがあれば指定Sceneへ移動する。
  if (scene.next) {
    goToScene(scene.next);
    return;
  }

  // 終了: 次がなければENDへ落とす。
  setScreen("END");
  setPhase("END");
}
```

## 学習メモ

UIを直接動かすのではなく、Stateを動かす。画面はStateを読んで勝手に変わる。この形が「状態駆動」。

