import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
  StatusBar,
  FlatList,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';

const { width, height } = Dimensions.get('window');

const DriverDashboard = ({ navigation }) => {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [passengersModalVisible, setPassengersModalVisible] = useState(false);
  const [passengers, setPassengers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPassengers, setFilteredPassengers] = useState([]);

  // Générer les 20 prochains jours pour le carrousel
  const generateCarouselDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  const carouselDays = generateCarouselDays();

  const loadDriverTrips = async () => {
    try {
      setLoading(true);
      
      // Debug : Vérifier l'ID du conducteur connecté
      console.log('👤 Conducteur connecté:', {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.user_metadata?.role || user?.role
      });
      
      // Récupérer TOUS les trajets du jour sélectionné
      const { data: allTripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          agencies (name, logo_url),
          bookings (
            id,
            passenger_name,
            passenger_phone,
            seat_number,
            booking_status,
            total_price_fcfa
          )
        `)
        .gte('departure_time', format(selectedDate, 'yyyy-MM-dd'))
        .lt('departure_time', format(addDays(selectedDate, 1), 'yyyy-MM-dd'))
        .order('departure_time');

      if (tripsError) {
        console.error('Erreur lors du chargement des trajets:', tripsError);
        return;
      }

      // Récupérer les informations des conducteurs séparément
      let tripsWithDrivers = allTripsData || [];
      
      console.log('🔍 Debug - Trajets bruts récupérés:', tripsWithDrivers.map(trip => ({
        id: trip.id,
        driver_id: trip.driver_id,
        route: `${trip.departure_city} → ${trip.arrival_city}`
      })));
      
      if (tripsWithDrivers.length > 0) {
        const driverIds = [...new Set(tripsWithDrivers.map(trip => trip.driver_id).filter(Boolean))];
        console.log('🔍 Driver IDs trouvés:', driverIds);
        console.log('🔍 ID utilisateur connecté:', user?.id);
        
        if (driverIds.length > 0) {
          const { data: driversData, error: driversError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .in('id', driverIds);

          console.log('🔍 Conducteurs trouvés:', driversData);
          console.log('🔍 Erreur conducteurs:', driversError);

          if (!driversError && driversData) {
            // Associer les conducteurs aux trajets
            tripsWithDrivers = tripsWithDrivers.map(trip => ({
              ...trip,
              driver: driversData.find(driver => driver.id === trip.driver_id) || null
            }));
          }
        }
      }

      // Debug : Afficher tous les trajets avec leurs conducteurs
      console.log('🚛 Trajets du jour:', tripsWithDrivers?.map(trip => ({
        id: trip.id,
        route: `${trip.departure_city} → ${trip.arrival_city}`,
        driver_id: trip.driver_id,
        driver_name: trip.driver?.full_name,
        isMyTrip: trip.driver_id === user?.id
      })));

      setTrips(tripsWithDrivers || []);
      
      // Calculer les statistiques sur TOUS les trajets (pas de restriction)
      const allTrips = tripsWithDrivers || [];
      console.log(`✅ Trajets trouvés: ${allTrips.length}`);
      
      const totalPassengersCount = allTrips.reduce((total, trip) => {
        return total + (trip.bookings?.filter(b => b.booking_status === 'confirmed').length || 0);
      }, 0);
      
      setTotalPassengers(totalPassengersCount);
      setTodayTrips(allTrips.length);

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTripPassengers = async (tripId) => {
    try {
      const { data: passengersData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('trip_id', tripId)
        .eq('booking_status', 'confirmed')
        .order('seat_number');

      if (error) {
        console.error('Erreur lors du chargement des passagers:', error);
        return;
      }

      setPassengers(passengersData || []);
      setFilteredPassengers(passengersData || []);
      setSearchQuery(''); // Réinitialiser la recherche
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const filterPassengers = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredPassengers(passengers);
      return;
    }

    const filtered = passengers.filter(passenger => 
      passenger.passenger_name.toLowerCase().includes(query.toLowerCase()) ||
      passenger.passenger_phone.includes(query) ||
      passenger.seat_number.toString().includes(query)
    );
    setFilteredPassengers(filtered);
  };

  const handleTripPress = async (trip) => {
    // Permettre l'accès à tous les trajets sans restriction
    console.log('🔍 Clic sur trajet:', {
      tripId: trip.id,
      route: `${trip.departure_city} → ${trip.arrival_city}`,
      driverName: trip.driver?.full_name || 'Non défini'
    });

    console.log('✅ Ouverture de la liste des passagers');
    setSelectedTrip(trip);
    await loadTripPassengers(trip.id);
    setPassengersModalVisible(true);
  };

  useEffect(() => {
    loadDriverTrips();
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverTrips();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm', { locale: fr });
  };

  const StatCard = ({ icon, value, title, colors }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={colors}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={24} color="white" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </View>
  );

  const renderTripCard = (trip) => {
    const confirmedBookings = trip.bookings?.filter(b => b.booking_status === 'confirmed') || [];
    
    return (
      <TouchableOpacity
        key={trip.id}
        style={styles.tripCard}
        onPress={() => handleTripPress(trip)}
        activeOpacity={0.7}
      >
        <View style={styles.tripHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {trip.departure_city} → {trip.arrival_city}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(trip.departure_time)} - {formatTime(trip.arrival_time)}
            </Text>
          </View>
          <View style={styles.passengerBadge}>
            <Ionicons 
              name="people" 
              size={16} 
              color="white" 
            />
            <Text style={styles.passengerCount}>
              {confirmedBookings.length}
            </Text>
          </View>
        </View>
        
        <View style={styles.tripDetails}>
          <View style={styles.busInfo}>
            <Ionicons 
              name="bus" 
              size={16} 
              color="#4F46E5" 
            />
            <Text style={styles.busType}>
              {trip.bus_type === 'vip' ? 'VIP' : 'Classique'}
            </Text>
          </View>
          
          <Text style={styles.priceText}>
            {trip.price_fcfa?.toLocaleString()} FCFA
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCalendarDay = ({ item: day, index }) => {
    const isSelected = isSameDay(day, selectedDate);
    const isToday = isSameDay(day, new Date());
    
    return (
      <TouchableOpacity
        style={[
          styles.calendarDay,
          isSelected && styles.selectedDay,
          isToday && styles.todayDay
        ]}
        onPress={() => setSelectedDate(day)}
      >
        <Text style={[
          styles.dayNumber,
          isSelected && styles.selectedDayText,
          isToday && styles.todayDayText
        ]}>
          {format(day, 'd')}
        </Text>
        <Text style={[
          styles.dayName,
          isSelected && styles.selectedDayText,
          isToday && styles.todayDayText
        ]}>
          {format(day, 'E', { locale: fr })}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPassengersModal = () => (
    <Modal
      visible={passengersModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setPassengersModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Passagers - {selectedTrip?.departure_city} → {selectedTrip?.arrival_city}
          </Text>
          <TouchableOpacity
            onPress={() => setPassengersModalVisible(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un passager..."
              value={searchQuery}
              onChangeText={filterPassengers}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => filterPassengers('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.passengersList}>
          {filteredPassengers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Aucun passager trouvé' : 'Aucun passager confirmé'}
              </Text>
            </View>
          ) : (
            filteredPassengers.map((passenger, index) => (
              <View key={passenger.id} style={styles.passengerCard}>
                <View style={styles.passengerInfo}>
                  <View style={styles.passengerDetails}>
                    <Text style={styles.passengerName}>{passenger.passenger_name}</Text>
                    <Text style={styles.passengerPhone}>{passenger.passenger_phone}</Text>
                  </View>
                </View>
                
                <View style={styles.seatBadge}>
                  <Text style={styles.seatText}>{passenger.seat_number}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.driverName}>
              {user?.user_metadata?.nom || 'Conducteur'} {user?.user_metadata?.prenom || ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('DriverNotifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="white" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="calendar"
            value={todayTrips}
            title="Trajets aujourd'hui"
            colors={['#3B82F6', '#1D4ED8']}
          />
          <StatCard
            icon="people"
            value={totalPassengers}
            title="Passagers total"
            colors={['#10B981', '#059669']}
          />
        </View>
      </LinearGradient>

      {/* Calendar Carousel */}
      <View style={styles.calendarContainer}>
        <FlatList
          data={carouselDays}
          renderItem={renderCalendarDay}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContent}
          keyExtractor={(item) => item.toISOString()}
          getItemLayout={(data, index) => ({
            length: 70,
            offset: 70 * index,
            index,
          })}
          initialScrollIndex={0}
        />
      </View>

      {/* Trips Section */}
      <ScrollView
        style={styles.tripsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.tripsHeader}>
          <Text style={styles.tripsTitle}>
            Trajets du {format(selectedDate, 'dd MMMM', { locale: fr })}
          </Text>
          <Text style={styles.tripsSubtitle}>
            {trips.length} trajet{trips.length > 1 ? 's' : ''} au total
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucun trajet prévu</Text>
            <Text style={styles.emptySubtitle}>
              Profitez de votre journée de repos !
            </Text>
          </View>
        ) : (
          <View style={styles.tripsContainer}>
            {trips.map(trip => renderTripCard(trip))}
          </View>
        )}
      </ScrollView>

      {/* Passengers Modal */}
      {renderPassengersModal()}
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
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '400',
  },
  driverName: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    marginTop: -15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  calendarContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  calendarDay: {
    width: 60,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#4F46E5',
  },
  todayDay: {
    backgroundColor: '#F59E0B',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  selectedDayText: {
    color: 'white',
  },
  todayDayText: {
    color: 'white',
  },
  tripsList: {
    flex: 1,
    backgroundColor: 'white',
  },
  tripsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tripsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  tripsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
    marginTop: 8,
    textAlign: 'center',
  },
  tripsContainer: {
    padding: 20,
    gap: 16,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  passengerBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  passengerCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  passengersList: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  seatBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  seatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  passengerPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
});

export default DriverDashboard;
