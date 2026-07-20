import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TemplateDefinition, TemplateId } from '../data/RN_types';
import { theme } from '../theme/RN_theme';
import { RN_TemplateCard } from '../components/RN_TemplateCard';

export function RN_ScreenHome({ templates, selectedTemplateId, onSelect }: { templates: TemplateDefinition[]; selectedTemplateId: TemplateId; onSelect: (id: TemplateId) => void }) {
  return <View style={styles.screen}><Text style={styles.title}>LAUNCHPAD SAMPLER</Text><Text style={styles.subtitle}>テンプレートを選択</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{templates.map((template) => <RN_TemplateCard key={template.id} template={template} selected={template.id === selectedTemplateId} onPress={() => onSelect(template.id)} />)}</ScrollView>
  </View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg, gap: 8 }, title: { color: theme.text, fontSize: 22, fontWeight: '800', letterSpacing: 5, textAlign: 'center' }, subtitle: { color: theme.textDim, fontSize: 12, marginBottom: 28 }, row: { gap: 20, paddingHorizontal: 24 } });
