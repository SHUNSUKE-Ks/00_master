import interactionContract from './RN_interactionMetrics.json';

export const interactionMetrics = interactionContract.metrics;
export const interactionConsolePrefix = interactionContract.consolePrefix;
export type InteractionMetricKey = keyof typeof interactionMetrics;
