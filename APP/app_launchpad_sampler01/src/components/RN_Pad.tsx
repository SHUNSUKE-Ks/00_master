import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { PadDefinition } from '../data/RN_types';
import { interactionMetrics } from '../config/RN_interactionMetrics';
import { interactionNowMs, logCheckpoint, logUnexpected, measureCheckpoint } from '../diagnostics/RN_interactionDiagnostics';
import { categoryTheme, theme } from '../theme/RN_theme';

interface PadProps { pad?: PadDefinition; pressed: boolean; enabled: boolean; onPressIn: (pad: PadDefinition) => void; onPressOut: (pad: PadDefinition) => void; }

export function RN_Pad({ pad, pressed, enabled, onPressIn, onPressOut }: PadProps) {
  const scale = useSharedValue(1);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef(0);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => () => { if (releaseTimer.current) clearTimeout(releaseTimer.current); }, []);
  useEffect(() => { scale.value = withTiming(pressed ? theme.pressedScale : 1, { duration: pressed ? 60 : theme.releaseDurationMs }); }, [pressed, scale]);

  if (!pad) {
    return <Pressable style={[styles.pad, styles.empty]} onPressIn={() => logCheckpoint('3-1', 'empty pad ignored', {})} accessibilityLabel="空のパッド"><Text style={styles.emptyDot}>·</Text></Pressable>;
  }

  const colors = categoryTheme[pad.category];
  const release = () => {
    logCheckpoint('1-5', 'onPressOut received', { padId: pad.id });
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    releaseTimer.current = setTimeout(() => {
      onPressOut(pad);
      measureCheckpoint('1-6', 'idle reset completed', startedAtRef.current, 'releaseResetTargetMs', { padId: pad.id });
    }, theme.releaseDurationMs);
  };
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width < interactionMetrics.minimumTouchTargetDp || height < interactionMetrics.minimumTouchTargetDp) {
      logUnexpected('3-2', 'touch target smaller than minimum', { padId: pad.id, width, height, minimumTouchTargetDp: interactionMetrics.minimumTouchTargetDp });
    }
  };

  return <Animated.View style={[styles.wrapper, animatedStyle]}>
    <Pressable
      style={[styles.pad, { backgroundColor: pressed ? colors.lit : colors.base }, pressed && styles.pressed]}
      disabled={!enabled}
      onLayout={onLayout}
      onPressIn={() => {
        if (releaseTimer.current) clearTimeout(releaseTimer.current);
        startedAtRef.current = interactionNowMs();
        logCheckpoint('1-1', 'onPressIn received', { padId: pad.id, category: pad.category });
        onPressIn(pad);
        logCheckpoint('1-2', 'pressed state requested', { padId: pad.id });
        measureCheckpoint('1-3', 'visual feedback scheduled', startedAtRef.current, 'pressFeedbackTargetMs', { padId: pad.id });
      }}
      onPressOut={release}
      accessibilityLabel={`${pad.label} ${colors.label}`}
    >
      <View style={[styles.icon, { borderColor: pressed ? '#fff' : colors.ink }]}><Text style={[styles.iconText, { color: pressed ? '#fff' : colors.ink }]}>{colors.icon}</Text></View>
      <Text numberOfLines={1} style={[styles.category, { color: pressed ? '#fff' : colors.ink }]}>{colors.label}</Text>
      <Text numberOfLines={1} style={[styles.label, { color: pressed ? '#fff' : colors.ink }]}>{pad.label}</Text>
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 0, minHeight: 0 }, pad: { flex: 1, minWidth: 48, minHeight: 48, borderRadius: theme.radiusPad, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderColor: '#ffffff12', overflow: 'hidden' },
  empty: { backgroundColor: theme.emptyBase, borderColor: theme.emptyInk, borderStyle: 'dashed' }, emptyDot: { color: theme.emptyInk, fontSize: 20 },
  pressed: { borderColor: '#ffffff22' }, icon: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }, iconText: { fontSize: 12, fontWeight: '700' },
  category: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 }, label: { fontSize: 10, fontWeight: '600', opacity: 0.9 },
});
