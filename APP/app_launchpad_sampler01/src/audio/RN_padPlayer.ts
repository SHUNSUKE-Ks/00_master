import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { SampleFilename } from '../data/sampleMap';
import type { TemplateDefinition } from '../data/RN_types';
import { logCheckpoint, logException, logUnexpected, runGuardedAsync } from '../diagnostics/RN_interactionDiagnostics';

type SampleMap = Record<SampleFilename, number>;
let players = new Map<string, AudioPlayer>();

export async function loadTemplate(template: TemplateDefinition, sampleMap: SampleMap): Promise<void> {
  unloadAll();
  const nextPlayers = new Map<string, AudioPlayer>();
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    for (const pad of template.pads) {
      if (!pad.sample) continue;
      const asset = sampleMap[pad.sample as SampleFilename];
      if (!asset) throw new Error(`Static sampleMap does not contain ${pad.sample}`);
      nextPlayers.set(pad.id, createAudioPlayer(asset, { keepAudioSessionActive: true }));
    }
    players = nextPlayers;
    logCheckpoint('1-4', 'audio template loaded', { templateId: template.id, playerCount: players.size });
  } catch (error) {
    nextPlayers.forEach((player) => player.remove());
    logException('3-3', 'audio template load failed', error, { templateId: template.id });
    throw error;
  }
}

export function trigger(padId: string): void {
  const player = players.get(padId);
  if (!player) { logUnexpected('3-2', 'audio trigger ignored because player is not loaded', { padId, loadedPadIds: [...players.keys()] }); return; }
  void runGuardedAsync('3-3', 'audio trigger failed', async () => {
    await player.seekTo(0); player.play(); logCheckpoint('1-4', 'audio trigger requested', { padId, playerId: player.id });
  }, { context: { padId } });
}

export function unloadAll(): void {
  players.forEach((player, padId) => { try { player.remove(); } catch (error) { logException('3-3', 'audio player release failed', error, { padId }); } });
  players = new Map();
}

export function getLoadedPadIds(): string[] { return [...players.keys()]; }
