import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const projectRoot = resolve(scriptDirectory, '..');
const metrics = JSON.parse(
  readFileSync(resolve(projectRoot, 'src', 'config', 'RN_interactionMetrics.json'), 'utf8'),
);
const cases = JSON.parse(
  readFileSync(resolve(projectRoot, 'tests', 'interaction', 'tap_interaction_cases.json'), 'utf8'),
);
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

assert(metrics.version === 1, 'Interaction metrics version must be 1');
assert(metrics.consolePrefix === '[LPS01', 'Console prefix must be [LPS01');
assert(Array.isArray(cases) && cases.length > 0, 'Interaction cases must be a non-empty array');

const requiredMetricKeys = [
  'minimumTouchTargetDp',
  'pressFeedbackTargetMs',
  'pressFeedbackWarningMs',
  'releaseResetTargetMs',
  'releaseResetToleranceMs',
  'modeSwitchTargetMs',
  'rapidTapCount',
  'rapidTapIntervalMs',
  'simultaneousPadCount',
  'unexpectedLogTargetMs',
];

for (const key of requiredMetricKeys) {
  assert(Number.isFinite(metrics.metrics?.[key]) && metrics.metrics[key] > 0, `${key} must be a positive number`);
}

assert(metrics.metrics?.pressFeedbackTargetMs <= 16.7, 'Press feedback target must fit one 60Hz frame');
assert(metrics.metrics?.pressFeedbackWarningMs <= 33.4, 'Press feedback warning must fit two 60Hz frames');
assert(metrics.metrics?.minimumTouchTargetDp >= 48, 'Touch target must be at least 48dp');
assert(metrics.metrics?.rapidTapCount >= 8, 'Rapid tap count must cover at least the required 8 taps');
assert(metrics.metrics?.simultaneousPadCount >= 2, 'Simultaneous pad count must be at least 2');

const ids = new Set();
const groups = new Set();
for (const testCase of cases) {
  assert(/^\d+-\d+[a-z]?$/.test(testCase.id), `Invalid checkpoint ID: ${String(testCase.id)}`);
  assert(!ids.has(testCase.id), `Duplicate checkpoint ID: ${testCase.id}`);
  ids.add(testCase.id);
  groups.add(String(testCase.id).split('-')[0]);
  assert(testCase.expectedLogPrefix === `[LPS01 ${testCase.id}]`, `${testCase.id}: log prefix mismatch`);
  assert(testCase.required === true, `${testCase.id}: checkpoint must be required`);
  assert(['pending', 'pass', 'fail'].includes(testCase.status), `${testCase.id}: invalid status`);
  if (testCase.metricKey) {
    assert(requiredMetricKeys.includes(testCase.metricKey), `${testCase.id}: unknown metricKey ${testCase.metricKey}`);
  }
}

for (const requiredGroup of ['1', '2', '3', '4']) {
  assert(groups.has(requiredGroup), `Missing checkpoint group ${requiredGroup}`);
}

if (errors.length > 0) {
  console.error(`[LPS01 V-E1] Interaction contract validation failed`, { errors });
  process.exitCode = 1;
} else {
  console.log('[LPS01 V-06] Interaction contract validation passed', {
    checkpoints: cases.length,
    metricKeys: requiredMetricKeys.length,
    groups: [...groups],
  });
}
