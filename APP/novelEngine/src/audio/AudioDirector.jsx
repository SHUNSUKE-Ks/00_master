import { createEffect, createMemo } from "solid-js";
import library from "../data/library/dev_library.default.json";
import { gameStore } from "../stores/gameStore";
import { audioManager } from "./audioManager";

function getNovelTrack(sceneIndex) {
  const novelAssets = library.assetOrder?.NOVEL ?? {};
  const sceneTracks = [
    novelAssets.BGM,
    novelAssets.CHARACTER_BGM
  ].filter(Boolean);
  return sceneTracks[sceneIndex] ?? sceneTracks[0];
}

function getTrackForState(screen, sceneIndex) {
  if (screen === "TITLE") {
    return library.assetOrder?.TITLE?.TITLE_OP ?? library.assetOrder?.TITLE?.BGM;
  }
  if (screen === "NOVEL") {
    return getNovelTrack(sceneIndex);
  }
  return null;
}

export default function AudioDirector() {
  const targetTrack = createMemo(() => getTrackForState(gameStore.screen(), gameStore.sceneIndex()));

  createEffect(() => {
    const track = targetTrack();
    if (!track?.path) {
      audioManager.stopBgm();
      return;
    }
    audioManager.setBgm(track.path, track.usage ?? track.fileName);
  });

  return null;
}
