import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/RN_theme';
const names = ['Stutter', 'Stutter', 'Stutter', 'Stutter', 'Flanger', 'Flanger', 'Gater', 'Gater', 'Autofilter', 'Autofilter', 'Autofilter', 'Stopper', 'Stopper', 'Delay', 'Delay', 'Delay'];
const icons: Record<string, string> = { Stutter: '◔', Flanger: '≈', Gater: '▥', Autofilter: '◒', Stopper: '⏷', Delay: '⊗' };
export function RN_FxPanel({ active, onToggle }: { active: boolean[]; onToggle: (index: number) => void }) {
  return <View style={styles.panel}>{names.map((name, index) => <Pressable key={`${name}-${index}`} style={[styles.card, active[index] && styles.lit]} onPress={() => onToggle(index)}><Text style={[styles.icon, active[index] && styles.litText]}>{icons[name]}</Text><Text style={[styles.label, active[index] && styles.litText]}>{name}</Text></Pressable>)}</View>;
}
const styles = StyleSheet.create({ panel: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderRadius: theme.radiusPanel, borderWidth: 1, borderColor: '#ffffff0d', backgroundColor: theme.bgElev, padding: 14 }, card: { width: '11.6%', minWidth: 48, flexGrow: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: '#ffffff0d' }, lit: { backgroundColor: '#e85f1e', borderColor: 'transparent' }, icon: { fontSize: 22, color: '#ff8a4d' }, label: { fontSize: 9, color: '#ff8a4d', fontWeight: '700' }, litText: { color: '#fff' } });
