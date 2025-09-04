import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';

const PassengersList = ({ navigation }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPassengers, setFilteredPassengers] = useState([]);
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    loadPassengers();
  }, [activeTab]);

  const loadPassengers = async () => {
    setLoading(true);
    try {
      // Récupérer les trajets de l'utilisateur connecté en fonction de l'onglet actif
      let query = supabase
        .from('trips')
        .select(`
          id, 
          departure_city, 
          arrival_city, 
          departure_time,
          bookings (
            id, 
            passenger_name, 
            passenger_phone, 
            seat_number,
            booking_status, 
            created_at
          )
        `);
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      
      if (activeTab === 'today') {
        // Trajets d'aujourd'hui
        query = query.gte('departure_time', today).lt('departure_time', tomorrow);
      } else if (activeTab === 'upcoming') {
        // Trajets à venir
        query = query.gte('departure_time', tomorrow);
      } else {
        // Tous les trajets
        query = query.order('departure_time', { ascending: false }).limit(50);
      }
      
      // Les conducteurs voient tous les trajets
      const { data, error } = await query;
      
      if (error) {
        console.error('Erreur lors du chargement des trajets:', error);
        return;
      }
      
      // Transformer les données pour obtenir une liste plate de passagers
      const allPassengers = [];
      data.forEach(trip => {
        const confirmedBookings = trip.bookings?.filter(b => b.booking_status === 'confirmed') || [];
        confirmedBookings.forEach(booking => {
          allPassengers.push({
            ...booking,
            trip_id: trip.id,
            departure_city: trip.departure_city,
            arrival_city: trip.arrival_city,
            departure_time: trip.departure_time
          });
        });
      });
      
      setPassengers(allPassengers);
      setFilteredPassengers(allPassengers);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    if (!text.trim()) {
      setFilteredPassengers(passengers);
      return;
    }
    
    const filtered = passengers.filter(passenger =>
      passenger.passenger_name.toLowerCase().includes(text.toLowerCase()) ||
      passenger.passenger_phone.includes(text) ||
      passenger.seat_number.toString().includes(text) ||
      passenger.departure_city.toLowerCase().includes(text.toLowerCase()) ||
      passenger.arrival_city.toLowerCase().includes(text.toLowerCase())
    );
    
    setFilteredPassengers(filtered);
  };

  const handlePassengerPress = (passenger) => {
    Alert.alert(
      `Passager: ${passenger.passenger_name}`,
      `Siège: ${passenger.seat_number}\nTéléphone: ${passenger.passenger_phone}\nTrajet: ${passenger.departure_city} → ${passenger.arrival_city}\nDépart: ${format(parseISO(passenger.departure_time), 'dd/MM/yyyy HH:mm', { locale: fr })}`,
      [{ text: 'OK' }]
    );
  };

  const renderPassengerItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.passengerCard}
        onPress={() => handlePassengerPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.passengerInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.passenger_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{item.passenger_name}</Text>
            <Text style={styles.passengerRoute}>
              {item.departure_city} → {item.arrival_city}
            </Text>
            <Text style={styles.passengerDate}>
              {format(parseISO(item.departure_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </Text>
          </View>
        </View>
        
        <View style={styles.seatContainer}>
          <Text style={styles.seatNumber}>Siège {item.seat_number}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* En-tête */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Liste des passagers</Text>
        
        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un passager..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Onglets */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'today' && styles.activeTab]}
            onPress={() => setActiveTab('today')}
          >
            <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
              Aujourd'hui
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
              À venir
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              Tous
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Liste des passagers */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Chargement des passagers...</Text>
        </View>
      ) : filteredPassengers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>
            Aucun passager trouvé
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? "Essayez une autre recherche" : "Aucun passager pour cette période"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPassengers}
          renderItem={renderPassengerItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          onRefresh={loadPassengers}
          refreshing={loading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  passengerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  passengerRoute: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  passengerDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  seatContainer: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  seatNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
});

export default PassengersList;
