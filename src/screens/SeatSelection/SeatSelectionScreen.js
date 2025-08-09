import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeSeatMaps } from '../../hooks/useRealtime';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const SeatSelectionScreen = ({ route, navigation }) => {
  const { 
    trip, 
    outboundTrip, 
    returnTrip, 
    searchParams,
    showReturnSelection = false, // Nouveau paramètre pour indiquer qu'on doit revenir pour le retour
    preselectedOutboundSeats = [], // Sièges aller déjà sélectionnés
    vipTripOnly = null // 'outbound', 'return', ou null (les deux trajets VIP)
  } = route.params;
  
  const [selectedSeats, setSelectedSeats] = useState(preselectedOutboundSeats);
  const [returnSelectedSeats, setReturnSelectedSeats] = useState([]);
  
  // Déterminer si c'est un aller-retour
  const isRoundTrip = outboundTrip && returnTrip;
  // Nouveau: si on a un outboundTrip mais pas de returnTrip, on est en mode "aller seulement pour l'instant"
  const isOutboundOnly = outboundTrip && !returnTrip && showReturnSelection;
  
  // Déterminer l'étape initiale selon le contexte
  const getInitialStep = () => {
    if (vipTripOnly === 'return') return 'return' // Seul le retour est VIP
    if (preselectedOutboundSeats.length > 0 && isRoundTrip && !vipTripOnly) return 'return' // Sièges aller déjà sélectionnés, passer au retour
    return 'outbound' // Par défaut, commencer par l'aller
  }
  
  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Déterminer le trajet actuel selon le contexte
  const getCurrentTrip = () => {
    if (vipTripOnly === 'outbound') return outboundTrip
    if (vipTripOnly === 'return') return returnTrip
    if (isRoundTrip) return currentStep === 'outbound' ? outboundTrip : returnTrip
    if (isOutboundOnly) return outboundTrip
    return trip
  }
  
  const currentTrip = getCurrentTrip();
  
  // Vérifier si le trajet actuel est VIP (pour éviter d'afficher des sièges pour un trajet classic)
  const currentTripIsVip = currentTrip?.is_vip || false;
  
  // Récupérer le nombre de passagers depuis les paramètres de recherche
  const maxSeats = searchParams?.passengers || 1;
  
  console.log('SeatSelection - Mode:', isRoundTrip ? 'Round trip' : isOutboundOnly ? 'Outbound only (waiting for return)' : 'One way');
  console.log('SeatSelection - Current step:', currentStep);
  console.log('SeatSelection - Current trip:', currentTrip);
  console.log('SeatSelection - Show return selection:', showReturnSelection);
  console.log('SeatSelection - Preselected outbound seats:', preselectedOutboundSeats);
  
  // Hook pour les sièges en temps réel (avec fallback pour les données mockées)
  const { seatMaps, loading, error } = useRealtimeSeatMaps(currentTrip?.id);
  
  // Fallback pour les données mockées si pas de sièges trouvés
  const [mockSeatMaps, setMockSeatMaps] = useState([]);
  
  useEffect(() => {
    // Si pas de sièges réels, générer des sièges mockés
    if (!loading && (!seatMaps || seatMaps.length === 0)) {
      console.log('Génération de sièges mockés pour le trip:', currentTrip?.id);
      generateMockSeatMaps();
    }
  }, [loading, seatMaps, currentTrip]);

  const generateMockSeatMaps = () => {
    const seats = [];
    const busType = currentTrip?.bus_type || 'classique';
    let totalSeats = 45; // Classique par défaut
    
    // Vérification de sécurité pour busType
    const safeBusType = busType && typeof busType === 'string' ? busType.toLowerCase() : 'classique';
    
    if (safeBusType.includes('premium')) totalSeats = 40;
    if (safeBusType.includes('vip')) totalSeats = 35;
    
    // Générer les sièges
    for (let row = 1; row <= Math.ceil(totalSeats / 4); row++) {
      for (let col = 0; col < 4; col++) {
        const seatNumber = ['A', 'B', 'C', 'D'][col] + row;
        const seatIndex = (row - 1) * 4 + col;
        
        if (seatIndex < totalSeats) {
          let seatType = 'standard';
          let priceModifier = 0;
          
          if (safeBusType.includes('premium')) {
            seatType = 'premium';
            priceModifier = 500;
          } else if (safeBusType.includes('vip')) {
            seatType = 'vip';
            priceModifier = 1000;
          }
          
          seats.push({
            id: `mock_${trip?.id || 'unknown'}_${seatNumber}`,
            trip_id: trip?.id || 'unknown',
            seat_number: seatNumber,
            seat_type: seatType,
            is_available: Math.random() > 0.3, // 70% de sièges disponibles
            price_modifier_fcfa: priceModifier,
            position_row: row,
            position_column: col + 1
          });
        }
      }
    }
    
    setMockSeatMaps(seats);
  };

  // Utiliser les sièges réels ou mockés
  const availableSeats = seatMaps && seatMaps.length > 0 ? seatMaps : mockSeatMaps;

  useEffect(() => {
    // Calculer le prix total
    let calculatedTotal = 0;
    
    if (isRoundTrip) {
      // Pour un aller-retour, additionner les prix des deux trajets
      calculatedTotal = (outboundTrip?.prix || 0) + (returnTrip?.prix || 0);
    } else {
      // Pour un trajet simple, utiliser le prix du trajet ou le prix de base
      const currentSeats = currentStep === 'outbound' ? selectedSeats : returnSelectedSeats;
      let basePrice = currentTrip?.price_fcfa || currentTrip?.prix || 0;
      
      // Fallback pour les données de test si aucun prix n'est défini
      if (basePrice === 0) {
        const busType = currentTrip?.bus_type || 'classique';
        const safeBusType = busType && typeof busType === 'string' ? busType.toLowerCase() : 'classique';
        
        if (safeBusType.includes('vip')) {
          basePrice = 15000; // Prix par défaut VIP
        } else if (safeBusType.includes('premium')) {
          basePrice = 12000; // Prix par défaut Premium
        } else {
          basePrice = 8000; // Prix par défaut Standard
        }
      }
      
      const seatPriceModifiers = currentSeats.reduce((sum, seat) => sum + (seat.price_modifier_fcfa || 0), 0);
      calculatedTotal = (basePrice * currentSeats.length) + seatPriceModifiers;
    }
    
    setTotalPrice(calculatedTotal);
  }, [selectedSeats, returnSelectedSeats, currentTrip, isRoundTrip, outboundTrip, returnTrip, currentStep]);

  const handleSeatPress = (seat) => {
    if (!seat.is_available) {
      Alert.alert('Siège indisponible', 'Ce siège est déjà réservé');
      return;
    }

    const currentSeats = currentStep === 'outbound' ? selectedSeats : returnSelectedSeats;
    const setCurrentSeats = currentStep === 'outbound' ? setSelectedSeats : setReturnSelectedSeats;

    setCurrentSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      if (isSelected) {
        // Désélectionner
        return prev.filter(s => s.id !== seat.id);
      } else {
        // Sélectionner (limité par le nombre de passagers)
        if (prev.length >= maxSeats) {
          Alert.alert(
            'Limite atteinte', 
            `Vous pouvez sélectionner maximum ${maxSeats} siège(s) pour ${maxSeats} passager(s)`
          );
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const getSeatStyle = (seat) => {
    const currentSeats = currentStep === 'outbound' ? selectedSeats : returnSelectedSeats;
    const isSelected = currentSeats.find(s => s.id === seat.id);
    const isAvailable = seat.is_available;

    if (isSelected) return styles.seatSelected;
    if (!isAvailable) return styles.seatUnavailable;
    
    // Style selon le type de siège
    switch (seat.seat_type) {
      case 'vip': return styles.seatVip;
      case 'premium': return styles.seatPremium;
      default: return styles.seatStandard;
    }
  };

  const getSeatIcon = (seat) => {
    if (!seat.is_available) return 'close';
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    return isSelected ? 'checkmark' : 'person-outline';
  };

  const renderBusLayout = () => {
    if (loading && (!availableSeats || availableSeats.length === 0)) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Chargement du plan des sièges...</Text>
        </View>
      );
    }

    if (error && (!availableSeats || availableSeats.length === 0)) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Plan des sièges indisponible</Text>
          <Button
            title="Réessayer"
            onPress={() => generateMockSeatMaps()}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      );
    }

    if (!availableSeats || availableSeats.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>Plan des sièges indisponible</Text>
          <Button
            title="Générer plan test"
            onPress={() => generateMockSeatMaps()}
            variant="outline"
            style={{ marginTop: SPACING.md }}
          />
        </View>
      );
    }

    // Organiser les sièges par rangée
    const seatsByRow = availableSeats.reduce((acc, seat) => {
      const row = seat.position_row;
      if (!acc[row]) acc[row] = [];
      acc[row].push(seat);
      return acc;
    }, {});

    // Trier les rangées et sièges
    const sortedRows = Object.keys(seatsByRow)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(rowNum => ({
        rowNum: parseInt(rowNum),
        seats: seatsByRow[rowNum].sort((a, b) => a.position_column - b.position_column)
      }));

    return (
      <View style={styles.busContainer}>
        {/* Conducteur */}
        <View style={styles.driverArea}>
          <Ionicons name="person" size={24} color={COLORS.text.secondary} />
          <Text style={styles.driverText}>Conducteur</Text>
        </View>

        {/* Sièges */}
        <ScrollView style={styles.seatsScrollView} showsVerticalScrollIndicator={false}>
          {sortedRows.map(({ rowNum, seats }) => (
            <View key={rowNum} style={styles.seatRow}>
              <Text style={styles.rowNumber}>{rowNum}</Text>
              
              <View style={styles.seatsInRow}>
                {seats.map((seat, index) => (
                  <TouchableOpacity
                    key={seat.id}
                    style={[styles.seat, getSeatStyle(seat)]}
                    onPress={() => handleSeatPress(seat)}
                    disabled={!seat.is_available}
                  >
                    <Ionicons 
                      name={getSeatIcon(seat)} 
                      size={16} 
                      color={
                        selectedSeats.find(s => s.id === seat.id) 
                          ? COLORS.text.white 
                          : seat.is_available 
                            ? COLORS.text.primary 
                            : COLORS.text.secondary
                      } 
                    />
                    <Text style={[
                      styles.seatNumber,
                      { color: selectedSeats.find(s => s.id === seat.id) 
                          ? COLORS.text.white 
                          : seat.is_available 
                            ? COLORS.text.primary 
                            : COLORS.text.secondary
                      }
                    ]}>
                      {seat.seat_number}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legend}>
      <Text style={styles.legendTitle}>Légende :</Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatStandard]} />
          <Text style={styles.legendText}>Standard</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatPremium]} />
          <Text style={styles.legendText}>Premium</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatVip]} />
          <Text style={styles.legendText}>VIP</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatUnavailable]} />
          <Text style={styles.legendText}>Occupé</Text>
        </View>
      </View>
    </View>
  );

  const handleContinue = () => {
    const currentSelectedSeats = currentStep === 'outbound' ? selectedSeats : returnSelectedSeats;
    
    if (currentSelectedSeats.length === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins un siège');
      return;
    }

    // Nouvelle logique : si on est en mode "outbound only" (trajet aller VIP seulement)
    if (isOutboundOnly && currentStep === 'outbound') {
      // Retourner à ResultsScreen pour choisir le trajet retour
      navigation.navigate('Results', {
        continueReturnSelection: true,
        outboundSeats: selectedSeats
      });
      return;
    }

    // Gestion des cas avec vipTripOnly
    if (vipTripOnly === 'outbound') {
      // Seul le trajet aller est VIP, aller directement au récapitulatif
      navigation.navigate('Recap', {
        outboundTrip,
        returnTrip,
        selectedSeats,
        returnSelectedSeats: [], // Pas de sièges pour le retour (classic)
        totalPrice: calculateTotalPrice(),
        searchParams
      });
      return;
    }

    if (vipTripOnly === 'return') {
      // Seul le trajet retour est VIP, aller directement au récapitulatif
      navigation.navigate('Recap', {
        outboundTrip,
        returnTrip,
        selectedSeats: [], // Pas de sièges pour l'aller (classic)
        returnSelectedSeats,
        totalPrice: calculateTotalPrice(),
        searchParams
      });
      return;
    }

    if (isRoundTrip && currentStep === 'outbound' && !vipTripOnly) {
      // Si c'est un aller-retour et qu'on est à l'étape aller, passer au retour
      setCurrentStep('return');
      // Réinitialiser les sièges sélectionnés pour le retour
      setReturnSelectedSeats([]);
    } else {
      // Sinon, aller au récapitulatif
      console.log('SeatSelection - Navigating to Recap with:', {
        isRoundTrip,
        outboundTrip,
        returnTrip,
        trip,
        selectedSeats,
        returnSelectedSeats,
        totalPrice
      });

      if (isRoundTrip) {
        navigation.navigate('Recap', {
          outboundTrip,
          returnTrip,
          selectedSeats,
          returnSelectedSeats,
          totalPrice: calculateTotalPrice(),
          searchParams
        });
      } else {
        navigation.navigate('Recap', {
          trip: trip || outboundTrip,
          selectedSeats,
          totalPrice: calculateTotalPrice(),
          searchParams
        });
      }
    }
  };

  // Fonction pour calculer le prix total
  const calculateTotalPrice = () => {
    let total = 0
    
    // Prix du trajet aller (si VIP avec sièges sélectionnés)
    if (outboundTrip?.is_vip && selectedSeats.length > 0) {
      total += outboundTrip.prix * selectedSeats.length
    } else if (outboundTrip && !outboundTrip.is_vip) {
      // Trajet aller classic : prix de base
      total += outboundTrip.prix * (searchParams?.passengers || 1)
    }
    
    // Prix du trajet retour (si VIP avec sièges sélectionnés)
    if (returnTrip?.is_vip && returnSelectedSeats.length > 0) {
      total += returnTrip.prix * returnSelectedSeats.length
    } else if (returnTrip && !returnTrip.is_vip) {
      // Trajet retour classic : prix de base
      total += returnTrip.prix * (searchParams?.passengers || 1)
    }
    
    // Trajet simple
    if (!outboundTrip && !returnTrip && trip) {
      if (trip.is_vip && selectedSeats.length > 0) {
        total += trip.prix * selectedSeats.length
      } else if (!trip.is_vip) {
        total += trip.prix * (searchParams?.passengers || 1)
      }
    }
    
    return total
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Vérification si le trajet actuel nécessite une sélection de sièges */}
      {!currentTripIsVip ? (
        <View style={styles.noSeatSelectionContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Information</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={64} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Trajet Standard</Text>
            <Text style={styles.infoText}>
              Ce trajet ne nécessite pas de sélection de sièges.{'\n'}
              Vous serez redirigé vers le récapitulatif.
            </Text>
            <Button
              title="Continuer"
              onPress={() => {
                // Rediriger vers le récapitulatif approprié
                if (isRoundTrip) {
                  navigation.navigate('Recap', {
                    outboundTrip,
                    returnTrip,
                    selectedSeats: currentStep === 'outbound' ? [] : selectedSeats,
                    returnSelectedSeats: currentStep === 'return' ? [] : returnSelectedSeats,
                    totalPrice: calculateTotalPrice(),
                    searchParams
                  });
                } else {
                  navigation.navigate('Recap', {
                    trip: trip || outboundTrip,
                    selectedSeats: [],
                    totalPrice: calculateTotalPrice(),
                    searchParams
                  });
                }
              }}
              style={{ marginTop: SPACING.lg }}
            />
          </View>
        </View>
      ) : (
      /* Interface normale de sélection de sièges VIP */
      <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Logique intelligente pour la navigation arrière
          if (vipTripOnly === 'return') {
            // Si seul le retour est VIP, retourner à ResultsScreen
            navigation.goBack();
          } else if (vipTripOnly === 'outbound') {
            // Si seul l'aller est VIP, retourner à ResultsScreen  
            navigation.goBack();
          } else if (isRoundTrip && currentStep === 'return' && !vipTripOnly) {
            // Si c'est un aller-retour complet et qu'on est au retour, revenir à l'aller
            setCurrentStep('outbound');
          } else {
            // Dans tous les autres cas, retourner à l'écran précédent
            navigation.goBack();
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Sélection des sièges
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Indicateur de trajet */}
      {(isRoundTrip || isOutboundOnly) && (
        <View style={styles.tripTypeIndicator}>
          <View style={[
            styles.tripBadge, 
            (vipTripOnly === 'return' || (currentStep === 'return' && !vipTripOnly)) ? styles.returnBadge : styles.outboundBadge
          ]}>
            <Ionicons 
              name={(vipTripOnly === 'return' || (currentStep === 'return' && !vipTripOnly)) ? "arrow-back" : "arrow-forward"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.tripBadgeText}>
              {vipTripOnly === 'return' ? 'TRAJET RETOUR (VIP)' : 
               vipTripOnly === 'outbound' ? 'TRAJET ALLER (VIP)' :
               currentStep === 'outbound' ? 'TRAJET ALLER' : 'TRAJET RETOUR'}
            </Text>
          </View>
          {isOutboundOnly && (
            <Text style={styles.nextStepHint}>
              Après cette sélection, vous choisirez votre trajet retour
            </Text>
          )}
          {vipTripOnly && (
            <Text style={styles.nextStepHint}>
              Seul ce trajet nécessite une sélection de sièges
            </Text>
          )}
        </View>
      )}

      {/* Info trajet */}
      <View style={styles.tripInfo}>
        <Text style={styles.tripRoute}>
          {currentTrip?.departure_city || currentTrip?.ville_depart || 'Départ'} → {currentTrip?.arrival_city || currentTrip?.ville_arrivee || 'Arrivée'}
        </Text>
        <Text style={styles.tripDetails}>
          {currentTrip?.departure_time 
            ? new Date(currentTrip.departure_time).toLocaleDateString('fr-FR')
            : currentTrip?.date_depart
            ? currentTrip.date_depart
            : currentTrip?.date
            ? new Date(currentTrip.date).toLocaleDateString('fr-FR')
            : searchParams?.date
            ? searchParams.date.toLocaleDateString('fr-FR')
            : searchParams?.departureDate
            ? searchParams.departureDate
            : 'Date non disponible'} • {currentTrip?.bus_type || currentTrip?.is_vip ? 'VIP' : 'Bus standard'} • {maxSeats} passager(s)
        </Text>
      </View>

      {/* Plan des sièges */}
      {renderBusLayout()}

      {/* Légende */}
      {renderLegend()}

      {/* Sièges sélectionnés et prix */}
      <View style={styles.summary}>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryText}>
            {selectedSeats.length} siège(s) sélectionné(s)
          </Text>
          <Text style={styles.summaryPrice}>
            {isNaN(totalPrice) ? '0' : totalPrice.toLocaleString()} FCFA
          </Text>
        </View>
        
        <Button
          title={
            isOutboundOnly 
              ? 'Choisir le trajet retour'
              : isRoundTrip && currentStep === 'outbound' 
                ? 'Continuer vers le retour' 
                : isRoundTrip && currentStep === 'return'
                  ? 'Finaliser la réservation'
                  : 'Continuer vers le récapitulatif'
          }
          onPress={handleContinue}
          disabled={
            (currentStep === 'outbound' ? selectedSeats : returnSelectedSeats).length === 0
          }
          style={
            (currentStep === 'outbound' ? selectedSeats : returnSelectedSeats).length === 0 
              ? styles.buttonDisabled 
              : null
          }
        />
      </View>
      </>
      )}
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

  noSeatSelectionContainer: {
    flex: 1,
  },

  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },

  infoText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 24,
  },
  
  tripInfo: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  tripDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    fontSize: 16,
    color: COLORS.error,
    marginTop: SPACING.sm,
  },
  
  busContainer: {
    flex: 1,
    padding: SPACING.md,
  },
  
  driverArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  
  driverText: {
    marginLeft: SPACING.sm,
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  seatsScrollView: {
    flex: 1,
  },
  
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  rowNumber: {
    width: 30,
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  seatsInRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  seat: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  
  seatStandard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  
  seatPremium: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  
  seatVip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  
  seatSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  seatUnavailable: {
    backgroundColor: '#EEEEEE',
    borderColor: '#BDBDBD',
  },
  
  seatNumber: {
    fontSize: 10,
    fontWeight: '500',
  },
  
  legend: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  legendItem: {
    alignItems: 'center',
  },
  
  legendSeat: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  
  legendText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },

  tripTypeIndicator: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    alignSelf: 'flex-start',
  },

  outboundBadge: {
    backgroundColor: COLORS.primary,
  },

  returnBadge: {
    backgroundColor: '#FF6B35', // Orange pour le retour
  },

  tripBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },

  nextStepHint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  
  summary: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  summaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  summaryText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  
  summaryPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default SeatSelectionScreen;
