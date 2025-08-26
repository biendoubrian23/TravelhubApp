import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const AppNavigatorSimple = () => {
  console.log('✅ AppNavigatorSimple rendering...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 Application chargée avec succès !</Text>
      <Text style={styles.subText}>Version simplifiée pour diagnostic</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default AppNavigatorSimple;
