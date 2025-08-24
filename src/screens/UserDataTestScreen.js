import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/supabase';

const UserDataTestScreen = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userFromTable, setUserFromTable] = useState(null);
  const [authMetadata, setAuthMetadata] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // 1. Récupérer l'utilisateur Auth actuel
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setAuthMetadata(user?.user_metadata || {});

      if (user) {
        // 2. Récupérer depuis la table users
        const { data: tableUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.log('Erreur récupération table users:', error);
          setUserFromTable({ error: error.message });
        } else {
          setUserFromTable(tableUser);
        }
      }
    } catch (err) {
      console.error('Erreur loadUserData:', err);
    }
  };

  const testCreateUser = async () => {
    try {
      const testData = {
        nom: 'TestNom',
        prenom: 'TestPrenom',
        telephone: '+237699123456',
        ville: 'Douala',
        full_name: 'TestPrenom TestNom'
      };

      const email = `test${Date.now()}@test.com`;
      const password = 'test123456';

      console.log('🔍 Test création utilisateur avec:', testData);
      Alert.alert('Test', `Création utilisateur: ${email}\nTéléphone: ${testData.telephone}\nVille: ${testData.ville}`);

      const result = await authService.signUp(email, password, testData);
      
      if (result.error) {
        Alert.alert('Erreur', result.error.message);
        console.error('❌ Erreur inscription test:', result.error);
      } else {
        Alert.alert('Succès', 'Utilisateur créé, vérifiez les logs et les données');
        console.log('✅ Inscription test réussie:', result.data);
        // Recharger les données après 2 secondes
        setTimeout(loadUserData, 2000);
      }

      setTestResults(prev => [...prev, {
        action: 'Création utilisateur',
        input: testData,
        result: result,
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (err) {
      Alert.alert('Erreur', err.message);
      console.error('❌ Erreur test inscription:', err);
    }
  };

  const clearTests = () => {
    setTestResults([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test des Données Utilisateur</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Utilisateur Auth Actuel</Text>
        <Text style={styles.code}>
          {currentUser ? JSON.stringify({
            id: currentUser.id,
            email: currentUser.email,
            user_metadata: currentUser.user_metadata
          }, null, 2) : 'Aucun utilisateur connecté'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Métadonnées Auth</Text>
        <Text style={styles.code}>
          {JSON.stringify(authMetadata, null, 2)}
        </Text>
        <Text style={styles.analysis}>
          Téléphone: {authMetadata?.phone || 'NON TROUVÉ'}
        </Text>
        <Text style={styles.analysis}>
          Ville: {authMetadata?.ville || 'NON TROUVÉ'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Données Table Users</Text>
        <Text style={styles.code}>
          {userFromTable ? JSON.stringify(userFromTable, null, 2) : 'Aucune donnée'}
        </Text>
        {userFromTable && !userFromTable.error && (
          <>
            <Text style={styles.analysis}>
              Téléphone: {userFromTable.phone || 'NON TROUVÉ'}
            </Text>
            <Text style={styles.analysis}>
              Ville: {userFromTable.ville || 'NON TROUVÉ'}
            </Text>
          </>
        )}
      </View>

      <View style={styles.buttons}>
        <Button title="Recharger les données" onPress={loadUserData} />
        <Button title="Tester création utilisateur" onPress={testCreateUser} />
        <Button title="Effacer tests" onPress={clearTests} />
      </View>

      {testResults.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats des Tests</Text>
          {testResults.map((test, index) => (
            <View key={index} style={styles.testResult}>
              <Text style={styles.testTime}>{test.timestamp} - {test.action}</Text>
              <Text style={styles.code}>Input: {JSON.stringify(test.input, null, 2)}</Text>
              <Text style={styles.code}>Result: {JSON.stringify(test.result, null, 2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  code: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 10,
  },
  analysis: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  buttons: {
    flexDirection: 'column',
    gap: 10,
    marginVertical: 20,
  },
  testResult: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginVertical: 5,
    borderRadius: 4,
  },
  testTime: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default UserDataTestScreen;
