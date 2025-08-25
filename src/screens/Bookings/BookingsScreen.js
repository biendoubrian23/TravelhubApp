import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Alert, Dimensions } from 'react-native';
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
import logger from '../../utils/logger';
import { getResponsiveFontSize, getScreenType } from '../../utils/responsive';

const BookingsScreen = ({ navigation: routeNavigation }) => {
  const { bookings, loadBookings, isLoading } = useBookingsStore();
  const { user } = useAuthStore();
  const navigation = useNavigation(); // Hook pour la navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Charger les réservations quand l'utilisateur change ou au premier rendu
    if (user?.id) {
      logger.info('🔄 BookingsScreen - useEffect triggered, user:', user?.email);
      loadBookings(user);
    }
  }, [user]);

  // Force refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      logger.info('📱 BookingsScreen - Screen focused, reloading bookings');
      if (user?.id) {
        loadBookings(user);
      }
    }, [user])
  );

  // Rafraîchir les données seulement si on tire pour rafraîchir
  
  const handleRefresh = async () => {
    logger.info('🔄 BookingsScreen - Manual refresh triggered');
    if (user?.id) {
      loadBookings(user);
    }
  };

  // Adapter les données du store vers le format attendu par l'interface
  const adaptBookingData = (booking) => {
    // Protection contre les objets undefined ou null
    if (!booking) {
      console.warn('BookingsScreen - Réservation undefined reçue');
      return null;
    }

    // Fonction helper pour formater les dates de manière sécurisée
    const safeFormatDateTime = (date, time, fallbackDate = null) => {
      try {
        if (date && time) {
          // Si nous avons date et time séparés
          return `${date}T${time}:00Z`;
        } else if (date) {
          // Si nous avons seulement une date (pourrait être déjà un datetime)
          const dateObj = new Date(date);
          return dateObj.toISOString();
        }
        // Fallback vers la date fournie ou nouvelle date
        return fallbackDate || new Date().toISOString();
      } catch (error) {
        console.warn('BookingsScreen - Erreur formatage date:', error, { date, time });
        return fallbackDate || new Date().toISOString();
      }
    };

    return {
      id: booking.id || 'unknown',
      booking_reference: booking.bookingReference || booking.booking_reference || `TH${booking.id?.slice(-6).toUpperCase()}` || 'UNKNOWN',
      trip: {
        departure_city: booking.departure || booking.departure_city || 'Ville inconnue',
        arrival_city: booking.arrival || booking.arrival_city || 'Ville inconnue',
        departure_time: safeFormatDateTime(
          booking.departure_time || booking.date, 
          booking.time || booking.trip?.heure_dep,
          booking.created_at
        ),
        arrival_time: safeFormatDateTime(
          booking.arrival_time || booking.date, 
          booking.trip?.heure_arr || booking.trip?.heure_dep, // Utiliser heure_arr du trip, fallback sur heure_dep
          booking.created_at
        ),
        agency: { name: booking.agency?.name || booking.agency || 'TravelHub' },
        bus_type: booking.bus_type || booking.busType || 'standard'
      },
      seat_number: booking.seat_number || booking.seatNumber || 'N/A',
      total_price_fcfa: booking.total_price_fcfa || booking.price || 0,
      booking_status: booking.booking_status || (booking.status === 'upcoming' ? 'confirmed' : (booking.status || 'pending')),
      payment_status: booking.payment_status || booking.paymentStatus || 'completed',
      created_at: safeFormatDateTime(booking.created_at || booking.bookingDate)
    };
  };

  // Adapter toutes les réservations avec filtrage des valeurs null
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  logger.info('BookingsScreen - Type de bookings:', typeof bookings, 'Is Array:', Array.isArray(bookings), 'Length:', safeBookings.length);
  
  const adaptedBookings = safeBookings
    .map(adaptBookingData)
    .filter(booking => booking !== null);

  const filteredBookings = adaptedBookings.filter(booking => {
    // Protection supplémentaire contre les objets mal formés
    if (!booking || !booking.trip) {
      logger.warn('BookingsScreen - Réservation ou trip manquant:', booking);
      return false;
    }

    const departure = booking.trip.departure_city || '';
    const arrival = booking.trip.arrival_city || '';
    const reference = booking.booking_reference || '';
    
    const matchesSearch = departure.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         arrival.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reference.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    
    // Les réservations annulées vont dans "Terminés"
    if (filter === 'completed') {
      return matchesSearch && (booking.booking_status === 'completed' || booking.booking_status === 'cancelled');
    }
    
    return matchesSearch && booking.booking_status === filter;
  });
  
  console.log('BookingsScreen - Nombre de réservations:', bookings.length);
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
            <View style={{ flex: 1, marginRight: SPACING.xs }}>
              <Text style={{ 
                fontSize: getResponsiveFontSize('tiny'), 
                color: COLORS.text.secondary 
              }}>
                Agence
              </Text>
              <Text style={{ 
                fontWeight: '500', 
                color: COLORS.text.primary,
                fontSize: getResponsiveFontSize('small'),
                numberOfLines: 1,
                ellipsizeMode: 'tail'
              }}>
                {booking.trip.agency.name}
              </Text>
            </View>
            <View style={{ flex: 0.6, marginRight: SPACING.xs, alignItems: 'center' }}>
              <Text style={{ 
                fontSize: getResponsiveFontSize('tiny'), 
                color: COLORS.text.secondary 
              }}>
                Siège
              </Text>
              <Text style={{ 
                fontWeight: '500', 
                color: COLORS.text.primary,
                fontSize: getResponsiveFontSize('small'),
                numberOfLines: 1,
                textAlign: 'center'
              }}>
                {booking.seat_number}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ 
                fontSize: getResponsiveFontSize('tiny'), 
                color: COLORS.text.secondary 
              }}>
                Prix
              </Text>
              <Text style={{ 
                fontWeight: 'bold', 
                fontSize: getResponsiveFontSize('medium'),
                color: COLORS.primary,
                numberOfLines: 1,
                textAlign: 'right'
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
