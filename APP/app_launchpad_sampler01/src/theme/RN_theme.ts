import type { PadCategory } from '../data/RN_types';

export const theme = {
  bg: '#0c0e11', bgElev: '#16191e', bgCard: '#1d2127', text: '#f2f3f5', textDim: '#8a919b',
  emptyBase: '#14161a', emptyInk: '#3a3f47', accentFallback: '#ff5b2b', radiusPanel: 14,
  radiusPad: 10, screenPadX: 14, screenPadTop: 10, layoutGap: 10, gridGap: 6, railWidth: 86,
  headerHeight: 44, pressedScale: 0.96, releaseDurationMs: 120,
} as const;

export const categoryTheme: Record<PadCategory, { base: string; ink: string; lit: string; icon: string; label: string }> = {
  drum: { base: '#0e2b1e', ink: '#4ade8c', lit: '#19b869', icon: '◉', label: 'ドラム' },
  bass: { base: '#0e2337', ink: '#4db3f0', lit: '#1f7fd0', icon: '∿', label: 'ベース' },
  melodic: { base: '#2a1530', ink: '#d477e8', lit: '#c34ddd', icon: '❋', label: 'メロディック' },
  fx: { base: '#331507', ink: '#ff8a4d', lit: '#e85f1e', icon: '⚡', label: 'FX' },
  perc: { base: '#1c1a38', ink: '#9c8cf0', lit: '#6f5ce0', icon: '⁘', label: 'パーカッション' },
  vocal: { base: '#08282a', ink: '#3fd6c2', lit: '#14a894', icon: '♪', label: 'ボーカル' },
};

export const templateArt: Record<string, [string, string]> = {
  template_rock01: ['#8c1f1f', '#e64545'], template_jazz01: ['#6b4a12', '#d9a441'],
  template_dnb01: ['#0b4f5e', '#2fb5a8'], template_hiphop01: ['#7a2708', '#ff5b2b'],
};
