import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// iOS Design System Colors
const COLORS = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#007AFF',
  secondary: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  purple: '#AF52DE',
  text: {
    primary: '#1C1C1E',
    secondary: '#8E8E93',
  },
  border: '#E5E5E7',
  separator: '#C6C6C8',
};

const AgencyTripsScreen = ({ navigation, route }) => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { id: 'all', label: 'Tous', count: 45 },
    { id: 'active', label: 'Actifs', count: 12 },
    { id: 'upcoming', label: 'À venir', count: 8 },
    { id: 'completed', label: 'Terminés', count: 25 },
  ];

  useEffect(() => {
    loadTrips();
    // Si on vient du dashboard avec un filtre
    if (route.params?.filter) {
      setSelectedFilter(route.params.filter);
    }
  }, []);

  useEffect(() => {
    filterTrips();
  }, [trips, selectedFilter, searchQuery]);

  const loadTrips = async () => {
    // TODO: Charger les vraies données depuis l'API
    const mockTrips = [
      {
        id: '1',
        departure: 'Yaoundé',
        arrival: 'Douala',
        departureDate: '2025-08-05',
        departureTime: '08:00',
        arrivalTime: '12:00',
        busType: 'VIP',
        price: 18000,
        totalSeats: 50,
        bookedSeats: 35,
        status: 'active',
      },
      {
        id: '2',
        departure: 'Douala',
        arrival: 'Bafoussam',
        departureDate: '2025-08-05',
        departureTime: '15:30',
        arrivalTime: '19:00',
        busType: 'Classique',
        price: 12000,
        totalSeats: 50,
        bookedSeats: 28,
        status: 'active',
      },
      {
        id: '3',
        departure: 'Yaoundé',
        arrival: 'Ngaoundéré',
        departureDate: '2025-08-06',
        departureTime: '06:00',
        arrivalTime: '14:00',
        busType: 'VIP',
        price: 25000,
        totalSeats: 45,
        bookedSeats: 0,
        status: 'upcoming',
      },
      {
        id: '4',
        departure: 'Bamenda',
        arrival: 'Yaoundé',
        departureDate: '2025-08-03',
        departureTime: '07:00',
        arrivalTime: '12:30',
        busType: 'Classique',
        price: 15000,
        totalSeats: 50,
        bookedSeats: 50,
        status: 'completed',
      },
    ];
    setTrips(mockTrips);
  };

  const filterTrips = () => {
    let filtered = trips;

    // Filtrer par statut
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === selectedFilter);
    }

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(trip =>
        trip.departure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.arrival.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTrips(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'upcoming': return '#2196F3';
      case 'completed': return '#607D8B';
      default: return COLORS.text.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'upcoming': return 'À venir';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const handleTripAction = (trip, action) => {
    switch (action) {
      case 'edit':
        navigation.navigate('EditTrip', { tripId: trip.id });
        break;
      case 'duplicate':
        navigation.navigate('CreateTrip', { duplicateFrom: trip.id });
        break;
      case 'cancel':
        Alert.alert(
          'Annuler le trajet',
          'Êtes-vous sûr de vouloir annuler ce trajet ? Cette action est irréversible.',
          [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui, annuler', style: 'destructive', onPress: () => {
              // TODO: Implémenter l'annulation
              Alert.alert('Succès', 'Le trajet a été annulé');
            }}
          ]
        );
        break;
      case 'view':
        navigation.navigate('TripDetails', { tripId: trip.id });
        break;
    }
  };

  const TripCard = ({ trip }) => {
    const occupancyRate = (trip.bookedSeats / trip.totalSeats) * 100;
    
    return (
      <TouchableOpacity 
        style={styles.tripCard}
        onPress={() => handleTripAction(trip, 'view')}
      >
        {/* Header */}
        <View style={styles.tripHeader}>
          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Ionicons name="location" size={16} color="#FF8A00" />
              <Text style={styles.cityText}>{trip.departure}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.text.secondary} />
            </View>
            <View style={styles.cityContainer}>
              <Ionicons name="flag" size={16} color="#4CAF50" />
              <Text style={styles.cityText}>{trip.arrival}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
              {getStatusText(trip.status)}
            </Text>
          </View>
        </View>

        {/* Détails */}
        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>
                {new Date(trip.departureDate).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>{trip.departureTime} - {trip.arrivalTime}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="car" size={16} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>{trip.busType}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={16} color={COLORS.secondary} />
              <Text style={[styles.detailText, styles.priceText]}>
                {trip.price.toLocaleString()} FCFA
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color={COLORS.text.secondary} />
              <Text style={styles.detailText}>
                {trip.bookedSeats}/{trip.totalSeats} places
              </Text>
            </View>
            <View style={[styles.occupancyBar, { width: 60 }]}>
              <View 
                style={[
                  styles.occupancyFill, 
                  { 
                    width: `${occupancyRate}%`,
                    backgroundColor: occupancyRate > 80 ? COLORS.secondary : occupancyRate > 50 ? COLORS.warning : COLORS.danger
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.tripActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleTripAction(trip, 'edit')}
          >
            <Ionicons name="pencil" size={16} color={COLORS.primary} />
            <Text style={[styles.actionText, { color: COLORS.primary }]}>Modifier</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleTripAction(trip, 'duplicate')}
          >
            <Ionicons name="copy" size={16} color={COLORS.warning} />
            <Text style={[styles.actionText, { color: COLORS.warning }]}>Dupliquer</Text>
          </TouchableOpacity>
          
          {trip.status !== 'completed' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleTripAction(trip, 'cancel')}
            >
              <Ionicons name="close-circle" size={16} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Annuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes trajets</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('CreateTrip')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={20} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher par ville..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilter === filter.id && styles.filterChipActive
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter.id && styles.filterTextActive
            ]}>
              {filter.label} ({filter.count})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trips List */}
      <ScrollView
        style={styles.tripsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTrips.length > 0 ? (
          filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bus" size={64} color={COLORS.text.secondary} />
            <Text style={styles.emptyTitle}>Aucun trajet trouvé</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Essayez avec d\'autres mots-clés' : 'Créez votre premier trajet'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => navigation.navigate('CreateTrip')}
              >
                <Text style={styles.createButtonText}>Créer un trajet</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    letterSpacing: -0.4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 17,
    color: COLORS.text.primary,
    fontWeight: '400',
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  tripsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  arrowContainer: {
    marginHorizontal: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tripDetails: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  priceText: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  occupancyBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 2,
  },
  tripActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  emptySubtitle: {
    fontSize: 17,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 17,
  },
});

export default AgencyTripsScreen;
