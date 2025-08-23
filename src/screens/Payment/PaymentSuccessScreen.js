import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { useBookingsStore, useAuthStore } from '../../store';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { booking, trip, selectedSeats, totalPrice, paymentMethod } = route.params;
  const { addBooking } = useBookingsStore();
  const { user } = useAuthStore();
  
  // État pour éviter la création multiple de réservations avec une clé unique
  const tripId = trip?.id;
  const userId = user?.id;
  const bookingKey = `${tripId}_${userId}`;
  
  // Utiliser une Map globale pour éviter les doublons entre différentes instances
  if (!global.processedBookings) {
    global.processedBookings = new Map();
  }
  
  const [bookingCreated, setBookingCreated] = useState(
    global.processedBookings.has(bookingKey)
  );

  // Animations
  const [checkAnimation] = useState(new Animated.Value(0));
  const [fadeAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animation d'entrée
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 600,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(checkAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    const addBookingToHistory = async () => {
      // Vérifier si la réservation a déjà été créée pour éviter les doublons
      if (bookingCreated || global.processedBookings.has(bookingKey)) {
        console.log('🛑 Réservation déjà créée, pas de duplication pour:', bookingKey);
        return;
      }

      // Marquer comme en cours de traitement immédiatement
      setBookingCreated(true);
      global.processedBookings.set(bookingKey, Date.now());
      
      console.log('🚀 Création de la réservation après confirmation de paiement pour:', bookingKey);

      // Ajouter la réservation à l'historique et à Supabase
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];
      const formattedTime = currentDate.toTimeString().substring(0, 5);
      
      // Formatage correct des sièges
      let formattedSeats = 'A1'; // Valeur par défaut
      if (selectedSeats && Array.isArray(selectedSeats)) {
        formattedSeats = selectedSeats.map(seat => {
          if (typeof seat === 'object' && seat !== null) {
            return seat.seat_number || seat.number || 'Siège';
          }
          return seat;
        }).join(', ');
      } else if (selectedSeats && typeof selectedSeats === 'string') {
        formattedSeats = selectedSeats;
      }

      // Créer un objet de réservation avec toutes les vérifications pour éviter les erreurs
      const newBooking = {
        departure: trip?.departure_city || trip?.ville_depart || 'Départ',
        arrival: trip?.arrival_city || trip?.ville_arrivee || 'Arrivée',
        date: formattedDate, // Utiliser la date actuelle pour éviter les problèmes
        time: formattedTime, // Utiliser l'heure actuelle pour éviter les problèmes
        price: totalPrice || 0,
        status: 'upcoming',
        busType: trip?.bus_type || 'VIP',
        agency: trip?.agency?.name || 'TravelHub',
        seatNumber: formattedSeats,
        selectedSeats: selectedSeats, // Ajouter les sièges sélectionnés
        paymentMethod: paymentMethod || 'Paiement simulé',
        duration: trip?.duration || '3h 30min',
        trip: trip || {}, // Fournir un objet vide si trip est undefined
        tripId: trip?.id || null, // Utiliser tripId au lieu de trip_id pour correspondre au service
        totalPrice: totalPrice || 0 // Ajouter totalPrice pour le service
      };

      try {
        // Passer l'utilisateur pour sauvegarder dans Supabase si connecté
        const savedBooking = await addBooking(newBooking, user);
        console.log('✅ Réservation créée avec succès après paiement:', savedBooking);
        console.log('📋 Nouvelle réservation:', JSON.stringify(newBooking, null, 2));
      } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de la réservation:', error);
        // En cas d'erreur, permettre un nouvel essai
        setBookingCreated(false);
        global.processedBookings.delete(bookingKey);
      }
    };

    addBookingToHistory();
  }, []);

  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      const now = new Date();
      return {
        date: now.toLocaleDateString('fr-FR'),
        time: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
    }
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('fr-FR'),
      time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const departureInfo = formatDateTime(trip?.departure_time);

  const handleBackToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ClientMain' }],
    });
  };

  const handleViewBookings = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'ClientMain',
        state: {
          index: 1, // Index 1 correspond à l'onglet "Mes trajets" (Bookings)
          routes: [
            { name: 'Home' },
            { name: 'Bookings' },
            { name: 'Favorites' },
            { name: 'Profile' }
          ]
        }
      }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Animation de succès */}
        <Animated.View 
          style={[
            styles.successContainer,
            {
              transform: [{ scale: scaleAnimation }],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.successIcon,
              {
                transform: [{ 
                  rotate: checkAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }],
              }
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </Animated.View>
          
          <Animated.View style={{ opacity: fadeAnimation }}>
            <Text style={styles.successTitle}>Paiement réussi !</Text>
            <Text style={styles.successSubtitle}>
              Votre réservation a été confirmée avec succès
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Informations de réservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>
          
          <View style={styles.bookingInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Référence</Text>
              <Text style={styles.infoValue}>{booking.booking_reference}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statut</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                <Text style={[styles.infoValue, { color: COLORS.success }]}>
                  Confirmé
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de réservation</Text>
              <Text style={styles.infoValue}>
                {new Date(booking.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>

        {/* Détails du voyage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voyage</Text>
          
          <View style={styles.tripCard}>
            <View style={styles.routeHeader}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeText}>
                  {trip?.departure_city || trip?.ville_depart || 'Départ'} → {trip?.arrival_city || trip?.ville_arrivee || 'Arrivée'}
                </Text>
                <Text style={styles.busType}>{trip?.bus_type ? trip.bus_type.toUpperCase() : 'VIP'}</Text>
              </View>
            </View>
            
            <View style={styles.tripDetails}>
              <View style={styles.tripDetail}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.tripDetailText}>
                  {departureInfo.date} à {departureInfo.time}
                </Text>
              </View>
              
              <View style={styles.tripDetail}>
                <Ionicons name="business-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.tripDetailText}>
                  {trip?.agencies?.name || trip?.agency?.name || 'Agence non spécifiée'}
                </Text>
              </View>
              
              <View style={styles.tripDetail}>
                <Ionicons name="people-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.tripDetailText}>
                  {selectedSeats && Array.isArray(selectedSeats) ? selectedSeats.length : 1} passager(s)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sièges réservés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sièges réservés</Text>
          
          <View style={styles.seatsContainer}>
            {selectedSeats && Array.isArray(selectedSeats) && selectedSeats.map((seat, index) => (
              <View key={seat.id || index} style={styles.seatCard}>
                <View style={styles.seatHeader}>
                  <Ionicons name="airplane" size={20} color={COLORS.primary} />
                  <Text style={styles.seatNumber}>
                    Siège {seat.seat_number || seat.number || 'A1'}
                  </Text>
                </View>
                <Text style={styles.seatType}>{seat.seat_type || 'Standard'}</Text>
              </View>
            ))}
            
            {/* Affichage alternatif si selectedSeats n'est pas un tableau */}
            {(!selectedSeats || !Array.isArray(selectedSeats)) && (
              <View style={styles.seatCard}>
                <View style={styles.seatHeader}>
                  <Ionicons name="airplane" size={20} color={COLORS.primary} />
                  <Text style={styles.seatNumber}>
                    Siège {typeof selectedSeats === 'string' ? selectedSeats : 'A1'}
                  </Text>
                </View>
                <Text style={styles.seatType}>Standard</Text>
              </View>
            )}
          </View>
        </View>

        {/* Total payé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Montant total</Text>
              <Text style={styles.paymentAmount}>{totalPrice.toLocaleString()} FCFA</Text>
            </View>
            
            <View style={styles.paymentStatus}>
              <Ionicons name="card" size={20} color={COLORS.success} />
              <Text style={styles.paymentStatusText}>Paiement effectué</Text>
            </View>
          </View>
        </View>

        {/* Instructions importantes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations importantes</Text>
          
          <View style={styles.instructionsContainer}>
            <View style={styles.instruction}>
              <Ionicons name="time-outline" size={20} color={COLORS.warning} />
              <Text style={styles.instructionText}>
                Présentez-vous 30 minutes avant le départ
              </Text>
            </View>
            
            <View style={styles.instruction}>
              <Ionicons name="card-outline" size={20} color={COLORS.warning} />
              <Text style={styles.instructionText}>
                Munissez-vous d'une pièce d'identité valide
              </Text>
            </View>
            
            <View style={styles.instruction}>
              <Ionicons name="phone-portrait-outline" size={20} color={COLORS.warning} />
              <Text style={styles.instructionText}>
                Gardez cette confirmation sur votre téléphone
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.footer}>
        <Button
          title="Voir mes réservations"
          onPress={handleViewBookings}
          variant="outline"
          style={styles.footerButton}
        />
        
        <Button
          title="Retour à l'accueil"
          onPress={handleBackToHome}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  content: {
    padding: SPACING.md,
  },
  
  successContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  
  successIcon: {
    marginBottom: SPACING.lg,
  },
  
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  successSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  bookingInfo: {
    gap: SPACING.md,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  
  tripCard: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  
  routeHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
  },
  
  routeInfo: {
    alignItems: 'center',
  },
  
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  
  busType: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.8,
  },
  
  tripDetails: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  
  tripDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  tripDetailText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  
  seatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  
  seatCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 120,
  },
  
  seatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  
  seatNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
  },
  
  seatType: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: 'capitalize',
  },
  
  paymentInfo: {
    gap: SPACING.md,
  },
  
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  paymentLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  
  instructionsContainer: {
    gap: SPACING.md,
  },
  
  instruction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  instructionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  footer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  
  footerButton: {
    marginVertical: 0,
  },
});

export default PaymentSuccessScreen;
