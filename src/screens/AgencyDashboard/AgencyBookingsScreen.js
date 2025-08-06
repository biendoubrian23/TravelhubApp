import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
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

const AgencyBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const filters = [
    { id: 'all', label: 'Toutes', count: 234 },
    { id: 'confirmed', label: 'Confirmées', count: 198 },
    { id: 'pending', label: 'En attente', count: 12 },
    { id: 'cancelled', label: 'Annulées', count: 24 },
  ];

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, selectedFilter, searchQuery]);

  const loadBookings = async () => {
    // TODO: Charger les vraies données depuis l'API
    const mockBookings = [
      {
        id: '1',
        bookingRef: 'TH001234',
        passenger: {
          name: 'Jean Dupont',
          phone: '+237 690 123 456',
          email: 'jean.dupont@email.com',
        },
        trip: {
          departure: 'Yaoundé',
          arrival: 'Douala',
          date: '2025-08-05',
          time: '08:00',
          busType: 'VIP',
        },
        seats: ['A12', 'A13'],
        totalAmount: 36000,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        bookingDate: '2025-08-01T10:30:00Z',
        paymentMethod: 'Orange Money',
      },
      {
        id: '2',
        bookingRef: 'TH001235',
        passenger: {
          name: 'Marie Kamdem',
          phone: '+237 655 987 654',
          email: 'marie.kamdem@email.com',
        },
        trip: {
          departure: 'Douala',
          arrival: 'Bafoussam',
          date: '2025-08-05',
          time: '15:30',
          busType: 'Classique',
        },
        seats: ['B05'],
        totalAmount: 12000,
        paymentStatus: 'pending',
        bookingStatus: 'pending',
        bookingDate: '2025-08-04T14:15:00Z',
        paymentMethod: 'Mobile Money',
      },
      {
        id: '3',
        bookingRef: 'TH001236',
        passenger: {
          name: 'Paul Nkomo',
          phone: '+237 677 555 444',
          email: 'paul.nkomo@email.com',
        },
        trip: {
          departure: 'Yaoundé',
          arrival: 'Ngaoundéré',
          date: '2025-08-06',
          time: '06:00',
          busType: 'VIP',
        },
        seats: ['C08', 'C09'],
        totalAmount: 50000,
        paymentStatus: 'refunded',
        bookingStatus: 'cancelled',
        bookingDate: '2025-08-02T09:45:00Z',
        paymentMethod: 'Stripe',
        cancellationReason: 'Demande du client',
      },
    ];
    setBookings(mockBookings);
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filtrer par statut
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(booking => booking.bookingStatus === selectedFilter);
    }

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(booking =>
        booking.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.passenger.phone.includes(searchQuery) ||
        booking.trip.departure.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.trip.arrival.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return COLORS.text.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'refunded': return '#2196F3';
      case 'failed': return '#F44336';
      default: return COLORS.text.secondary;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'refunded': return 'Remboursé';
      case 'failed': return 'Échec';
      default: return status;
    }
  };

  const handleBookingAction = (booking, action) => {
    switch (action) {
      case 'confirm':
        Alert.alert(
          'Confirmer la réservation',
          'Voulez-vous confirmer cette réservation ?',
          [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui', onPress: () => {
              // TODO: Confirmer la réservation
              Alert.alert('Succès', 'Réservation confirmée');
            }}
          ]
        );
        break;
      case 'cancel':
        Alert.alert(
          'Annuler la réservation',
          'Voulez-vous annuler cette réservation ? Le remboursement sera traité automatiquement.',
          [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui, annuler', style: 'destructive', onPress: () => {
              // TODO: Annuler la réservation
              Alert.alert('Succès', 'Réservation annulée et remboursement en cours');
            }}
          ]
        );
        break;
      case 'contact':
        Alert.alert(
          'Contacter le passager',
          `${booking.passenger.name}\nTéléphone: ${booking.passenger.phone}\nEmail: ${booking.passenger.email}`,
          [
            { text: 'Appeler', onPress: () => {
              // TODO: Ouvrir l'application téléphone
            }},
            { text: 'Email', onPress: () => {
              // TODO: Ouvrir l'application email
            }},
            { text: 'Fermer', style: 'cancel' }
          ]
        );
        break;
      case 'view':
        navigation.navigate('BookingDetails', { bookingId: booking.id });
        break;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const BookingCard = ({ booking }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => handleBookingAction(booking, 'view')}
    >
      {/* Header */}
      <View style={styles.bookingHeader}>
        <View style={styles.bookingRefContainer}>
          <Text style={styles.bookingRef}>{booking.bookingRef}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.bookingStatus) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.bookingStatus) }]}>
              {getStatusText(booking.bookingStatus)}
            </Text>
          </View>
        </View>
        <Text style={styles.bookingDate}>{formatDateTime(booking.bookingDate)}</Text>
      </View>

      {/* Passenger Info */}
      <View style={styles.passengerInfo}>
        <View style={styles.passengerDetails}>
          <Ionicons name="person" size={16} color={COLORS.text.secondary} />
          <Text style={styles.passengerName}>{booking.passenger.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => handleBookingAction(booking, 'contact')}
        >
          <Ionicons name="call" size={16} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Trip Info */}
      <View style={styles.tripInfo}>
        <View style={styles.routeContainer}>
          <View style={styles.cityContainer}>
            <Ionicons name="location" size={14} color="#FF8A00" />
            <Text style={styles.cityText}>{booking.trip.departure}</Text>
          </View>
          <Ionicons name="arrow-forward" size={14} color={COLORS.text.secondary} />
          <View style={styles.cityContainer}>
            <Ionicons name="flag" size={14} color="#4CAF50" />
            <Text style={styles.cityText}>{booking.trip.arrival}</Text>
          </View>
        </View>
        <Text style={styles.tripDateTime}>
          {formatDate(booking.trip.date)} à {booking.trip.time}
        </Text>
      </View>

      {/* Booking Details */}
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="car" size={14} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{booking.trip.busType}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {booking.seats.length} place{booking.seats.length > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="apps" size={14} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{booking.seats.join(', ')}</Text>
          </View>
        </View>

        <View style={styles.paymentRow}>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>{booking.totalAmount.toLocaleString()} FCFA</Text>
            <Text style={styles.paymentMethod}>{booking.paymentMethod}</Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: getPaymentStatusColor(booking.paymentStatus) + '20' }]}>
            <Text style={[styles.paymentText, { color: getPaymentStatusColor(booking.paymentStatus) }]}>
              {getPaymentStatusText(booking.paymentStatus)}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {booking.bookingStatus === 'pending' && (
        <View style={styles.bookingActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleBookingAction(booking, 'confirm')}
          >
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleBookingAction(booking, 'cancel')}
          >
            <Ionicons name="close" size={16} color="#F44336" />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {booking.bookingStatus === 'cancelled' && booking.cancellationReason && (
        <View style={styles.cancellationInfo}>
          <Ionicons name="information-circle" size={16} color="#F44336" />
          <Text style={styles.cancellationReason}>
            Raison: {booking.cancellationReason}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réservations</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('BookingReports')}
          style={styles.reportButton}
        >
          <Ionicons name="analytics" size={20} color="#FF8A00" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Référence, nom, téléphone..."
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

      {/* Bookings List */}
      <ScrollView
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="ticket" size={64} color={COLORS.text.secondary} />
            <Text style={styles.emptyTitle}>Aucune réservation trouvée</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Essayez avec d\'autres mots-clés' : 'Les réservations apparaîtront ici'}
            </Text>
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
  reportButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
  bookingsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingRefContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookingRef: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookingDate: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  passengerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passengerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passengerName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  contactButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripInfo: {
    marginBottom: 16,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  tripDateTime: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontWeight: '400',
  },
  bookingDetails: {
    gap: 12,
    marginBottom: 16,
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
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flex: 1,
  },
  amount: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  paymentMethod: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 2,
    fontWeight: '400',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: COLORS.secondary,
  },
  confirmButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: COLORS.danger + '20',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontWeight: '600',
    fontSize: 15,
  },
  cancellationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.separator,
  },
  cancellationReason: {
    fontSize: 15,
    color: COLORS.danger,
    fontStyle: 'italic',
    fontWeight: '400',
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
    fontWeight: '400',
  },
});

export default AgencyBookingsScreen;
