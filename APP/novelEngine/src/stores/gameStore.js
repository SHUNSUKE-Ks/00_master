import { createMemo, createSignal } from "solid-js";
import scenario from "../data/scenario/scenario_main.json";
import { getTalk, normalizeTalk } from "../utils/scenario";

const initial = scenario.initialState ?? {
  screen: "TITLE",
  phase: "TITLE",
  sceneIndex: 0,
  talkIndex: 0
};

const [screen, setScreen] = createSignal(initial.screen ?? "TITLE");
const [phase, setPhase] = createSignal(initial.phase ?? "TITLE");
const [sceneIndex, setSceneIndex] = createSignal(initial.sceneIndex ?? 0);
const [talkIndex, setTalkIndex] = createSignal(initial.talkIndex ?? 0);

const currentScene = createMemo(() => scenario.scenes?.[sceneIndex()] ?? null);
const currentTalk = createMemo(() => normalizeTalk(getTalk(currentScene(), talkIndex())));

function startGame() {
  setScreen("NOVEL");
  setPhase("PLAYING");
  setSceneIndex(0);
  setTalkIndex(0);
}

function nextTalk() {
  const scene = currentScene();
  if (!scene) {
    setScreen("END");
    setPhase("END");
    return;
  }

  const talks = Array.isArray(scene.talk) ? scene.talk : [];
  if (talkIndex() + 1 < talks.length) {
    setTalkIndex((index) => index + 1);
    return;
  }

  if (sceneIndex() + 1 < scenario.scenes.length) {
    setSceneIndex((index) => index + 1);
    setTalkIndex(0);
    return;
  }

  setScreen("END");
  setPhase("END");
}

function resetGame() {
  setScreen(initial.screen ?? "TITLE");
  setPhase(initial.phase ?? "TITLE");
  setSceneIndex(initial.sceneIndex ?? 0);
  setTalkIndex(initial.talkIndex ?? 0);
}

export const gameStore = {
  scenario,
  screen,
  phase,
  sceneIndex,
  talkIndex,
  currentScene,
  currentTalk,
  startGame,
  nextTalk,
  resetGame
};
