import { create } from 'zustand';
import type { Mode, TemplateId } from '../data/RN_types';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

interface AppState {
  selectedTemplateId: TemplateId; mode: Mode; filterValues: number[]; volumeValues: number[]; fxActive: boolean[]; pressedPadIds: string[];
  selectTemplate: (templateId: TemplateId) => void; setMode: (mode: Mode) => void;
  setFader: (kind: 'filter' | 'volume', index: number, value: number) => void; toggleFx: (index: number) => void;
  pressPad: (padId: string) => void; releasePad: (padId: string) => void; clearPressedPads: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  selectedTemplateId: 'template_hiphop01', mode: 'pad',
  filterValues: [0.3, 0.52, 0.18, 0.44, 0.36, 0.64, 0.26, 0.4],
  volumeValues: [0.82, 0.78, 0.9, 0.7, 0.84, 0.64, 0.74, 0.58],
  fxActive: Array.from({ length: 16 }, () => false), pressedPadIds: [],
  selectTemplate: (selectedTemplateId) => set({ selectedTemplateId, pressedPadIds: [] }),
  setMode: (mode) => set({ mode }),
  setFader: (kind, index, value) => set((state) => {
    const key = kind === 'filter' ? 'filterValues' : 'volumeValues'; const values = [...state[key]];
    if (index < 0 || index >= values.length) return state; values[index] = clamp(value); return { [key]: values };
  }),
  toggleFx: (index) => set((state) => {
    if (index < 0 || index >= state.fxActive.length) return state; const fxActive = [...state.fxActive]; fxActive[index] = !fxActive[index]; return { fxActive };
  }),
  pressPad: (padId) => set((state) => state.pressedPadIds.includes(padId) ? state : { pressedPadIds: [...state.pressedPadIds, padId] }),
  releasePad: (padId) => set((state) => ({ pressedPadIds: state.pressedPadIds.filter((id) => id !== padId) })),
  clearPressedPads: () => set({ pressedPadIds: [] }),
}));
