import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../services/supabase';

const TripDetailsScreen = ({ route, navigation }) => {
  const { trip: initialTrip } = route.params;
  const [trip, setTrip] = useState(initialTrip);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTripDetails();
  }, []);

  const loadTripDetails = async () => {
    try {
      setLoading(true);
      
      // Charger les détails complets du trajet avec toutes les réservations
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          agencies (name, logo_url, phone),
          bookings (
            id,
            passenger_name,
            passenger_phone,
            seat_number,
            booking_status,
            total_price_fcfa,
            created_at,
            booking_reference
          )
        `)
        .eq('id', initialTrip.id)
        .single();

      if (tripError) {
        console.error('Erreur lors du chargement du trajet:', tripError);
        return;
      }

      setTrip(tripData);
      setBookings(tripData.bookings || []);

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallPassenger = (phoneNumber) => {
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^+\d]/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    } else {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
    }
  };

  const handleWhatsAppPassenger = (phoneNumber, passengerName) => {
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^+\d]/g, '').replace('+', '');
      const message = `Bonjour ${passengerName}, c'est votre conducteur pour le trajet ${trip.departure_city} → ${trip.arrival_city} du ${format(new Date(trip.departure_time), 'dd/MM/yyyy à HH:mm', { locale: fr })}. J'espère que vous allez bien !`;
      const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Alert.alert('Erreur', 'WhatsApp n\'est pas installé sur cet appareil');
          }
        })
        .catch((err) => console.error('Erreur WhatsApp:', err));
    } else {
      Alert.alert('Erreur', 'Numéro de téléphone non disponible');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const confirmedBookings = bookings.filter(b => b.booking_status === 'confirmed');
  const pendingBookings = bookings.filter(b => b.booking_status === 'pending');
  const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled');

  const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price_fcfa || 0), 0);

  const renderBookingCard = (booking) => (
    <View key={booking.id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{booking.passenger_name}</Text>
          <Text style={styles.bookingReference}>#{booking.booking_reference}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${getStatusColor(booking.booking_status)}20` }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(booking.booking_status) }
          ]}>
            {getStatusText(booking.booking_status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>Siège {booking.seat_number}</Text>
        </View>
        
        {booking.passenger_phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{booking.passenger_phone}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {booking.total_price_fcfa?.toLocaleString()} FCFA
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Réservé le {format(new Date(booking.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </Text>
        </View>
      </View>

      {booking.booking_status === 'confirmed' && booking.passenger_phone && (
        <View style={styles.contactActions}>
          <TouchableOpacity
            style={[styles.contactButton, styles.callButton]}
            onPress={() => handleCallPassenger(booking.passenger_phone)}
          >
            <Ionicons name="call" size={18} color="white" />
            <Text style={styles.contactButtonText}>Appeler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.contactButton, styles.whatsappButton]}
            onPress={() => handleWhatsAppPassenger(booking.passenger_phone, booking.passenger_name)}
          >
            <Ionicons name="logo-whatsapp" size={18} color="white" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails du trajet</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tripInfo}>
          <Text style={styles.routeText}>
            {trip.departure_city} → {trip.arrival_city}
          </Text>
          <Text style={styles.tripDateTime}>
            {format(new Date(trip.departure_time), 'EEEE dd MMMM yyyy', { locale: fr })}
          </Text>
          <Text style={styles.tripTime}>
            {format(new Date(trip.departure_time), 'HH:mm', { locale: fr })} - {format(new Date(trip.arrival_time), 'HH:mm', { locale: fr })}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{confirmedBookings.length}</Text>
          <Text style={styles.statLabel}>Confirmés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingBookings.length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{cancelledBookings.length}</Text>
          <Text style={styles.statLabel}>Annulés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, styles.revenueValue]}>
            {(totalRevenue / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>FCFA</Text>
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune réservation</Text>
            <Text style={styles.emptySubtext}>
              Ce trajet n'a pas encore de passagers
            </Text>
          </View>
        ) : (
          <>
            {confirmedBookings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Passagers confirmés ({confirmedBookings.length})
                </Text>
                {confirmedBookings.map(renderBookingCard)}
              </>
            )}

            {pendingBookings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  En attente de confirmation ({pendingBookings.length})
                </Text>
                {pendingBookings.map(renderBookingCard)}
              </>
            )}

            {cancelledBookings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Réservations annulées ({cancelledBookings.length})
                </Text>
                {cancelledBookings.map(renderBookingCard)}
              </>
            )}
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
  tripInfo: {
    alignItems: 'center',
  },
  routeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  tripDateTime: {
    color: '#D1D5DB',
    fontSize: 16,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  tripTime: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  revenueValue: {
    color: '#059669',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 15,
    marginTop: 10,
  },
  bookingCard: {
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
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookingReference: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  callButton: {
    backgroundColor: '#3B82F6',
  },
  whatsappButton: {
    backgroundColor: '#059669',
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default TripDetailsScreen;
