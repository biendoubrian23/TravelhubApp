import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store';

const DriverTripsHistory = ({ navigation }) => {
  const { user } = useAuthStore();
  const [trips, setTrips] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    completedTrips: 0,
  });

  const periods = [
    { key: 'week', label: '7 jours', days: 7 },
    { key: 'month', label: '30 jours', days: 30 },
    { key: 'quarter', label: '90 jours', days: 90 },
  ];

  const loadTripsHistory = async () => {
    try {
      setLoading(true);
      
      const selectedDays = periods.find(p => p.key === selectedPeriod)?.days || 7;
      const startDate = subDays(new Date(), selectedDays);
      
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          agencies (name),
          bookings (
            id,
            passenger_name,
            booking_status,
            total_price_fcfa
          )
        `)
        .eq('driver_id', user?.id)
        .gte('departure_time', startDate.toISOString())
        .order('departure_time', { ascending: false });

      if (tripsError) {
        console.error('Erreur lors du chargement de l\'historique:', tripsError);
        return;
      }

      setTrips(tripsData || []);
      
      // Calculer les statistiques
      const totalTrips = tripsData?.length || 0;
      const completedTrips = tripsData?.filter(trip => 
        new Date(trip.departure_time) < new Date()
      ).length || 0;
      
      const totalPassengers = tripsData?.reduce((total, trip) => {
        return total + (trip.bookings?.filter(b => b.booking_status === 'confirmed').length || 0);
      }, 0) || 0;
      
      const totalRevenue = tripsData?.reduce((total, trip) => {
        const tripRevenue = trip.bookings?.reduce((sum, booking) => {
          return booking.booking_status === 'confirmed' ? sum + (booking.total_price_fcfa || 0) : sum;
        }, 0) || 0;
        return total + tripRevenue;
      }, 0) || 0;

      setStats({
        totalTrips,
        totalPassengers,
        totalRevenue,
        completedTrips,
      });

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripsHistory();
  }, [selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripsHistory();
    setRefreshing(false);
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'HH:mm', { locale: fr });
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMM', { locale: fr });
  };

  const isCompleted = (trip) => {
    return new Date(trip.departure_time) < new Date();
  };

  const getCompletionRate = () => {
    if (stats.totalTrips === 0) return 0;
    return Math.round((stats.completedTrips / stats.totalTrips) * 100);
  };

  const renderStatCard = (title, value, icon, gradient, subtitle = '') => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradient}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={20} color="white" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
      </LinearGradient>
    </View>
  );

  const renderTripCard = (trip) => {
    const confirmedBookings = trip.bookings?.filter(b => b.booking_status === 'confirmed') || [];
    const tripRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price_fcfa || 0), 0);
    const completed = isCompleted(trip);
    
    return (
      <TouchableOpacity
        key={trip.id}
        style={[styles.tripCard, completed && styles.completedTripCard]}
        onPress={() => navigation.navigate('TripDetails', { trip })}
        activeOpacity={0.7}
      >
        <View style={styles.tripCardHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              {trip.departure_city} → {trip.arrival_city}
            </Text>
            <Text style={styles.dateText}>
              {formatDate(trip.departure_time)} • {formatTime(trip.departure_time)}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.completedText}>Terminé</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tripCardBody}>
          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Ionicons name="people-outline" size={16} color="#6B7280" />
              <Text style={styles.metricText}>
                {confirmedBookings.length} passager{confirmedBookings.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metric}>
              <Ionicons name="cash-outline" size={16} color="#6B7280" />
              <Text style={styles.metricText}>
                {tripRevenue.toLocaleString()} FCFA
              </Text>
            </View>
          </View>

          <View style={styles.busInfo}>
            <Ionicons name="bus-outline" size={16} color="#6B7280" />
            <Text style={styles.busText}>{trip.bus_type} • {trip.available_seats} places</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historique des trajets</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.selectedPeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.selectedPeriodButtonText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {renderStatCard(
            'Trajets',
            stats.totalTrips,
            'calendar',
            ['#3B82F6', '#1D4ED8']
          )}
          {renderStatCard(
            'Passagers',
            stats.totalPassengers,
            'people',
            ['#10B981', '#059669']
          )}
        </View>
        
        <View style={styles.statsRow}>
          {renderStatCard(
            'Revenus',
            `${(stats.totalRevenue / 1000).toFixed(0)}K`,
            'cash',
            ['#8B5CF6', '#7C3AED'],
            'FCFA'
          )}
          {renderStatCard(
            'Taux complet',
            `${getCompletionRate()}%`,
            'trending-up',
            ['#F59E0B', '#D97706']
          )}
        </View>
      </View>

      {/* Trips List */}
      <ScrollView
        style={styles.tripsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement de l'historique...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun trajet dans cette période</Text>
            <Text style={styles.emptySubtext}>
              Sélectionnez une autre période pour voir vos trajets
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {trips.length} trajet{trips.length > 1 ? 's' : ''} sur les {periods.find(p => p.key === selectedPeriod)?.label}
            </Text>
            {trips.map(renderTripCard)}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  periodButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 6,
  },
  statTitle: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.9,
  },
  statSubtitle: {
    color: 'white',
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  tripsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  completedTripCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  tripCardBody: {
    gap: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  busText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default DriverTripsHistory;
