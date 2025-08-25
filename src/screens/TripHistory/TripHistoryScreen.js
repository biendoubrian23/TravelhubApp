import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useBookingsStore } from '../../store';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const TripHistoryScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { bookings, isLoading, loadBookings } = useBookingsStore();
  const [filter, setFilter] = useState('all'); // all, completed, upcoming, cancelled

  useEffect(() => {
    loadBookings();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return COLORS.success;
      case 'upcoming':
        return COLORS.primary;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.text.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'upcoming':
        return 'À venir';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'upcoming':
        return 'time';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  // Dédupliquer les réservations d'abord
  const uniqueBookings = bookings.reduce((unique, booking) => {
    // Éviter les doublons basés sur l'ID ou la référence de réservation
    const key = booking.bookingReference || booking.id;
    const existing = unique.find(b => (b.bookingReference || b.id) === key);
    
    if (!existing) {
      unique.push(booking);
    } else if (booking.syncedWithDB && !existing.syncedWithDB) {
      // Privilégier les réservations synchronisées avec la DB
      const index = unique.findIndex(b => (b.bookingReference || b.id) === key);
      unique[index] = booking;
    }
    
    return unique;
  }, []);

  const filteredBookings = uniqueBookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const FilterButton = ({ type, label, count }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === type && styles.filterButtonActive
      ]}
      onPress={() => setFilter(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === type && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const BookingCard = ({ booking }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => {
        // TODO: Naviguer vers les détails de la réservation
        Alert.alert('Détails', `Réservation ${booking.id}`);
      }}
    >
      <View style={styles.bookingHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            {booking.departure} → {booking.arrival}
          </Text>
          <Text style={styles.agencyText}>{booking.agency}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(booking.status)} 
            size={16} 
            color={getStatusColor(booking.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {getStatusText(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {new Date(booking.date).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{booking.time}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="stopwatch" size={16} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{booking.duration}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person" size={16} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>
              {booking.multiSeat 
                ? `Sièges ${booking.seatNumber}` 
                : `Siège ${booking.seatNumber}`
              }
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{booking.busType}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="card" size={16} color={COLORS.text.secondary} />
            <Text style={styles.detailText}>{booking.paymentMethod}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <Text style={styles.bookingId}>#{booking.id}</Text>
        <Text style={styles.priceText}>{booking.price.toLocaleString()} FCFA</Text>
      </View>

      {booking.status === 'cancelled' && booking.cancelReason && (
        <View style={styles.cancelInfo}>
          <Ionicons name="information-circle" size={16} color={COLORS.error} />
          <Text style={styles.cancelText}>{booking.cancelReason}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const getFilterCounts = () => {
    return {
      all: uniqueBookings.length,
      completed: uniqueBookings.filter(b => b.status === 'completed').length,
      upcoming: uniqueBookings.filter(b => b.status === 'upcoming').length,
      cancelled: uniqueBookings.filter(b => b.status === 'cancelled').length,
    };
  };

  const counts = getFilterCounts();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historique des voyages</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton type="all" label="Tous" count={counts.all} />
          <FilterButton type="upcoming" label="À venir" count={counts.upcoming} />
          <FilterButton type="completed" label="Terminés" count={counts.completed} />
          <FilterButton type="cancelled" label="Annulés" count={counts.cancelled} />
        </ScrollView>
      </View>

      {/* Liste des réservations */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadBookings} />
        }
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bus" size={64} color={COLORS.text.secondary} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'Aucun voyage' : `Aucun voyage ${getStatusText(filter).toLowerCase()}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Vous n\'avez pas encore effectué de voyage'
                : `Vous n'avez aucun voyage ${getStatusText(filter).toLowerCase()}`
              }
            </Text>
            {filter === 'all' && (
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.searchButtonText}>Rechercher un voyage</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  filterButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  filterButtonTextActive: {
    color: COLORS.surface,
  },
  
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  
  routeInfo: {
    flex: 1,
  },
  
  routeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  agencyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  
  bookingDetails: {
    marginBottom: SPACING.md,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  detailText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '30',
  },
  
  bookingId: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'monospace',
  },
  
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  cancelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
  },
  
  cancelText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  
  searchButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripHistoryScreen;
