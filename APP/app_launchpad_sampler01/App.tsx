import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LAUNCHPAD SAMPLER</Text>
      <Text style={styles.subtitle}>T1 scaffold ready</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#f2f3f5',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  subtitle: {
    color: '#8a919b',
    fontSize: 12,
    marginTop: 8,
  },
});
