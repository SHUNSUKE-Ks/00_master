import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildSampleWavs, SAMPLE_DEFINITIONS, SAMPLE_FORMAT } from './gen_placeholder_wavs.mjs';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const projectRoot = resolve(scriptDirectory, '..');
const samplesDirectory = resolve(projectRoot, 'assets', 'samples');
const failures = [];

function checkpoint(id, label, context = {}) {
  console.log(`[LPS01 ${id}] ${label}`, context);
}

function fail(id, label, context = {}) {
  failures.push({ id, label, context });
  console.error(`[LPS01 ${id}] ${label}`, context);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function inspectWav(buffer) {
  return {
    riff: buffer.toString('ascii', 0, 4),
    wave: buffer.toString('ascii', 8, 12),
    formatCode: buffer.readUInt16LE(20),
    channels: buffer.readUInt16LE(22),
    sampleRate: buffer.readUInt32LE(24),
    bitsPerSample: buffer.readUInt16LE(34),
    declaredDataBytes: buffer.readUInt32LE(40),
    actualDataBytes: buffer.length - 44,
  };
}

function runNodeCheck(id, label, relativeScript, args = []) {
  const result = spawnSync(process.execPath, [resolve(projectRoot, relativeScript), ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    fail(id, `${label} failed`, { status: result.status, stdout: result.stdout, stderr: result.stderr });
  } else {
    checkpoint(id, label, { output: result.stdout.trim() });
  }
}

const generatedA = buildSampleWavs();
const generatedB = buildSampleWavs();
const expectedNames = SAMPLE_DEFINITIONS.map(([filename]) => filename).sort();
const diskNames = readdirSync(samplesDirectory).filter((name) => name.endsWith('.wav')).sort();

if (expectedNames.length === 32 && JSON.stringify(expectedNames) === JSON.stringify(diskNames)) {
  checkpoint('V-01', 'WAV inventory matched', { files: diskNames.length });
} else {
  fail('V-E2', 'WAV inventory mismatch', { expectedNames, diskNames });
}

let formatFailures = 0;
let deterministicFailures = 0;
let diskMismatchFailures = 0;
const hashes = new Set();

for (const filename of expectedNames) {
  const first = generatedA.get(filename);
  const second = generatedB.get(filename);
  const diskPath = resolve(samplesDirectory, filename);

  if (!first || !second || !existsSync(diskPath)) {
    diskMismatchFailures += 1;
    continue;
  }

  const disk = readFileSync(diskPath);
  const wav = inspectWav(disk);
  const validFormat =
    wav.riff === 'RIFF' &&
    wav.wave === 'WAVE' &&
    wav.formatCode === 1 &&
    wav.channels === SAMPLE_FORMAT.channels &&
    wav.sampleRate === SAMPLE_FORMAT.sampleRate &&
    wav.bitsPerSample === SAMPLE_FORMAT.bitsPerSample &&
    wav.declaredDataBytes === wav.actualDataBytes;

  if (!validFormat) formatFailures += 1;
  if (!first.equals(second)) deterministicFailures += 1;
  if (!first.equals(disk)) diskMismatchFailures += 1;
  hashes.add(sha256(disk));
}

if (formatFailures === 0) {
  checkpoint('V-02', 'All WAV headers passed', SAMPLE_FORMAT);
} else {
  fail('V-E3', 'WAV format failures detected', { formatFailures });
}

if (deterministicFailures === 0 && diskMismatchFailures === 0 && hashes.size === 32) {
  checkpoint('V-03', 'WAV determinism and uniqueness passed', {
    deterministicFailures,
    diskMismatchFailures,
    uniqueHashes: hashes.size,
  });
} else {
  fail('V-E4', 'WAV determinism or uniqueness failed', {
    deterministicFailures,
    diskMismatchFailures,
    uniqueHashes: hashes.size,
  });
}

if (existsSync(resolve(samplesDirectory, 'LICENSES.md'))) {
  checkpoint('V-04', 'WAV license record exists');
} else {
  fail('V-E5', 'WAV license record is missing');
}

runNodeCheck('V-05', 'Template validation passed', 'scripts/validate_templates.mjs');
runNodeCheck('V-06', 'Interaction contract validation passed', 'scripts/validate_interaction_contract.mjs');
runNodeCheck('V-07', 'TypeScript validation passed', 'node_modules/typescript/bin/tsc', ['--noEmit']);
runNodeCheck('V-08', 'Interaction implementation validation passed', 'scripts/validate_interaction_implementation.mjs');

if (failures.length > 0) {
  console.error('[LPS01 V-END] Project validation failed', { failures });
  process.exitCode = 1;
} else {
  checkpoint('V-END', 'Project validation passed', { checks: 8 });
}
