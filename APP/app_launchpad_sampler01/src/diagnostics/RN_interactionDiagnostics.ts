import {
  interactionConsolePrefix,
  interactionMetrics,
  type InteractionMetricKey,
} from '../config/RN_interactionMetrics';

type DiagnosticContext = Record<string, unknown>;

interface GuardOptions<T> {
  fallback?: T;
  rethrow?: boolean;
  context?: DiagnosticContext;
}

const diagnosticsEnabled = typeof __DEV__ === 'undefined' || __DEV__;

function prefix(checkpointId: string) {
  return `${interactionConsolePrefix} ${checkpointId}]`;
}

function nowMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: 'UnknownError', message: String(error) };
}

export function logCheckpoint(
  checkpointId: string,
  label: string,
  context: DiagnosticContext = {},
) {
  if (!diagnosticsEnabled) return;
  console.log(`${prefix(checkpointId)} ${label}`, context);
}

export function logUnexpected(
  checkpointId: string,
  label: string,
  context: DiagnosticContext = {},
) {
  console.warn(`${prefix(checkpointId)} UNEXPECTED ${label}`, context);
}

export function logException(
  checkpointId: string,
  label: string,
  error: unknown,
  context: DiagnosticContext = {},
) {
  console.error(`${prefix(checkpointId)} EXCEPTION ${label}`, {
    ...context,
    error: normalizeError(error),
  });
}

export function measureCheckpoint(
  checkpointId: string,
  label: string,
  startedAtMs: number,
  metricKey: InteractionMetricKey,
  context: DiagnosticContext = {},
) {
  const elapsedMs = nowMs() - startedAtMs;
  const targetMs = interactionMetrics[metricKey];
  const measurement = { ...context, metricKey, elapsedMs, targetMs };

  if (elapsedMs > targetMs) {
    logUnexpected(checkpointId, `${label} exceeded target`, measurement);
  } else {
    logCheckpoint(checkpointId, label, measurement);
  }

  return elapsedMs;
}

export function interactionNowMs() {
  return nowMs();
}

export function runGuarded<T>(
  checkpointId: string,
  label: string,
  action: () => T,
  options: GuardOptions<T> = {},
): T | undefined {
  try {
    return action();
  } catch (error) {
    logException(checkpointId, label, error, options.context);
    if (options.rethrow) throw error;
    return options.fallback;
  }
}

export async function runGuardedAsync<T>(
  checkpointId: string,
  label: string,
  action: () => Promise<T>,
  options: GuardOptions<T> = {},
): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    logException(checkpointId, label, error, options.context);
    if (options.rethrow) throw error;
    return options.fallback;
  }
}
