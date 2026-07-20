import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TemplateDefinition } from '../data/RN_types';
import { templateArt, theme } from '../theme/RN_theme';

export function RN_TemplateCard({ template, selected, onPress }: { template: TemplateDefinition; selected: boolean; onPress: () => void }) {
  const [dark, bright] = templateArt[template.id] ?? [theme.bgCard, template.accentColor];
  return <Pressable onPress={onPress} style={[styles.card, selected && { borderColor: template.accentColor, borderWidth: 2 }]} accessibilityLabel={`${template.name} テンプレート`}>
    {selected && <View style={styles.badge}><Text style={styles.badgeText}>前回</Text></View>}
    <View style={[styles.art, { backgroundColor: dark }]}><View style={[styles.artSpot, { backgroundColor: bright }]} /><View style={[styles.artCircle, { borderColor: '#ffffff33' }]} /></View>
    <Text style={styles.name}>{template.name}</Text><Text style={styles.description}>{template.pads.slice(0, 4).map((pad) => pad.label).join(' / ')}{`\n${template.pads.length} sounds`}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({ card: { width: 190, height: 230, borderRadius: 18, padding: 18, backgroundColor: theme.bgCard, borderWidth: 1, borderColor: '#ffffff14', overflow: 'hidden' }, art: { height: 96, borderRadius: 12, marginBottom: 14, overflow: 'hidden' }, artSpot: { position: 'absolute', width: 145, height: 145, borderRadius: 100, right: -35, bottom: -62, opacity: 0.7 }, artCircle: { position: 'absolute', width: 50, height: 50, borderRadius: 25, left: 22, top: 18, borderWidth: 8 }, name: { color: theme.text, fontSize: 17, fontWeight: '700' }, description: { color: theme.textDim, fontSize: 11, marginTop: 4, lineHeight: 16 }, badge: { position: 'absolute', zIndex: 1, right: 10, top: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: '#000c' }, badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' } });
