import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
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

const BookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // TODO: Charger les réservations depuis Supabase
      // Données de test pour l'instant
      const mockBookings = [
        {
          id: '1',
          booking_reference: 'TH001234',
          trip: {
            departure_city: 'Douala',
            arrival_city: 'Yaoundé',
            departure_time: '2025-08-05T06:00:00Z',
            arrival_time: '2025-08-05T09:30:00Z',
            agency: { name: 'Voyage Express' },
            bus_type: 'VIP'
          },
          seat_number: '12A',
          total_price_fcfa: 4500,
          booking_status: 'confirmed',
          payment_status: 'completed',
          created_at: '2025-08-03T10:00:00Z'
        },
        {
          id: '2',
          booking_reference: 'TH001235',
          trip: {
            departure_city: 'Yaoundé',
            arrival_city: 'Douala',
            departure_time: '2025-08-07T14:00:00Z',
            arrival_time: '2025-08-07T17:30:00Z',
            agency: { name: 'Garantie Express' },
            bus_type: 'Classique'
          },
          seat_number: '15B',
          total_price_fcfa: 3500,
          booking_status: 'pending',
          payment_status: 'pending',
          created_at: '2025-08-03T15:30:00Z'
        }
      ];
      setBookings(mockBookings);
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredBookings = bookings.filter(booking => {
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
              onPress={() => {/* TODO: Télécharger le billet */}}
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
            <RefreshControl refreshing={loading} onRefresh={loadBookings} />
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
                  onPress={() => navigation.navigate('Home')}
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
