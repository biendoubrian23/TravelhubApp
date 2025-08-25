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
import { bookingService } from '../../services';

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { 
    booking, 
    trip, 
    selectedSeats, 
    totalPrice, 
    originalPrice,
    referralDiscount = 0,
    discountApplied = false,
    rewardsToUse = [],
    paymentMethod 
  } = route.params;
  
  const { addBooking } = useBookingsStore();
  const { user } = useAuthStore();
  
  // État pour éviter la création multiple de réservations avec une clé unique
  const tripId = trip?.id;
  const userId = user?.id;
  const seatNumbers = selectedSeats?.map(s => s.number || s).sort().join('-');
  const bookingKey = `${tripId}_${userId}_${seatNumbers}_${Date.now()}`;
  
  // Utiliser une Map globale pour éviter les doublons entre différentes instances
  if (!global.processedBookings) {
    global.processedBookings = new Map();
  }
  
  const [bookingCreated, setBookingCreated] = useState(false);
  const [scaleValue] = useState(new Animated.Value(0.5));
  const [fadeValue] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back()),
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();

    // Créer la réservation seulement si elle n'a pas déjà été créée
    if (!global.processedBookings.has(bookingKey)) {
      global.processedBookings.set(bookingKey, true);
      createBooking();
    } else {
      setBookingCreated(true);
    }
  }, []);

  const createBooking = async () => {
    try {
      console.log('🎯 Création de la réservation avec les données:', {
        booking,
        trip,
        selectedSeats,
        totalPrice,
        originalPrice,
        referralDiscount,
        discountApplied,
        rewardsToUse,
        user: user
      });

      // Si des récompenses ont été utilisées, les marquer comme utilisées
      if (discountApplied && rewardsToUse && rewardsToUse.length > 0) {
        console.log('💰 Marquage des récompenses comme utilisées...');
        await bookingService.claimRewards(user.id, rewardsToUse, booking.booking_reference);
      }

      const bookingData = {
        id: booking.booking_reference,
        booking_reference: booking.booking_reference,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        total_price_fcfa: totalPrice,
        original_price_fcfa: originalPrice,
        referral_discount_fcfa: referralDiscount,
        discount_applied: discountApplied,
        rewards_used: rewardsToUse,
        trip: trip,
        selectedSeats: selectedSeats,
        payment_method: paymentMethod,
        booking_date: new Date().toISOString(),
        user_id: user?.id
      };

      addBooking(bookingData);
      setBookingCreated(true);
      
      console.log('✅ Réservation créée avec succès:', bookingData);
    } catch (error) {
      console.error('❌ Erreur lors de la création de la réservation:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date non disponible';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Heure non disponible';
    
    try {
      // Si c'est déjà au format HH:MM, on le retourne tel quel
      if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }
      
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return 'Heure invalide';
      }
      
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage d\'heure:', error);
      return 'Heure non disponible';
    }
  };

  const getAgencyName = (trip) => {
    if (trip?.agence_nom) return trip.agence_nom;
    if (trip?.agency?.nom) return trip.agency.nom;
    if (trip?.agency?.name) return trip.agency.name;
    return 'Agence non spécifiée';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Animation de succès */}
        <Animated.View 
          style={[
            styles.successIcon,
            {
              transform: [{ scale: scaleValue }],
              opacity: fadeValue,
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark" size={60} color={COLORS.surface} />
          </View>
        </Animated.View>

        <Text style={styles.successTitle}>Paiement réussi !</Text>
        <Text style={styles.successSubtitle}>
          Votre réservation a été confirmée
        </Text>

        {/* Informations de réservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Référence</Text>
              <Text style={styles.infoValue}>{booking?.booking_reference}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date de réservation</Text>
              <Text style={styles.infoValue}>
                {new Date().toLocaleDateString('fr-FR')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Statut</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Confirmé</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Détails du voyage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voyage</Text>
          
          <View style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={styles.agencyName}>{getAgencyName(trip)}</Text>
              <Text style={styles.busType}>{trip?.type_bus || 'Bus Standard'}</Text>
            </View>
            
            <View style={styles.routeContainer}>
              <View style={styles.cityContainer}>
                <Text style={styles.time}>{formatTime(trip?.heure_depart)}</Text>
                <Text style={styles.city}>{trip?.ville_depart}</Text>
              </View>
              
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
              </View>
              
              <View style={styles.cityContainer}>
                <Text style={styles.time}>{formatTime(trip?.heure_arrivee)}</Text>
                <Text style={styles.city}>{trip?.ville_arrivee}</Text>
              </View>
            </View>
            
            <Text style={styles.date}>{formatDate(trip?.date_depart)}</Text>
            
            {selectedSeats && selectedSeats.length > 0 && (
              <View style={styles.seatsContainer}>
                <Text style={styles.seatsTitle}>Sièges sélectionnés :</Text>
                <View style={styles.seatsGrid}>
                  {selectedSeats.map((seat, index) => (
                    <View key={index} style={styles.seatBadge}>
                      <Text style={styles.seatNumber}>
                        {seat?.number || seat || `Siège ${index + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Récapitulatif du paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif du paiement</Text>
          
          <View style={styles.paymentCard}>
            {discountApplied && (
              <>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Sous-total</Text>
                  <Text style={styles.paymentValue}>
                    {originalPrice?.toLocaleString() || '0'} FCFA
                  </Text>
                </View>
                
                <View style={styles.discountRow}>
                  <Text style={styles.discountLabel}>
                    🎁 Récompense de parrainage ({rewardsToUse?.length || 0} récompense{(rewardsToUse?.length || 0) > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.discountValue}>
                    -{referralDiscount?.toLocaleString() || '0'} FCFA
                  </Text>
                </View>
                
                <View style={styles.divider} />
              </>
            )}
            
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Total payé</Text>
              <Text style={styles.totalValue}>
                {totalPrice?.toLocaleString() || '0'} FCFA
              </Text>
            </View>
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Moyen de paiement</Text>
              <Text style={styles.paymentValue}>
                {paymentMethod === 'orange_money' ? 'Orange Money' :
                 paymentMethod === 'mtn_momo' ? 'MTN Mobile Money' :
                 paymentMethod === 'stripe' ? 'Carte bancaire' : 
                 'Autre'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.footer}>
        <Button
          title="Retour à l'accueil"
          onPress={() => navigation.navigate('Home')}
          style={styles.primaryButton}
        />
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('TripHistory')}
        >
          <Text style={styles.secondaryButtonText}>Voir mes réservations</Text>
        </TouchableOpacity>
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
    flex: 1,
    padding: SPACING.md,
  },
  
  successIcon: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  
  successSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  
  section: {
    marginBottom: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  infoLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  statusBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  statusText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  agencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  busType: {
    fontSize: 14,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  
  cityContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  city: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  arrow: {
    paddingHorizontal: SPACING.md,
  },
  
  date: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  
  seatsContainer: {
    marginTop: SPACING.md,
  },
  
  seatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  
  seatBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  seatNumber: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  
  paymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  
  paymentLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.xs,
  },
  
  discountLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    flex: 1,
  },
  
  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  footer: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  
  primaryButton: {
    marginBottom: SPACING.sm,
  },
  
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentSuccessScreen;
