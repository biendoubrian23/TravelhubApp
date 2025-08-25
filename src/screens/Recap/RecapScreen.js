import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { formatTime, formatPrice } from '../../utils/helpers';
import { bookingService } from '../../services/bookingService';
import { useAuthStore } from '../../store';

const RecapScreen = ({ route, navigation }) => {
  const { user } = useAuthStore();
  const { 
    trip, 
    outboundTrip, 
    returnTrip, 
    selectedSeats, 
    returnSelectedSeats,
    totalPrice, 
    searchParams 
  } = route.params;
  const [loading, setLoading] = useState(false);
  const [referralRewards, setReferralRewards] = useState({
    hasDiscount: false,
    discountAmount: 0,
    finalPrice: totalPrice,
    availableRewards: []
  });

  useEffect(() => {
    checkReferralRewards();
  }, []);

  const checkReferralRewards = async () => {
    if (!user?.id || !totalPrice) return;
    
    try {
      console.log('🔍 Vérification des récompenses de parrainage...')
      const rewardInfo = await bookingService.applyReferralDiscount(user.id, totalPrice);
      setReferralRewards(rewardInfo);
      console.log('💰 Récompenses récupérées:', rewardInfo)
    } catch (error) {
      console.error('Erreur lors de la vérification des récompenses:', error);
    }
  };

  // Déterminer si c'est un aller-retour
  const isRoundTrip = outboundTrip && returnTrip;
  const mainTrip = isRoundTrip ? outboundTrip : trip;

  console.log('RecapScreen - Data received:', { 
    trip, 
    outboundTrip, 
    returnTrip, 
    selectedSeats, 
    returnSelectedSeats,
    totalPrice, 
    isRoundTrip 
  });

  console.log('RecapScreen - VIP Status:', {
    'outboundTrip?.is_vip': outboundTrip?.is_vip,
    'returnTrip?.is_vip': returnTrip?.is_vip,
    'trip?.is_vip': trip?.is_vip,
    'selectedSeats length': selectedSeats?.length,
    'returnSelectedSeats length': returnSelectedSeats?.length
  });

  // Fonction pour calculer le nombre de passagers
  const getPassengerCount = () => {
    // Pour les trajets VIP, on utilise le nombre de sièges sélectionnés
    if (selectedSeats && Array.isArray(selectedSeats) && selectedSeats.length > 0) {
      return selectedSeats.length;
    }
    // Pour les trajets CLASSIC, on utilise les paramètres de recherche
    return searchParams?.passengers || searchParams?.passagers || searchParams?.nbPassengers || 1;
  };

  const getReturnPassengerCount = () => {
    // Pour les trajets VIP retour, on utilise le nombre de sièges sélectionnés
    if (returnSelectedSeats && Array.isArray(returnSelectedSeats) && returnSelectedSeats.length > 0) {
      return returnSelectedSeats.length;
    }
    // Pour les trajets CLASSIC, on utilise les paramètres de recherche
    return searchParams?.passengers || searchParams?.passagers || searchParams?.nbPassengers || 1;
  };

  const calculateTotalPrice = () => {
    let basePrice;
    if (isRoundTrip) {
      const outboundPassengers = getPassengerCount();
      const returnPassengers = getReturnPassengerCount();
      basePrice = (outboundTrip?.prix || 0) * outboundPassengers + (returnTrip?.prix || 0) * returnPassengers;
    } else {
      const passengers = getPassengerCount();
      basePrice = (trip?.prix || totalPrice || 0) * passengers;
    }
    
    return basePrice;
  };

  const getOriginalPrice = () => {
    return calculateTotalPrice();
  };

  const getFinalPrice = () => {
    return referralRewards.finalPrice;
  };

  // Helper function pour formater les prix
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) return '0';
    return Number(price).toLocaleString();
  };

  const handlePayment = () => {
    const paymentData = isRoundTrip ? {
      outboundTrip,
      returnTrip,
      selectedSeats,
      returnSelectedSeats,
      totalPrice: getFinalPrice(), // Prix final avec remise
      originalPrice: getOriginalPrice(), // Prix original
      referralDiscount: referralRewards.discountAmount,
      discountApplied: referralRewards.hasDiscount,
      rewardsToUse: referralRewards.availableRewards,
      isRoundTrip: true,
      searchParams,
      userInfo: {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      }
    } : {
      trip,
      selectedSeats,
      totalPrice: getFinalPrice(), // Prix final avec remise
      originalPrice: getOriginalPrice(), // Prix original
      referralDiscount: referralRewards.discountAmount,
      discountApplied: referralRewards.hasDiscount,
      rewardsToUse: referralRewards.availableRewards,
      isRoundTrip: false,
      searchParams,
      userInfo: {
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
      }
    };

    console.log('📊 Données de paiement avec récompenses:', paymentData);
    navigation.navigate('Payment', paymentData);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Récapitulatif</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Détails du voyage aller */}
        {isRoundTrip ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trajet aller</Text>
              
              <View style={styles.tripCard}>
                <View style={styles.routeContainer}>
                  <View style={styles.cityInfo}>
                    <Text style={styles.time}>{formatTime(outboundTrip?.heure_dep) || 'N/A'}</Text>
                    <Text style={styles.city}>{outboundTrip?.ville_depart || 'Départ'}</Text>
                  </View>
                  
                  <View style={styles.arrow}>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                  </View>
                  
                  <View style={styles.cityInfo}>
                    <Text style={styles.time}>{formatTime(outboundTrip?.heure_arr) || 'N/A'}</Text>
                    <Text style={styles.city}>{outboundTrip?.ville_arrivee || 'Arrivée'}</Text>
                  </View>
                </View>
                
                <View style={styles.busInfo}>
                  <Ionicons name="bus" size={16} color={COLORS.primary} />
                  <Text style={styles.busType}>
                    {outboundTrip?.is_vip ? 'VIP' : 'CLASSIC'}
                  </Text>
                  <Text style={styles.price}>
                    {formatPrice((outboundTrip?.prix || 0) * getPassengerCount())} FCFA
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trajet retour</Text>
              
              <View style={styles.tripCard}>
                <View style={styles.routeContainer}>
                  <View style={styles.cityInfo}>
                    <Text style={styles.time}>{formatTime(returnTrip?.heure_dep) || 'N/A'}</Text>
                    <Text style={styles.city}>{returnTrip?.ville_depart || 'Départ'}</Text>
                  </View>
                  
                  <View style={styles.arrow}>
                    <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                  </View>
                  
                  <View style={styles.cityInfo}>
                    <Text style={styles.time}>{formatTime(returnTrip?.heure_arr) || 'N/A'}</Text>
                    <Text style={styles.city}>{returnTrip?.ville_arrivee || 'Arrivée'}</Text>
                  </View>
                </View>
                
                <View style={styles.busInfo}>
                  <Ionicons name="bus" size={16} color={COLORS.primary} />
                  <Text style={styles.busType}>
                    {returnTrip?.is_vip ? 'VIP' : 'CLASSIC'}
                  </Text>
                  <Text style={styles.price}>
                    {formatPrice((returnTrip?.prix || 0) * getReturnPassengerCount())} FCFA
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails du voyage</Text>
            
            <View style={styles.tripCard}>
              <View style={styles.routeContainer}>
                <View style={styles.cityInfo}>
                  <Text style={styles.time}>{formatTime(trip?.heure_dep) || 'N/A'}</Text>
                  <Text style={styles.city}>{trip?.ville_depart || 'Départ'}</Text>
                </View>
                
                <View style={styles.arrow}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                </View>
                
                <View style={styles.cityInfo}>
                  <Text style={styles.time}>{formatTime(trip?.heure_arr) || 'N/A'}</Text>
                  <Text style={styles.city}>{trip?.ville_arrivee || 'Arrivée'}</Text>
                </View>
              </View>
              
              <View style={styles.busInfo}>
                <Ionicons name="bus" size={16} color={COLORS.primary} />
                <Text style={styles.busType}>
                  {trip?.is_vip ? 'VIP' : 'CLASSIC'}
                </Text>
                <Text style={styles.price}>
                  {formatPrice((trip?.prix || 0) * getPassengerCount())} FCFA
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sièges sélectionnés pour tous les types de trajets */}
        {isRoundTrip && outboundTrip && returnTrip ? (
          <>
            {/* Sièges aller */}
            {selectedSeats && selectedSeats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🪑 Sièges sélectionnés - Trajet aller</Text>
                
                {selectedSeats.map((seat, index) => (
                  <View key={seat.id || index} style={styles.seatItem}>
                    <View>
                      <Text style={styles.seatNumber}>Siège {seat.seat_number || seat.number || (index + 1)}</Text>
                      <Text style={styles.seatPassenger}>Passager {index + 1}</Text>
                    </View>
                    <Text style={styles.seatPrice}>Inclus</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sièges retour */}
            {returnSelectedSeats && returnSelectedSeats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🪑 Sièges sélectionnés - Trajet retour</Text>
                
                {returnSelectedSeats.map((seat, index) => (
                  <View key={seat.id || index} style={styles.seatItem}>
                    <View>
                      <Text style={styles.seatNumber}>Siège {seat.seat_number || seat.number || (index + 1)}</Text>
                      <Text style={styles.seatPassenger}>Passager {index + 1}</Text>
                    </View>
                    <Text style={styles.seatPrice}>Inclus</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* Sièges pour trajet simple */
          selectedSeats && selectedSeats.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🪑 Sièges sélectionnés</Text>
              
              {selectedSeats.map((seat, index) => (
                <View key={seat.id || index} style={styles.seatItem}>
                  <View>
                    <Text style={styles.seatNumber}>Siège {seat.seat_number || seat.number || (index + 1)}</Text>
                    <Text style={styles.seatPassenger}>Passager {index + 1}</Text>
                  </View>
                  <Text style={styles.seatPrice}>Inclus</Text>
                </View>
              ))}
            </View>
          )
        )}

        {/* Services inclus */}
        {trip?.trip_services && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services inclus</Text>
            
            {trip.trip_services.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                {service.wifi && (
                  <View style={styles.service}>
                    <Ionicons name="wifi" size={20} color={COLORS.primary} />
                    <Text style={styles.serviceName}>WiFi</Text>
                  </View>
                )}
                {service.clim && (
                  <View style={styles.service}>
                    <Ionicons name="snow" size={20} color={COLORS.primary} />
                    <Text style={styles.serviceName}>Climatisation</Text>
                  </View>
                )}
                {service.repas && (
                  <View style={styles.service}>
                    <Ionicons name="restaurant" size={20} color={COLORS.primary} />
                    <Text style={styles.serviceName}>Repas</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Détail des prix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détail des prix</Text>
          
          <View style={styles.priceBreakdown}>
            {isRoundTrip ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Trajet aller ({getPassengerCount()} passager{getPassengerCount() > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.priceValue}>
                    {formatPrice((outboundTrip?.prix || 0) * getPassengerCount())} FCFA
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Trajet retour ({getReturnPassengerCount()} passager{getReturnPassengerCount() > 1 ? 's' : ''})
                  </Text>
                  <Text style={styles.priceValue}>
                    {formatPrice((returnTrip?.prix || 0) * getReturnPassengerCount())} FCFA
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {getPassengerCount()} billet{getPassengerCount() > 1 ? 's' : ''} × {trip?.prix || 0} FCFA
                </Text>
                <Text style={styles.priceValue}>
                  {formatPrice(getPassengerCount() * (trip?.prix || 0))} FCFA
                </Text>
              </View>
            )}
            
            {/* Récompenses de parrainage */}
            {referralRewards.hasDiscount && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>
                  🎁 Récompense de parrainage ({referralRewards.availableRewards.length} récompense{referralRewards.availableRewards.length > 1 ? 's' : ''})
                </Text>
                <Text style={styles.discountValue}>
                  -{formatPrice(referralRewards.discountAmount)} FCFA
                </Text>
              </View>
            )}
            
            <View style={styles.divider} />
            
            {/* Section prix */}
            {referralRewards.hasDiscount ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Sous-total</Text>
                  <Text style={styles.priceValue}>
                    {formatPrice(getOriginalPrice())} FCFA
                  </Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.totalLabel}>Total à payer</Text>
                  <Text style={styles.totalValue}>
                    {formatPrice(getFinalPrice())} FCFA
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total à payer</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(getFinalPrice())} FCFA
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bouton de paiement */}
      <View style={styles.footer}>
        <Button
          title="Procéder au paiement"
          onPress={handlePayment}
          loading={loading}
          disabled={loading}
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
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  
  cityInfo: {
    flex: 1,
    alignItems: 'center',
  },
  
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  
  city: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  arrow: {
    paddingHorizontal: SPACING.md,
  },
  
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  
  busType: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },

  price: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  seatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  
  seatNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  seatPassenger: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  
  seatPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  serviceItem: {
    marginBottom: SPACING.sm,
  },
  
  service: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  
  serviceName: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text.primary,
  },
  
  priceBreakdown: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  
  priceLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
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
    fontWeight: '700',
    color: COLORS.primary,
  },

  discountedTotal: {
    color: COLORS.success,
  },

  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.xs,
  },

  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  discountLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },

  discountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },

  savingsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },

  savingsText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    flex: 1,
  },
  
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});

export default RecapScreen;