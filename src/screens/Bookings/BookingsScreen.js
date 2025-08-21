import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { 
  Text, 
  Card, 
  Chip, 
  Button,
  Surface,
  Searchbar,
  SegmentedButtons
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../constants';
import { formatDate, formatPrice } from '../../utils/helpers';
import { useBookingsStore, useAuthStore } from '../../store';

const BookingsScreen = ({ navigation: routeNavigation }) => {
  const { bookings, loadBookings, isLoading } = useBookingsStore();
  const { user } = useAuthStore();
  const navigation = useNavigation(); // Hook pour la navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Charger les réservations seulement au premier rendu
    if (bookings.length === 0) {
      loadBookings(user);
    }
  }, [user]);

  // Rafraîchir les données seulement si on tire pour rafraîchir
  // useFocusEffect supprimé pour éviter les rechargements intempestifs
  
  const handleRefresh = () => {
    loadBookings(user);
  };

  // Adapter les données du store vers le format attendu par l'interface
  const adaptBookingData = (booking) => {
    return {
      id: booking.id,
      booking_reference: booking.id,
      trip: {
        departure_city: booking.departure,
        arrival_city: booking.arrival,
        departure_time: `${booking.date}T${booking.time}:00Z`,
        arrival_time: `${booking.date}T${booking.time}:00Z`,
        agency: { name: booking.agency },
        bus_type: booking.busType
      },
      seat_number: booking.seatNumber,
      total_price_fcfa: booking.price,
      booking_status: booking.status === 'upcoming' ? 'confirmed' : booking.status,
      payment_status: 'completed',
      created_at: booking.bookingDate || new Date().toISOString()
    };
  };

  // Adapter toutes les réservations
  const adaptedBookings = bookings.map(adaptBookingData);
  
  console.log('BookingsScreen - Nombre de réservations:', bookings.length);
  console.log('BookingsScreen - Réservations:', bookings);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'completed': return '#2196F3';
      default: return COLORS.text.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      case 'completed': return 'Terminé';
      default: return status;
    }
  };

  const filteredBookings = adaptedBookings.filter(booking => {
    const matchesSearch = booking.trip.departure_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.trip.arrival_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.booking_reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && booking.booking_status === filter;
  });

  const renderBookingCard = (booking) => (
    <Card key={booking.id} style={{ marginBottom: SPACING.md, elevation: 2 }}>
      <Card.Content>
        {/* Header avec référence et statut */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: SPACING.sm 
        }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: 'bold',
            color: COLORS.text.primary 
          }}>
            {booking.booking_reference}
          </Text>
          <Chip 
            style={{ backgroundColor: getStatusColor(booking.booking_status) + '20' }}
            textStyle={{ color: getStatusColor(booking.booking_status), fontSize: 12 }}
          >
            {getStatusText(booking.booking_status)}
          </Chip>
        </View>

        {/* Trajet */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          marginBottom: SPACING.sm 
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary }}>
              {booking.trip.departure_city}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>
              {formatDate(booking.trip.departure_time, 'DD/MM à HH:mm')}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center', paddingHorizontal: SPACING.md }}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
            <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
              {booking.trip.bus_type}
            </Text>
          </View>
          
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text.primary }}>
              {booking.trip.arrival_city}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>
              {formatDate(booking.trip.arrival_time, 'DD/MM à HH:mm')}
            </Text>
          </View>
        </View>

        {/* Informations additionnelles */}
        <Surface style={{ 
          padding: SPACING.sm, 
          borderRadius: 8,
          backgroundColor: COLORS.background,
          marginBottom: SPACING.sm 
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>Agence</Text>
              <Text style={{ fontWeight: '500', color: COLORS.text.primary }}>
                {booking.trip.agency.name}
              </Text>
            </View>
            <View>
              <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>Siège</Text>
              <Text style={{ fontWeight: '500', color: COLORS.text.primary }}>
                {booking.seat_number}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: COLORS.text.secondary }}>Prix</Text>
              <Text style={{ 
                fontWeight: 'bold', 
                fontSize: 16,
                color: COLORS.primary 
              }}>
                {formatPrice(booking.total_price_fcfa)}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('BookingDetails', { bookingId: booking.id })}
            style={{ flex: 1, marginRight: SPACING.xs }}
          >
            Détails
          </Button>
          
          {booking.booking_status === 'confirmed' && (
            <Button 
              mode="contained" 
              onPress={() => Alert.alert('E-Billet', 'Fonctionnalité de téléchargement bientôt disponible')}
              style={{ flex: 1, marginLeft: SPACING.xs }}
            >
              E-Billet
            </Button>
          )}
          
          {booking.booking_status === 'pending' && (
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Payment', { booking })}
              style={{ flex: 1, marginLeft: SPACING.xs }}
            >
              Payer
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={{ flex: 1, padding: SPACING.md }}>
        {/* Header */}
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold', 
          marginBottom: SPACING.md,
          color: COLORS.text.primary 
        }}>
          Mes réservations
        </Text>

        {/* Search */}
        <Searchbar
          placeholder="Rechercher par ville ou référence..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ marginBottom: SPACING.md }}
        />

        {/* Filter */}
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'Tous' },
            { value: 'confirmed', label: 'Confirmés' },
            { value: 'pending', label: 'En attente' },
            { value: 'completed', label: 'Terminés' },
          ]}
          style={{ marginBottom: SPACING.md }}
        />

        {/* Liste des réservations */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
          }
        >
          {filteredBookings.length > 0 ? (
            filteredBookings.map(renderBookingCard)
          ) : (
            <Card style={{ elevation: 2 }}>
              <Card.Content style={{ alignItems: 'center', padding: SPACING.xl }}>
                <Ionicons 
                  name="ticket-outline" 
                  size={64} 
                  color={COLORS.text.secondary} 
                />
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  marginTop: SPACING.md,
                  color: COLORS.text.primary 
                }}>
                  Aucune réservation
                </Text>
                <Text style={{ 
                  color: COLORS.text.secondary, 
                  textAlign: 'center',
                  marginTop: SPACING.sm,
                  marginBottom: SPACING.lg 
                }}>
                  Vous n'avez pas encore effectué de réservation.
                </Text>
                <Button 
                  mode="contained" 
                  onPress={() => {
                    // Navigation simple vers l'onglet Home
                    navigation.navigate('Home');
                  }}
                  style={{ backgroundColor: COLORS.primary }}
                >
                  Réserver un voyage
                </Button>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BookingsScreen;
