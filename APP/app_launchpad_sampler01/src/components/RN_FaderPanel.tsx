import { PanResponder, StyleSheet, View } from 'react-native';
import { theme } from '../theme/RN_theme';

export function RN_FaderPanel({ variant, values, accentColor, onChange }: { variant: 'filter' | 'volume'; values: number[]; accentColor: string; onChange: (index: number, value: number) => void }) {
  return <View style={styles.panel}>{values.map((value, index) => <Fader key={index} variant={variant} value={value} accentColor={accentColor} onChange={(next) => onChange(index, next)} />)}</View>;
}
function Fader({ variant, value, accentColor, onChange }: { variant: 'filter' | 'volume'; value: number; accentColor: string; onChange: (value: number) => void }) {
  const responder = PanResponder.create({ onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderGrant: (event) => update(event.nativeEvent.locationY), onPanResponderMove: (event) => update(event.nativeEvent.locationY) });
  const update = (locationY: number) => onChange(Math.max(0, Math.min(1, 1 - locationY / 170)));
  return <View style={styles.fader} {...responder.panHandlers}><View style={[styles.track, variant === 'filter' && styles.filterTrack]}>{variant === 'volume' && <View style={[styles.fill, { height: `${value * 100}%`, backgroundColor: accentColor }]} />}</View>{variant === 'filter' && <View style={[styles.knob, { bottom: `${value * 100}%`, backgroundColor: accentColor }]} />}</View>;
}
const styles = StyleSheet.create({ panel: { flex: 1, flexDirection: 'row', gap: 14, alignItems: 'stretch', justifyContent: 'space-around', borderRadius: theme.radiusPanel, borderWidth: 1, borderColor: '#ffffff0d', backgroundColor: theme.bgElev, padding: 14 }, fader: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 30 }, track: { width: 36, height: '100%', minHeight: 150, borderRadius: 8, backgroundColor: '#0a0c0e', justifyContent: 'flex-end', padding: 5 }, filterTrack: { width: 10, padding: 0 }, fill: { borderRadius: 5 }, knob: { position: 'absolute', width: 40, height: 14, borderRadius: 4, left: '50%', marginLeft: -20 } });
