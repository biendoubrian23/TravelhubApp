import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

const RealtimeTestScreen = () => {
  
  const testImports = async () => {
    try {
      // Test import dynamique pour éviter les erreurs de module
      const { bookingService } = await import('../services/bookingService');
      const { supabase } = await import('../services/supabaseClient');
      
      Alert.alert('✅ Succès', 'Tous les imports fonctionnent correctement');
      console.log('BookingService:', typeof bookingService);
      console.log('Supabase:', typeof supabase);
    } catch (error) {
      Alert.alert('❌ Erreur', `Problème d'import: ${error.message}`);
      console.error('Erreur import:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Screen - Diagnostic</Text>
      
      <Button 
        title="🧪 Tester les Imports" 
        onPress={testImports}
        color="#2196F3"
      />
      
      <Text style={styles.subtitle}>
        Appuyez sur le bouton pour tester si les services sont accessibles.
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
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RealtimeTestScreen;
