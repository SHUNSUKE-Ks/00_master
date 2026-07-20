import { StyleSheet, View } from 'react-native';
import type { PadDefinition } from '../data/RN_types';
import { theme } from '../theme/RN_theme';
import { RN_Pad } from './RN_Pad';

interface PadGridProps { pads: PadDefinition[]; pressedPadIds: string[]; enabled: boolean; onPressIn: (pad: PadDefinition) => void; onPressOut: (pad: PadDefinition) => void; }

export function RN_PadGrid({ pads, pressedPadIds, enabled, onPressIn, onPressOut }: PadGridProps) {
  const byCoordinate = new Map(pads.map((pad) => [`${pad.row}:${pad.column}`, pad]));
  return <View style={styles.grid}>
    {Array.from({ length: 6 }, (_, row) => <View key={row} style={styles.row}>
      {Array.from({ length: 8 }, (_, column) => {
        const pad = byCoordinate.get(`${row}:${column}`);
        return <RN_Pad key={`${row}:${column}`} pad={pad} pressed={Boolean(pad && pressedPadIds.includes(pad.id))} enabled={enabled} onPressIn={onPressIn} onPressOut={onPressOut} />;
      })}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({ grid: { flex: 1, minHeight: 312, gap: theme.gridGap }, row: { flex: 1, flexDirection: 'row', gap: theme.gridGap } });
