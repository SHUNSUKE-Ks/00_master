import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SAMPLE_FORMAT = Object.freeze({
  sampleRate: 44_100,
  channels: 1,
  bitsPerSample: 16,
});

const { sampleRate: SAMPLE_RATE, channels: CHANNELS, bitsPerSample: BITS_PER_SAMPLE } = SAMPLE_FORMAT;

export const SAMPLE_DEFINITIONS = [
  ['drum_kick_rock01.wav', 'kick'],
  ['drum_snare_rock01.wav', 'snare'],
  ['drum_closed_hat_rock01.wav', 'closedHat'],
  ['drum_open_hat_rock01.wav', 'openHat'],
  ['drum_crash_rock01.wav', 'crash'],
  ['drum_tom_high_rock01.wav', 'tomHigh'],
  ['drum_tom_low_rock01.wav', 'tomLow'],
  ['drum_clap_rock01.wav', 'clap'],
  ['drum_kick_jazz01.wav', 'kick'],
  ['drum_snare_jazz01.wav', 'snare'],
  ['drum_ride_jazz01.wav', 'ride'],
  ['drum_brush_jazz01.wav', 'brush'],
  ['drum_rim_jazz01.wav', 'rim'],
  ['drum_closed_hat_jazz01.wav', 'closedHat'],
  ['drum_open_hat_jazz01.wav', 'openHat'],
  ['drum_tom_jazz01.wav', 'tomHigh'],
  ['drum_kick_dnb01.wav', 'kick'],
  ['drum_snare_dnb01.wav', 'snare'],
  ['drum_break_dnb01.wav', 'break'],
  ['drum_closed_hat_dnb01.wav', 'closedHat'],
  ['drum_open_hat_dnb01.wav', 'openHat'],
  ['bass_sub_dnb01.wav', 'sub'],
  ['perc_dnb01.wav', 'perc'],
  ['fx_dnb01.wav', 'fx'],
  ['drum_kick_hiphop01.wav', 'kick'],
  ['drum_snare_hiphop01.wav', 'snare'],
  ['drum_clap_hiphop01.wav', 'clap'],
  ['drum_closed_hat_hiphop01.wav', 'closedHat'],
  ['drum_open_hat_hiphop01.wav', 'openHat'],
  ['bass_808_hiphop01.wav', 'bass808'],
  ['perc_hiphop01.wav', 'perc'],
  ['vocal_chop_hiphop01.wav', 'vocalChop'],
];

const DURATIONS = {
  kick: 0.48,
  snare: 0.32,
  closedHat: 0.12,
  openHat: 0.34,
  crash: 0.68,
  tomHigh: 0.42,
  tomLow: 0.5,
  clap: 0.28,
  ride: 0.5,
  brush: 0.34,
  rim: 0.1,
  break: 0.42,
  sub: 0.62,
  perc: 0.2,
  fx: 0.56,
  bass808: 0.72,
  vocalChop: 0.4,
};

function hashString(value) {
  let hash = 2_166_136_261;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function envelope(time, duration, decay = 8) {
  return Math.exp((-decay * time) / duration);
}

function oscillator(frequency, time) {
  return Math.sin(2 * Math.PI * frequency * time);
}

export function synthesize(kind, filename) {
  const duration = DURATIONS[kind];
  const frameCount = Math.round(duration * SAMPLE_RATE);
  const pcm = Buffer.alloc(frameCount * 2);
  const filenameHash = hashString(filename);
  const random = createRng(filenameHash);
  const detune = ((filenameHash % 13) - 6) * 1.5;
  let previousNoise = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const time = frame / SAMPLE_RATE;
    const ratio = time / duration;
    const rawNoise = random() * 2 - 1;
    const brightNoise = rawNoise - previousNoise * 0.72;
    previousNoise = rawNoise;
    let value = 0;

    switch (kind) {
      case 'kick': {
        const frequency = 40 + 65 * Math.exp(-time * 12) + detune;
        value = oscillator(frequency, time) * envelope(time, duration, 8) * 0.92;
        value += oscillator(frequency * 1.7, time) * envelope(time, duration, 22) * 0.12;
        break;
      }
      case 'snare':
        value = brightNoise * envelope(time, duration, 12) * 0.66;
        value += oscillator(190, time) * envelope(time, duration, 17) * 0.28;
        break;
      case 'closedHat':
        value = brightNoise * envelope(time, duration, 29) * 0.5;
        break;
      case 'openHat':
        value = brightNoise * envelope(time, duration, 8) * 0.46;
        break;
      case 'crash':
        value = brightNoise * envelope(time, duration, 4) * 0.38;
        value += oscillator(2_900, time) * envelope(time, duration, 7) * 0.09;
        break;
      case 'tomHigh': {
        const frequency = 105 + 105 * Math.exp(-time * 7) + detune;
        value = oscillator(frequency, time) * envelope(time, duration, 6) * 0.72;
        break;
      }
      case 'tomLow': {
        const frequency = 54 + 62 * Math.exp(-time * 6) + detune;
        value = oscillator(frequency, time) * envelope(time, duration, 5) * 0.75;
        break;
      }
      case 'clap': {
        const burst = ratio < 0.08 || (ratio > 0.12 && ratio < 0.2) || (ratio > 0.25 && ratio < 0.33);
        value = brightNoise * envelope(time, duration, 9) * (burst ? 0.54 : 0.26);
        break;
      }
      case 'ride':
        value = brightNoise * envelope(time, duration, 6) * 0.22;
        value += (oscillator(1_780, time) + oscillator(2_230, time) + oscillator(3_170, time)) * envelope(time, duration, 5) * 0.1;
        break;
      case 'brush':
        value = rawNoise * envelope(time, duration, 10) * 0.3;
        break;
      case 'rim':
        value = oscillator(1_240, time) * envelope(time, duration, 35) * 0.65;
        value += brightNoise * envelope(time, duration, 45) * 0.16;
        break;
      case 'break':
        value = (oscillator(74, time) * 0.46 + brightNoise * 0.34) * envelope(time, duration, 7);
        break;
      case 'sub':
        value = oscillator(48, time) * envelope(time, duration, 3.2) * 0.8;
        break;
      case 'perc':
        value = (oscillator(510, time) * 0.56 + brightNoise * 0.23) * envelope(time, duration, 18);
        break;
      case 'fx': {
        const frequency = 230 + ratio * ratio * 1_650;
        value = oscillator(frequency, time) * envelope(time, duration, 2.6) * 0.4;
        value += brightNoise * envelope(time, duration, 6) * 0.2;
        break;
      }
      case 'bass808': {
        const frequency = 42 + 18 * Math.exp(-time * 4);
        value = oscillator(frequency, time) * envelope(time, duration, 2.8) * 0.85;
        value += oscillator(frequency * 2, time) * envelope(time, duration, 8) * 0.08;
        break;
      }
      case 'vocalChop': {
        const pitch = 220 + 35 * Math.sin(2 * Math.PI * 3 * time);
        value = (oscillator(pitch, time) * 0.55 + oscillator(pitch * 2, time) * 0.2 + oscillator(pitch * 3, time) * 0.1) * envelope(time, duration, 5);
        break;
      }
      default:
        throw new Error(`Unknown synthesis kind: ${kind}`);
    }

    const clamped = Math.max(-1, Math.min(1, value));
    pcm.writeInt16LE(Math.round(clamped * 32_767), frame * 2);
  }

  return pcm;
}

export function createWav(pcm) {
  const header = Buffer.alloc(44);
  const byteRate = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, '..', 'assets', 'samples');

export function buildSampleWavs() {
  return new Map(
    SAMPLE_DEFINITIONS.map(([filename, kind]) => [filename, createWav(synthesize(kind, filename))]),
  );
}

export function writeSampleWavs(targetDirectory = outputDirectory) {
  mkdirSync(targetDirectory, { recursive: true });
  const wavs = buildSampleWavs();
  for (const [filename, wav] of wavs) {
    writeFileSync(resolve(targetDirectory, filename), wav);
  }
  return wavs.size;
}

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const count = writeSampleWavs();
  console.log(`Generated ${count} deterministic WAV files in ${outputDirectory}`);
  console.log(`Format: PCM ${BITS_PER_SAMPLE}-bit, ${SAMPLE_RATE}Hz, mono`);
}
