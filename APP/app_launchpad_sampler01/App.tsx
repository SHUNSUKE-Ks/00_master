import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import templateDocument from './src/data/system_templates.json';
import type { TemplateDocument, TemplateId } from './src/data/RN_types';
import { logException, runGuardedAsync } from './src/diagnostics/RN_interactionDiagnostics';
import { RN_ScreenHome } from './src/screens/RN_ScreenHome';
import { RN_ScreenPad } from './src/screens/RN_ScreenPad';
import { useAppStore } from './src/state/useAppStore';
import { theme } from './src/theme/RN_theme';

const storageKey = 'lps01.selectedTemplateId';
const templates = (templateDocument as TemplateDocument).templates;
const isTemplateId = (value: string | null): value is TemplateId => templates.some((template) => template.id === value);

export default function App() {
  const [hydrated, setHydrated] = useState(false); const [screen, setScreen] = useState<'home' | 'pad'>('home');
  const selectedTemplateId = useAppStore((state) => state.selectedTemplateId); const selectTemplate = useAppStore((state) => state.selectTemplate);
  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId) ?? templates.find((template) => template.id === 'template_hiphop01')!, [selectedTemplateId]);
  useEffect(() => { void runGuardedAsync('3-3', 'template selection restore failed', async () => { const stored = await AsyncStorage.getItem(storageKey); if (isTemplateId(stored)) selectTemplate(stored); setHydrated(true); }, { context: { storageKey } }).then(() => setHydrated(true)); }, [selectTemplate]);
  const choose = (templateId: TemplateId) => { selectTemplate(templateId); void runGuardedAsync('3-3', 'template selection save failed', () => AsyncStorage.setItem(storageKey, templateId), { context: { storageKey, templateId } }); setScreen('pad'); };
  if (!hydrated) return <View style={styles.loading}><ActivityIndicator color={theme.accentFallback} /><StatusBar style="light" /></View>;
  return <SafeAreaView style={styles.safe}>{screen === 'home' ? <RN_ScreenHome templates={templates} selectedTemplateId={selectedTemplateId} onSelect={choose} /> : <RN_ScreenPad template={selectedTemplate} onBack={() => setScreen('home')} />}<StatusBar style="light" /></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: theme.bg }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg } });
