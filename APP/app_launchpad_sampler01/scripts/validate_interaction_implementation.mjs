import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const projectRoot = resolve(scriptDirectory, '..');
const sourceRoot = resolve(projectRoot, 'src');
const cases = JSON.parse(readFileSync(resolve(projectRoot, 'tests', 'interaction', 'tap_interaction_cases.json'), 'utf8'));
const errors = [];

function read(relativePath) { return readFileSync(resolve(projectRoot, relativePath), 'utf8'); }
function assert(condition, message) { if (!condition) errors.push(message); }
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(resolve(directory, entry.name)) : [resolve(directory, entry.name)]);
}

const padSource = read('src/components/RN_Pad.tsx');
const gridSource = read('src/components/RN_PadGrid.tsx');
const screenSource = read('src/screens/RN_ScreenPad.tsx');
const audioSource = read('src/audio/RN_padPlayer.ts');
const allSource = walk(sourceRoot).filter((file) => /\.(ts|tsx)$/.test(file)).map((file) => readFileSync(file, 'utf8')).join('\n');

assert(/Array\.from\(\{ length: 6 \}/.test(gridSource) && /Array\.from\(\{ length: 8 \}/.test(gridSource), 'RN_PadGrid must expand all templates to a 6 by 8 grid');
assert(/onPressIn/.test(padSource) && /onPressOut/.test(padSource), 'RN_Pad must implement press and release handlers');
assert(/theme\.releaseDurationMs/.test(padSource), 'RN_Pad must use the release-duration token');
assert(/pressedPadIds/.test(screenSource) && /activeIds\.length >= 2/.test(screenSource), 'RN_ScreenPad must detect two simultaneous pressed pads');
assert(/loadTemplate\(template, sampleMap\)/.test(screenSource), 'RN_ScreenPad must load the selected template from static sampleMap');
assert(/createAudioPlayer/.test(audioSource) && /seekTo\(0\)/.test(audioSource) && /player\.play\(\)/.test(audioSource), 'RN_padPlayer must retrigger a static audio player from the beginning');
assert(/unloadAll\(\)/.test(audioSource) && /player\.remove\(\)/.test(audioSource), 'RN_padPlayer must release all players');

for (const testCase of cases) {
  assert(allSource.includes(`'${testCase.id}'`) || allSource.includes(`\"${testCase.id}\"`), `Missing implementation checkpoint ${testCase.id}`);
}

const audioImports = walk(sourceRoot).filter((file) => /\.(ts|tsx)$/.test(file) && readFileSync(file, 'utf8').includes("from 'expo-audio'"));
assert(audioImports.length === 1 && audioImports[0].endsWith('RN_padPlayer.ts'), 'expo-audio must only be imported by src/audio/RN_padPlayer.ts');

if (errors.length) {
  console.error('[LPS01 V-E8] Interaction implementation validation failed', { errors });
  process.exitCode = 1;
} else {
  console.log('[LPS01 V-08] Interaction implementation validation passed', { checkpoints: cases.length, audioImports: audioImports.length, grid: '6x8' });
}
