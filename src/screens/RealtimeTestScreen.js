import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { tripService } from '../services/supabase';

const RealtimeTestScreen = () => {
  const [trips, setTrips] = useState([]);
  const [logs, setLogs] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const startListening = () => {
    addLog('🔄 Démarrage de l\'écoute temps réel...');
    
    // Charger les trajets initiaux
    loadTrips();
    
    // Démarrer la subscription
    const sub = tripService.subscribeToTrips(
      'Yaoundé', 
      'Douala', 
      '2025-08-03',
      (payload) => {
        addLog(`📡 Changement détecté: ${payload.eventType}`);
        console.log('Realtime payload:', payload);
        
        switch (payload.eventType) {
          case 'INSERT':
            setTrips(prev => [...prev, payload.new]);
            addLog(`➕ Nouveau trajet ajouté: ${payload.new.id}`);
            break;
          case 'UPDATE':
            setTrips(prev => prev.map(trip => 
              trip.id === payload.new.id ? payload.new : trip
            ));
            addLog(`🔄 Trajet modifié: ${payload.new.id}`);
            break;
          case 'DELETE':
            setTrips(prev => prev.filter(trip => trip.id !== payload.old.id));
            addLog(`❌ Trajet supprimé: ${payload.old.id}`);
            break;
        }
      }
    );
    
    setSubscription(sub);
    addLog('✅ Écoute active !');
  };

  const stopListening = () => {
    if (subscription) {
      tripService.unsubscribe(subscription);
      setSubscription(null);
      addLog('🛑 Écoute arrêtée');
    }
  };

  const loadTrips = async () => {
    try {
      addLog('📥 Chargement des trajets...');
      const { data, error } = await tripService.searchTrips('Yaoundé', 'Douala', '2025-08-03');
      
      if (error) {
        addLog(`❌ Erreur: ${error.message}`);
        return;
      }
      
      setTrips(data || []);
      addLog(`✅ ${data?.length || 0} trajets chargés`);
    } catch (err) {
      addLog(`❌ Erreur: ${err.message}`);
    }
  };

  useEffect(() => {
    return () => {
      // Nettoyage automatique
      if (subscription) {
        tripService.unsubscribe(subscription);
      }
    };
  }, [subscription]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Test Realtime</Text>
      
      <View style={styles.controls}>
        <Button 
          title="▶️ Démarrer l'écoute" 
          onPress={startListening}
          disabled={!!subscription}
        />
        <Button 
          title="⏹️ Arrêter l'écoute" 
          onPress={stopListening}
          disabled={!subscription}
          color="red"
        />
        <Button 
          title="🔄 Recharger" 
          onPress={loadTrips}
        />
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>
          📡 Statut: {subscription ? '🟢 Connecté' : '🔴 Déconnecté'}
        </Text>
        <Text style={styles.statusText}>
          🚌 Trajets: {trips.length}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Trajets trouvés:</Text>
        {trips.map((trip, index) => (
          <View key={trip.id} style={styles.tripItem}>
            <Text style={styles.tripText}>
              {index + 1}. {trip.departure_time} - {trip.price_fcfa} FCFA ({trip.bus_type})
            </Text>
            <Text style={styles.tripSubtext}>
              Places: {trip.available_seats}/{trip.total_seats}
            </Text>
          </View>
        ))}
        {trips.length === 0 && (
          <Text style={styles.emptyText}>Aucun trajet trouvé</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Logs en temps réel:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyText}>Aucun log pour le moment</Text>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>🔬 Instructions de test:</Text>
        <Text style={styles.instructionText}>
          1. Appuyez sur "Démarrer l'écoute"{'\n'}
          2. Ouvrez Supabase Dashboard{'\n'}
          3. Modifiez un trajet Yaoundé → Douala{'\n'}
          4. Observez les changements ici ! ✨
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  status: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  tripItem: {
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
    marginBottom: 5,
  },
  tripText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tripSubtext: {
    fontSize: 12,
    color: '#666',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
    color: '#333',
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  instructions: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default RealtimeTestScreen;
