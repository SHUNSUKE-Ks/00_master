import { createSignal } from "solid-js";

const [currentTrack, setCurrentTrack] = createSignal(null);
const [enabled, setEnabled] = createSignal(false);
const [muted, setMutedSignal] = createSignal(false);
const [volume, setVolumeSignal] = createSignal(0.42);

let bgmAudio;
let pendingTrack = null;

function getAudio() {
  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.loop = true;
    bgmAudio.preload = "auto";
    bgmAudio.volume = volume();
    bgmAudio.muted = muted();
  }
  return bgmAudio;
}

async function tryPlay() {
  const audio = getAudio();
  if (!audio.src || muted()) return;
  try {
    await audio.play();
  } catch {
    pendingTrack = audio.src;
  }
}

function setBgm(path, label = "") {
  if (!path) return;
  const audio = getAudio();
  const nextUrl = new URL(path, window.location.origin).href;
  if (audio.src === nextUrl) return;

  audio.pause();
  audio.src = nextUrl;
  audio.currentTime = 0;
  pendingTrack = nextUrl;
  setCurrentTrack({ path, label });

  if (enabled()) {
    tryPlay();
  }
}

async function unlock() {
  setEnabled(true);
  if (pendingTrack || getAudio().src) {
    await tryPlay();
  }
}

function stopBgm() {
  if (!bgmAudio) return;
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
}

function pauseBgm() {
  if (!bgmAudio) return;
  bgmAudio.pause();
}

function resumeBgm() {
  setEnabled(true);
  tryPlay();
}

function setMuted(nextMuted) {
  setMutedSignal(nextMuted);
  if (bgmAudio) bgmAudio.muted = nextMuted;
  if (!nextMuted && enabled()) {
    tryPlay();
  }
}

function setVolume(nextVolume) {
  const clamped = Math.min(1, Math.max(0, nextVolume));
  setVolumeSignal(clamped);
  if (bgmAudio) bgmAudio.volume = clamped;
}

export const audioManager = {
  currentTrack,
  enabled,
  muted,
  volume,
  setBgm,
  unlock,
  stopBgm,
  pauseBgm,
  resumeBgm,
  setMuted,
  setVolume
};
