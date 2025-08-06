import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Surface, Chip } from 'react-native-paper';
import { supabase } from '../services/supabase';

const SupabaseTestScreen = () => {
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [agencies, setAgencies] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test de base
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('agencies')
        .select('*')
        .limit(3);

      if (agenciesError) {
        console.error('Erreur agencies:', agenciesError);
        setConnectionStatus('error');
        Alert.alert('Erreur', `Problème de connexion: ${agenciesError.message}`);
        return;
      }

      // Test des voyages
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          agencies (name)
        `)
        .limit(5);

      if (tripsError) {
        console.error('Erreur trips:', tripsError);
        setConnectionStatus('partial');
      } else {
        setTrips(tripsData);
      }

      setAgencies(agenciesData);
      setConnectionStatus('success');
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setConnectionStatus('error');
      Alert.alert('Erreur', 'Impossible de se connecter à Supabase');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'testing': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'success': return '✅ Connecté';
      case 'error': return '❌ Erreur';
      case 'testing': return '🔄 Test en cours...';
      default: return '⚪ Non testé';
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <Card style={{ marginBottom: 16 }}>
        <Card.Title title="Test Connectivité Supabase" />
        <Card.Content>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Chip 
              style={{ backgroundColor: getStatusColor() }}
              textStyle={{ color: 'white' }}
            >
              {getStatusText()}
            </Chip>
          </View>
          
          <Button 
            mode="contained" 
            onPress={testConnection}
            loading={loading}
            disabled={loading}
          >
            Retester la connexion
          </Button>
        </Card.Content>
      </Card>

      {agencies.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Card.Title title={`Agences trouvées (${agencies.length})`} />
          <Card.Content>
            {agencies.map((agency) => (
              <Surface key={agency.id} style={{ padding: 12, marginBottom: 8, borderRadius: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{agency.name}</Text>
                <Text style={{ color: '#666', marginTop: 4 }}>{agency.description}</Text>
                <Text style={{ color: '#2196F3', marginTop: 4 }}>📞 {agency.phone}</Text>
                <Text style={{ color: '#4CAF50', marginTop: 4 }}>
                  ⭐ {agency.rating}/5 ({agency.total_reviews} avis)
                </Text>
              </Surface>
            ))}
          </Card.Content>
        </Card>
      )}

      {trips.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Card.Title title={`Voyages trouvés (${trips.length})`} />
          <Card.Content>
            {trips.map((trip) => (
              <Surface key={trip.id} style={{ padding: 12, marginBottom: 8, borderRadius: 8 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {trip.departure_city} → {trip.arrival_city}
                </Text>
                <Text style={{ color: '#666', marginTop: 4 }}>
                  Agence: {trip.agencies?.name || 'Non définie'}
                </Text>
                <Text style={{ color: '#FF9800', marginTop: 4 }}>
                  Type: {trip.bus_type} | {trip.available_seats}/{trip.total_seats} places
                </Text>
                <Text style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: 4 }}>
                  {trip.price_fcfa.toLocaleString()} FCFA
                </Text>
              </Surface>
            ))}
          </Card.Content>
        </Card>
      )}

      <Card style={{ marginBottom: 32 }}>
        <Card.Title title="Informations de Configuration" />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>URL Supabase:</Text>{'\n'}
            {process.env.EXPO_PUBLIC_SUPABASE_URL || 'Non configuré'}
          </Text>
          <Text>
            <Text style={{ fontWeight: 'bold' }}>Clé Publique:</Text>{'\n'}
            {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 
              `${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
              'Non configuré'
            }
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default SupabaseTestScreen;
