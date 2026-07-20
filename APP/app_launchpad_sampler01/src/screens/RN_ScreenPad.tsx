import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { Mode, PadDefinition, TemplateDefinition } from '../data/RN_types';
import { loadTemplate, trigger, unloadAll } from '../audio/RN_padPlayer';
import { RN_FaderPanel } from '../components/RN_FaderPanel';
import { RN_FxPanel } from '../components/RN_FxPanel';
import { RN_ModeRail } from '../components/RN_ModeRail';
import { RN_PadGrid } from '../components/RN_PadGrid';
import { sampleMap } from '../data/sampleMap';
import { logCheckpoint, logException } from '../diagnostics/RN_interactionDiagnostics';
import { useAppStore } from '../state/useAppStore';
import { theme } from '../theme/RN_theme';

export function RN_ScreenPad({ template, onBack }: { template: TemplateDefinition; onBack: () => void }) {
  const { width } = useWindowDimensions(); const [ready, setReady] = useState(false);
  const mode = useAppStore((state) => state.mode); const pressedPadIds = useAppStore((state) => state.pressedPadIds);
  const filterValues = useAppStore((state) => state.filterValues); const volumeValues = useAppStore((state) => state.volumeValues); const fxActive = useAppStore((state) => state.fxActive);
  const pressPad = useAppStore((state) => state.pressPad); const releasePad = useAppStore((state) => state.releasePad); const clearPressedPads = useAppStore((state) => state.clearPressedPads);
  const setMode = useAppStore((state) => state.setMode); const setFader = useAppStore((state) => state.setFader); const toggleFx = useAppStore((state) => state.toggleFx);
  useEffect(() => { let disposed = false; setReady(false); void loadTemplate(template, sampleMap).then(() => { if (!disposed) setReady(true); }).catch((error) => { if (!disposed) logException('3-3', 'pad screen audio setup failed', error, { templateId: template.id }); }); return () => { disposed = true; clearPressedPads(); unloadAll(); }; }, [clearPressedPads, template]);
  const onPressIn = (pad: PadDefinition) => { pressPad(pad.id); const activeIds = useAppStore.getState().pressedPadIds; if (activeIds.length >= 2) { logCheckpoint('2-1', 'second pad onPressIn received', { padId: pad.id, pressedPadIds: activeIds }); logCheckpoint('2-2', 'simultaneous pressed IDs confirmed', { pressedPadIds: activeIds }); logCheckpoint('2-3', 'independent player overlap requested', { padId: pad.id }); } trigger(pad.id); };
  const onPressOut = (pad: PadDefinition) => releasePad(pad.id);
  const compact = mode !== 'pad'; const contentWidth = Math.max(700, width);
  return <View style={styles.screen}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}><View style={[styles.content, { width: contentWidth }]}>
    <View style={styles.header}><Pressable onPress={() => { logCheckpoint('4-1', 'back to template selection', { templateId: template.id }); onBack(); }} hitSlop={12}><Text style={styles.chevron}>⌄</Text></Pressable><View style={[styles.templateIcon, { backgroundColor: template.accentColor }]} /><Text style={styles.templateName}>{template.name}</Text><View style={styles.spacer} /><Text style={styles.headerIcon}>⋯</Text><Text style={[styles.headerIcon, { color: template.accentColor }]}>◎</Text><Text style={styles.headerIcon}>■</Text></View>
    <View style={styles.body}><View style={styles.main}><View style={[styles.gridBox, compact && styles.gridCompact]}><RN_PadGrid pads={template.pads} pressedPadIds={pressedPadIds} enabled={ready} onPressIn={onPressIn} onPressOut={onPressOut} />{!ready && <View style={styles.loading}><ActivityIndicator color={template.accentColor} /><Text style={styles.loadingText}>音源を準備中…</Text></View>}</View>{compact && <View style={styles.panel}>{mode === 'filter' && <RN_FaderPanel variant="filter" values={filterValues} accentColor={template.accentColor} onChange={(index, value) => setFader('filter', index, value)} />}{mode === 'volume' && <RN_FaderPanel variant="volume" values={volumeValues} accentColor={template.accentColor} onChange={(index, value) => setFader('volume', index, value)} />}{mode === 'fx' && <RN_FxPanel active={fxActive} onToggle={toggleFx} />}</View>}</View><RN_ModeRail mode={mode} accentColor={template.accentColor} onChange={(next: Mode) => setMode(next)} /></View>
  </View></ScrollView></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: theme.bg }, scroll: { flexGrow: 1 }, content: { flex: 1, paddingTop: theme.screenPadTop, paddingHorizontal: theme.screenPadX, paddingBottom: 14 }, header: { height: theme.headerHeight, flexDirection: 'row', alignItems: 'center', gap: 10 }, chevron: { color: theme.textDim, fontSize: 24, paddingHorizontal: 6 }, templateIcon: { width: 32, height: 32, borderRadius: 8 }, templateName: { color: theme.text, fontSize: 16, fontWeight: '700' }, spacer: { flex: 1 }, headerIcon: { color: theme.textDim, fontSize: 18, paddingHorizontal: 5 }, body: { flex: 1, flexDirection: 'row', gap: 12, minHeight: 0 }, main: { flex: 1, gap: theme.layoutGap, minWidth: 0 }, gridBox: { flex: 1, minHeight: 312, position: 'relative' }, gridCompact: { flex: 0.46 }, panel: { flex: 0.54, minHeight: 180 }, loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c0e11bb', gap: 8, borderRadius: theme.radiusPad }, loadingText: { color: theme.textDim, fontSize: 12 } });
