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
import logger from '../../utils/logger';

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { 
    booking, 
    trip, 
    selectedSeats, 
    totalPrice, 
    originalPrice,
    referralDiscount,
    discountApplied,
    rewardsToUse,
    paymentMethod 
  } = route.params;
  const { user } = useAuthStore();
  
  // État pour éviter la création multiple de réservations avec une clé unique
  const tripId = trip?.id;
  const userId = user?.id;
  
  // Inclure les sièges dans la clé pour éviter les conflits lors de réservations multiples
  const seatNumbers = selectedSeats && Array.isArray(selectedSeats) 
    ? selectedSeats.map(s => s.seat_number || s.number || s).sort().join('-')
    : (typeof selectedSeats === 'string' ? selectedSeats : 'default');
  
  const bookingKey = `${tripId}_${userId}_${seatNumbers}_${Date.now()}`;
  
  logger.info('🔑 Clé de réservation générée:', bookingKey);
  
  // Utiliser une Map globale pour éviter les doublons entre différentes instances
  if (!global.processedBookings) {
    global.processedBookings = new Map();
  }
  
  const [bookingCreated, setBookingCreated] = useState(false);

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
      const existingEntry = global.processedBookings.get(bookingKey);
      const now = Date.now();
      
      // Si l'entrée existe et qu'elle a moins de 5 minutes, on considère que c'est un doublon
      if (existingEntry && (now - existingEntry) < 5 * 60 * 1000) {
        // Réservation déjà créée récemment, pas de duplication
        return;
      }

      // Nettoyer les anciennes entrées (plus de 5 minutes)
      for (const [key, timestamp] of global.processedBookings.entries()) {
        if (now - timestamp > 5 * 60 * 1000) {
          global.processedBookings.delete(key);
        }
      }

      // Marquer comme en cours de traitement immédiatement
      setBookingCreated(true);
      global.processedBookings.set(bookingKey, now);
      
      // Création de la réservation après confirmation de paiement

      try {
        // Préparer les données pour le service de réservation Supabase
        const bookingData = {
          tripId: trip?.id,
          userId: user?.id,
          seatNumber: selectedSeats && Array.isArray(selectedSeats) 
            ? selectedSeats.map(seat => seat?.seat_number || seat?.number || seat || 'A1').join(', ')
            : (typeof selectedSeats === 'string' ? selectedSeats : 'A1'),
          totalPrice: totalPrice || 0,
          paymentMethod: paymentMethod || 'orange_money',
          selectedSeats: selectedSeats || []
        };

        // Utiliser createMultipleBookings pour créer une réservation par siège
        const savedBookings = await bookingService.createMultipleBookings(bookingData);
        
        if (savedBookings && Array.isArray(savedBookings) && savedBookings.length > 0) {
          // Réservations sauvegardées dans Supabase
          
          // 🆕 CRÉER LA FACTURE PDF AUTOMATIQUEMENT
          try {
            logger.info('🧾 Création de la facture PDF...');
            const firstBooking = savedBookings[0]; // Utiliser la première réservation pour la facture
            
            // Import dynamique du service de factures pour éviter les erreurs au démarrage
            const { invoiceService } = await import('../../services/invoiceService');
            const invoiceData = await invoiceService.createInvoice(firstBooking, user);
            
            if (invoiceData) {
              logger.info('✅ Facture créée avec succès:', invoiceData.invoice_number);
            }
          } catch (invoiceError) {
            logger.error('❌ Erreur création facture:', invoiceError);
            // Ne pas faire échouer le processus si la facture échoue
          }
          
          // 🆕 MARQUER LES RÉCOMPENSES COMME UTILISÉES
          if (rewardsToUse && Array.isArray(rewardsToUse) && rewardsToUse.length > 0 && referralDiscount > 0) {
            // Marquage des récompenses de parrainage comme utilisées
            
            try {
              const firstBookingId = savedBookings[0]?.id;
              const claimResult = await bookingService.claimRewards(user.id, referralDiscount, firstBookingId);
              
              if (claimResult) {
                // Récompenses marquées comme utilisées avec succès
              } else {
                // Échec du marquage des récompenses
              }
            } catch (claimError) {
              // Erreur lors du marquage des récompenses
            }
          }
          
          // ✅ NE PLUS CRÉER DE RÉSERVATION GROUPÉE LOCALE
          // Les réservations individuelles seront chargées depuis Supabase automatiquement
          // via loadBookings() lors du prochain focus de l'écran BookingsScreen
          
        } else {
          // Aucune réservation retournée par le service
        }
      } catch (error) {
        // Erreur lors de la création de la réservation
        // En cas d'erreur, permettre un nouvel essai
        setBookingCreated(false);
        global.processedBookings.delete(bookingKey);
      }
    };

    addBookingToHistory();
  }, []);

  // Fonction pour formater les prix de manière sécurisée
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '0 FCFA';
    }
    
    const numPrice = Number(price);
    
    if (isNaN(numPrice)) {
      return '0 FCFA';
    }
    
    try {
      return numPrice.toLocaleString('fr-FR') + ' FCFA';
    } catch (error) {
      console.warn('Erreur formatPrice:', error);
      return numPrice.toString() + ' FCFA';
    }
  };

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
              <Text style={styles.infoValue}>{booking?.booking_reference || 'N/A'}</Text>
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
                {booking?.created_at ? new Date(booking.created_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
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
                  {departureInfo?.date || 'Date inconnue'} à {departureInfo?.time || 'Heure inconnue'}
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
                    Siège {seat?.seat_number || seat?.number || 'A1'}
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
            {/* Afficher le prix original s'il y a eu une réduction */}
            {originalPrice && originalPrice > totalPrice && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Prix original</Text>
                <Text style={[styles.paymentAmount, styles.originalPrice]}>{formatPrice(originalPrice)}</Text>
              </View>
            )}
            
            {/* Afficher la réduction de parrainage */}
            {referralDiscount && referralDiscount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={[styles.paymentLabel, styles.discountLabel]}>
                  🎁 Bonus de parrainage utilisé
                </Text>
                <Text style={[styles.paymentAmount, styles.discountAmount]}>
                  -{formatPrice(referralDiscount)}
                </Text>
              </View>
            )}
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Montant payé</Text>
              <Text style={styles.paymentAmount}>{formatPrice(totalPrice)}</Text>
            </View>
            
            <View style={styles.paymentStatus}>
              <Ionicons name="card" size={20} color={COLORS.success} />
              <Text style={styles.paymentStatusText}>Paiement effectué</Text>
            </View>
          </View>
        </View>
        
        {/* Bonus de parrainage utilisé (si applicable) */}
        {referralDiscount && referralDiscount > 0 && (
          <View style={[styles.section, styles.bonusSection]}>
            <View style={styles.bonusHeader}>
              <Ionicons name="gift" size={24} color={COLORS.primary} />
              <Text style={styles.bonusSectionTitle}>Bonus de parrainage utilisé</Text>
            </View>
            
            <View style={styles.bonusInfo}>
              <Text style={styles.bonusText}>
                Félicitations ! Vous avez économisé {formatPrice(referralDiscount)} grâce à votre bonus de parrainage.
              </Text>
              <Text style={styles.bonusSubtext}>
                Cette récompense a été automatiquement déduite de votre facture.
              </Text>
            </View>
          </View>
        )}

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
  
  originalPrice: {
    textDecorationLine: 'line-through',
    color: COLORS.text.secondary,
  },
  
  discountLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  discountAmount: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  
  bonusSection: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  bonusSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  
  bonusInfo: {
    gap: SPACING.xs,
  },
  
  bonusText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  bonusSubtext: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
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