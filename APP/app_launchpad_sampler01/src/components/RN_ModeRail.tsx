import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Mode } from '../data/RN_types';
import { interactionNowMs, logCheckpoint, measureCheckpoint } from '../diagnostics/RN_interactionDiagnostics';
import { theme } from '../theme/RN_theme';

const modes: Array<{ id: Mode; icon: string; label: string }> = [
  { id: 'pad', icon: '▦', label: 'パッド' }, { id: 'filter', icon: '◠', label: 'フィルター' }, { id: 'volume', icon: '▮▮', label: 'ボリューム' }, { id: 'fx', icon: '✦', label: 'FX' },
];
export function RN_ModeRail({ mode, accentColor, onChange }: { mode: Mode; accentColor: string; onChange: (mode: Mode) => void }) {
  return <View style={styles.rail}>{modes.map((item) => <Pressable key={item.id} style={[styles.item, mode === item.id && { borderColor: `${accentColor}55`, backgroundColor: `${accentColor}22` }]} onPress={() => {
    const startedAt = interactionNowMs(); logCheckpoint('4-1', 'mode selection received', { mode: item.id }); onChange(item.id); logCheckpoint('4-2', 'mode state update requested', { mode: item.id }); measureCheckpoint('4-3', 'mode panel render scheduled', startedAt, 'modeSwitchTargetMs', { mode: item.id });
  }}><Text style={[styles.icon, { color: mode === item.id ? accentColor : theme.textDim }]}>{item.icon}</Text><Text style={[styles.label, { color: mode === item.id ? accentColor : theme.textDim }]}>{item.label}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({ rail: { width: theme.railWidth, justifyContent: 'flex-end', gap: 8, paddingBottom: 6 }, item: { height: 76, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 6 }, icon: { fontSize: 18 }, label: { fontSize: 11, fontWeight: '600' } });
