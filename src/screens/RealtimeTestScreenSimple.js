import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RealtimeTestScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Screen - Chargement réussi ✅</Text>
      <Text style={styles.subtitle}>
        Si vous voyez ce message, l'écran fonctionne correctement.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default RealtimeTestScreen;
