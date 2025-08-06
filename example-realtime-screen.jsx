import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRealtimeTrips } from '../hooks/useRealtime';
import TripCard from '../components/TripCard';

const TripSearchResults = ({ departure, arrival, date }) => {
  // 🔥 Hook avec mise à jour temps réel
  const { trips, loading, error, refreshTrips } = useRealtimeTrips(departure, arrival, date);

  if (loading && trips.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Recherche des trajets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Erreur: {error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TripCard 
          trip={item} 
          onPress={() => {
            // Navigation vers la sélection de sièges
            // navigation.navigate('SeatSelection', { tripId: item.id });
          }}
        />
      )}
      refreshControl={
        <RefreshControl 
          refreshing={loading}
          onRefresh={refreshTrips}
          colors={['#007AFF']}
        />
      }
      ListEmptyComponent={
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>Aucun trajet trouvé pour cette recherche</Text>
        </View>
      }
      // Indicator de mise à jour temps réel
      ListHeaderComponent={
        trips.length > 0 ? (
          <View style={{ padding: 10, backgroundColor: '#E8F5E8', alignItems: 'center' }}>
            <Text style={{ color: '#4CAF50', fontSize: 12 }}>
              🔄 Mis à jour en temps réel
            </Text>
          </View>
        ) : null
      }
    />
  );
};

export default TripSearchResults;
