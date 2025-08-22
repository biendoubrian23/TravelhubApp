import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';

const RealtimeTestScreen = () => {
  
  const testUserProfile = async () => {
    try {
      Alert.alert('🔍 Diagnostic', 'Vérification du profil utilisateur...');
      
      if (!user) {
        Alert.alert('❌ Erreur', 'Aucun utilisateur connecté');
        return;
      }
      
      // Import dynamique pour éviter les erreurs
      const { authService } = await import('../services/supabase');
      
      // Récupérer le profil
      const { data: profile, error } = await authService.getUserProfile(user.id);
      
      if (error) {
        Alert.alert('⚠️ Profil manquant', `Erreur: ${error.message}\n\nEssai de création automatique...`);
        
        // Tenter de créer le profil
        await authService.ensureUserProfile(user.id);
        
        // Réessayer
        const { data: newProfile } = await authService.getUserProfile(user.id);
        if (newProfile) {
          Alert.alert('✅ Succès', `Profil créé!\n\nNom: ${newProfile.full_name}\nTél: ${newProfile.phone || 'Non renseigné'}\nVille: ${newProfile.ville || 'Non renseignée'}`);
        }
      } else if (profile) {
        Alert.alert('✅ Profil trouvé', `Nom: ${profile.full_name}\nEmail: ${profile.email}\nTél: ${profile.phone || 'Non renseigné'}\nVille: ${profile.ville || 'Non renseignée'}`);
      }
      
    } catch (error) {
      Alert.alert('❌ Erreur', `Erreur profil: ${error.message}`);
    }
  };

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
        title="👤 Profil Utilisateur" 
        onPress={testUserProfile}
        color="#9C27B0"
      />
      
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
