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
import { busService } from '../../services';
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
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [scrollViewRef, setScrollViewRef] = useState(null);
  
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
  
  // Tous les trajets peuvent maintenant avoir une sélection de sièges
  const currentTripIsVip = currentTrip?.is_vip || false;
  
  // Récupérer le nombre de passagers depuis les paramètres de recherche
  const maxSeats = searchParams?.passengers || searchParams?.passagers || searchParams?.nbPassengers || 1;
  
  console.log('🔍 SeatSelection - Debug info:', {
    maxSeats,
    'searchParams?.passengers': searchParams?.passengers,
    'searchParams?.passagers': searchParams?.passagers,
    'searchParams?.nbPassengers': searchParams?.nbPassengers,
    searchParams
  });
  
  console.log('SeatSelection - Mode:', isRoundTrip ? 'Round trip' : isOutboundOnly ? 'Outbound only (waiting for return)' : 'One way');
  console.log('SeatSelection - Current step:', currentStep);
  console.log('SeatSelection - Current trip:', currentTrip);
  console.log('SeatSelection - Show return selection:', showReturnSelection);
  console.log('SeatSelection - Preselected outbound seats:', preselectedOutboundSeats);
  
  // Hook pour les sièges en temps réel (avec fallback pour les données réelles)
  const { seatMaps, loading, error } = useRealtimeSeatMaps(currentTrip?.id);
  
  // État pour les sièges réels depuis la base de données
  const [realSeatMaps, setRealSeatMaps] = useState([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  
  // Fonction pour récupérer les sièges réels
  const loadRealSeats = async () => {
    if (!currentTrip?.id || !currentTrip?.bus_info?.id) {
      console.log('Pas d\'ID de trajet ou de bus disponible');
      return;
    }

    setIsLoadingSeats(true);
    try {
      // Utiliser la même fonction pour tous les types de bus (VIP, premium, standard)
      console.log('Chargement des sièges pour le trajet:', currentTrip.id);
      const seatLayout = await busService.getVipSeatDisplayLayout(currentTrip.id);
      
      if (seatLayout.stats.totalSeats === 0) {
        console.log('Aucun siège trouvé dans seat_maps, génération de sièges mockés');
        generateMockSeatMaps();
      } else {
        // Convertir le layout en format compatible avec l'interface existante
        const formattedSeats = []
        seatLayout.layout.forEach(row => {
          row.seats.forEach(seat => {
            formattedSeats.push({
              id: `${currentTrip.id}-${seat.seatNumber}`, // Clé unique
              seat_number: seat.seatNumber,
              seat_type: seat.type,
              is_available: seat.isAvailable,
              position_row: row.rowNumber,
              position_column: seat.column,
              price_modifier_fcfa: seat.priceModifier || 0
            })
          })
        })
        setRealSeatMaps(formattedSeats);
        console.log(`Sièges chargés: ${seatLayout.stats.totalSeats} places (${seatLayout.stats.availableSeats} libres, ${seatLayout.stats.occupiedSeats} occupées)`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sièges:', error);
      // En cas d'erreur, générer des sièges mockés
      generateMockSeatMaps();
    } finally {
      setIsLoadingSeats(false);
    }
  };

  useEffect(() => {
    // Charger les vraies données de sièges
    loadRealSeats();
  }, [currentTrip?.id, currentTrip?.bus_info?.id]);
  
  // Fallback pour les données mockées si pas de sièges trouvés
  const [mockSeatMaps, setMockSeatMaps] = useState([]);
  
  useEffect(() => {
    // Si pas de sièges réels après le chargement, générer des sièges mockés
    if (!isLoadingSeats && realSeatMaps.length === 0 && (!seatMaps || seatMaps.length === 0)) {
      console.log('Génération de sièges mockés pour le trip:', currentTrip?.id);
      generateMockSeatMaps();
    }
  }, [isLoadingSeats, realSeatMaps, seatMaps, currentTrip]);

  const generateMockSeatMaps = () => {
    const seats = [];
    // Utiliser les données réelles du bus si disponibles
    const totalSeats = currentTrip?.bus_info?.total_seats || currentTrip?.total_seats || 40;
    const isVipBus = currentTrip?.bus_info?.is_vip || currentTrip?.is_vip || false;
    
    // Configuration basée sur le type de bus réel
    const seatsPerRow = isVipBus ? 3 : 4; // VIP: 1+2, Standard: 2+2
    const rows = Math.ceil(totalSeats / seatsPerRow);
    
    let seatNumber = 1;
    
    for (let row = 1; row <= rows && seatNumber <= totalSeats; row++) {
      if (isVipBus) {
        // Configuration VIP: 1 siège à gauche, 2 sièges à droite
        const positions = ['A', 'C', 'D']; // A = gauche, C et D = droite
        
        positions.forEach((letter, index) => {
          if (seatNumber <= totalSeats) {
            seats.push({
              id: `mock_${currentTrip?.id || 'unknown'}_${seatNumber}`,
              trip_id: currentTrip?.id || 'unknown',
              seat_number: seatNumber,
              row_number: row,
              seat_letter: letter,
              seat_type: index === 0 ? 'window' : (index === 1 ? 'aisle' : 'window'),
              is_vip: true,
              position: index === 0 ? 'left' : 'right',
              is_available: Math.random() > 0.3, // 70% de sièges disponibles
              is_occupied: Math.random() <= 0.3,
              price_modifier_fcfa: 1000
            });
            seatNumber++;
          }
        });
      } else {
        // Configuration standard: 2 sièges à gauche, 2 sièges à droite
        const positions = [
          { letter: 'A', type: 'window', side: 'left' },
          { letter: 'B', type: 'aisle', side: 'left' },
          { letter: 'C', type: 'aisle', side: 'right' },
          { letter: 'D', type: 'window', side: 'right' }
        ];
        
        positions.forEach(pos => {
          if (seatNumber <= totalSeats) {
            seats.push({
              id: `mock_${currentTrip?.id || 'unknown'}_${seatNumber}`,
              trip_id: currentTrip?.id || 'unknown',
              seat_number: seatNumber,
              row_number: row,
              seat_letter: pos.letter,
              seat_type: pos.type,
              is_vip: false,
              position: pos.side,
              is_available: Math.random() > 0.3, // 70% de sièges disponibles
              is_occupied: Math.random() <= 0.3,
              price_modifier_fcfa: 0
            });
            seatNumber++;
          }
        });
      }
    }
    
    setMockSeatMaps(seats);
  };

  // Utiliser les sièges réels en priorité, puis les sièges du hook temps réel, puis les mockés
  const availableSeats = realSeatMaps.length > 0 
    ? realSeatMaps 
    : (seatMaps && seatMaps.length > 0 ? seatMaps : mockSeatMaps);

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
    console.log('🎯 Siège cliqué:', { 
      id: seat.id, 
      seat_number: seat.seat_number, 
      is_available: seat.is_available 
    });

    if (!seat.is_available) {
      Alert.alert('Siège indisponible', 'Ce siège est déjà réservé');
      return;
    }

    const currentSeats = currentStep === 'outbound' ? selectedSeats : returnSelectedSeats;
    const setCurrentSeats = currentStep === 'outbound' ? setSelectedSeats : setReturnSelectedSeats;

    console.log('🔍 Sièges actuellement sélectionnés:', currentSeats.map(s => ({ id: s.id, number: s.seat_number })));

    setCurrentSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      console.log('📍 Siège déjà sélectionné?', isSelected ? 'OUI' : 'NON');
      
      if (isSelected) {
        // Désélectionner
        console.log('❌ Désélection du siège', seat.seat_number);
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
        console.log('✅ Sélection du siège', seat.seat_number);
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

  // Fonction pour gérer le scroll et détecter s'il y a encore du contenu
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setCanScrollDown(!isCloseToBottom && contentSize.height > layoutMeasurement.height);
  };

  const handleScrollViewLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    // Vérifier initialement s'il y a assez de contenu pour scroller
    if (scrollViewRef) {
      scrollViewRef.measure((x, y, width, contentHeight, pageX, pageY) => {
        setCanScrollDown(contentHeight > height);
      });
    }
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
        <View style={styles.seatsContainer}>
          <ScrollView 
            ref={setScrollViewRef}
            style={styles.seatsScrollView} 
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            onLayout={handleScrollViewLayout}
            scrollEventThrottle={16}
          >
            {sortedRows.map(({ rowNum, seats }) => {
              // Diviser les sièges en deux colonnes (gauche et droite) avec un espace central
              const leftSeats = seats.filter(seat => seat.position_column <= 2);
              const rightSeats = seats.filter(seat => seat.position_column > 2);
              
              return (
                <View key={rowNum} style={styles.seatRow}>
                  <Text style={styles.rowNumber}>{rowNum}</Text>
                  
                  {/* Colonne gauche */}
                  <View style={styles.leftColumn}>
                    {leftSeats.map((seat, index) => (
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
                                ? COLORS.text.white // Texte blanc sur fond orange
                                : COLORS.text.secondary
                          } 
                        />
                        <Text style={[
                          styles.seatNumber,
                          { color: selectedSeats.find(s => s.id === seat.id) 
                              ? COLORS.text.white 
                              : seat.is_available 
                                ? COLORS.text.white // Texte blanc sur fond orange
                                : COLORS.text.secondary
                          }
                        ]}>
                          {seat.seat_number}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* Espace central (couloir) avec indicateur visuel */}
                  <View style={styles.centralAisle}>
                    <View style={styles.aisleIndicator}>
                      <View style={styles.aisleLine} />
                      <Ionicons name="footsteps" size={12} color={COLORS.primary} />
                      <View style={styles.aisleLine} />
                    </View>
                  </View>
                  
                  {/* Colonne droite */}
                  <View style={styles.rightColumn}>
                    {rightSeats.map((seat, index) => (
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
                                ? COLORS.text.white // Texte blanc sur fond orange
                                : COLORS.text.secondary
                          } 
                        />
                        <Text style={[
                          styles.seatNumber,
                          { color: selectedSeats.find(s => s.id === seat.id) 
                              ? COLORS.text.white 
                              : seat.is_available 
                                ? COLORS.text.white // Texte blanc sur fond orange
                                : COLORS.text.secondary
                          }
                        ]}>
                          {seat.seat_number}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          
          {/* Indicateur de scroll vers le bas */}
          {canScrollDown && (
            <View style={styles.scrollIndicator}>
              <View style={styles.scrollIndicatorContent}>
                <Ionicons name="chevron-down" size={16} color={COLORS.text.secondary} />
                <Text style={styles.scrollIndicatorText}>Plus de sièges disponibles</Text>
                <Ionicons name="chevron-down" size={16} color={COLORS.text.secondary} />
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderLegend = () => (
    <View style={styles.legend}>
      <Text style={styles.legendTitle}>Légende :</Text>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatSelected]}>
            <Ionicons name="checkmark" size={12} color={COLORS.text.white} />
          </View>
          <Text style={styles.legendText}>Sélectionné</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatStandard]}>
            <Ionicons name="person-outline" size={12} color={COLORS.text.white} />
          </View>
          <Text style={styles.legendText}>Disponible</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSeat, styles.seatUnavailable]}>
            <Ionicons name="close" size={12} color={COLORS.text.secondary} />
          </View>
          <Text style={styles.legendText}>Occupé</Text>
        </View>
      </View>
    </View>
  );

  const handleContinue = () => {
    const currentSelectedSeats = currentStep === 'outbound' ? selectedSeats : returnSelectedSeats;
    
    console.log('🚀 handleContinue - Debug:', {
      currentStep,
      'currentSelectedSeats.length': currentSelectedSeats.length,
      maxSeats,
      'selectedSeats.length': selectedSeats.length,
      'returnSelectedSeats.length': returnSelectedSeats.length,
      isRoundTrip,
      vipTripOnly,
      isOutboundOnly
    });
    
    if (currentSelectedSeats.length === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins un siège');
      return;
    }

    // Vérifier que le nombre de sièges correspond au nombre de passagers
    if (currentSelectedSeats.length !== maxSeats) {
      console.log('❌ Validation échouée:', {
        'currentSelectedSeats.length': currentSelectedSeats.length,
        maxSeats,
        'expected': maxSeats,
        'actual': currentSelectedSeats.length
      });
      Alert.alert(
        'Sélection incomplète', 
        `Vous devez sélectionner exactement ${maxSeats} siège(s) pour ${maxSeats} passager(s). Actuellement sélectionnés : ${currentSelectedSeats.length}`
      );
      return;
    }

    console.log(`✅ Validation OK: ${currentSelectedSeats.length} siège(s) sélectionné(s) pour ${maxSeats} passager(s)`);

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
    
    // Prix du trajet aller (avec sièges sélectionnés)
    if (outboundTrip && selectedSeats.length > 0) {
      // Calculer le prix de base selon le nombre de sièges sélectionnés
      const basePrice = outboundTrip.prix || outboundTrip.price_fcfa || 0;
      total += basePrice * selectedSeats.length;
      
      // Ajouter les suppléments des sièges
      const seatModifiers = selectedSeats.reduce((sum, seat) => sum + (seat.price_modifier_fcfa || 0), 0);
      total += seatModifiers;
    } else if (outboundTrip && selectedSeats.length === 0) {
      // Fallback: prix de base selon le nombre de passagers
      total += (outboundTrip.prix || outboundTrip.price_fcfa || 0) * (searchParams?.passengers || 1)
    }
    
    // Prix du trajet retour (avec sièges sélectionnés)
    if (returnTrip && returnSelectedSeats.length > 0) {
      // Calculer le prix de base selon le nombre de sièges sélectionnés
      const basePrice = returnTrip.prix || returnTrip.price_fcfa || 0;
      total += basePrice * returnSelectedSeats.length;
      
      // Ajouter les suppléments des sièges
      const seatModifiers = returnSelectedSeats.reduce((sum, seat) => sum + (seat.price_modifier_fcfa || 0), 0);
      total += seatModifiers;
    } else if (returnTrip && returnSelectedSeats.length === 0) {
      // Fallback: prix de base selon le nombre de passagers
      total += (returnTrip.prix || returnTrip.price_fcfa || 0) * (searchParams?.passengers || 1)
    }
    
    // Trajet simple
    if (!outboundTrip && !returnTrip && trip) {
      if (selectedSeats.length > 0) {
        // Calculer le prix de base selon le nombre de sièges sélectionnés
        const basePrice = trip.prix || trip.price_fcfa || 0;
        total += basePrice * selectedSeats.length;
        
        // Ajouter les suppléments des sièges
        const seatModifiers = selectedSeats.reduce((sum, seat) => sum + (seat.price_modifier_fcfa || 0), 0);
        total += seatModifiers;
      } else {
        // Fallback: prix de base selon le nombre de passagers
        total += (trip.prix || trip.price_fcfa || 0) * (searchParams?.passengers || 1)
      }
    }
    
    return total
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Afficher un indicateur de chargement pendant le chargement des sièges */}
      {(isLoadingSeats || loading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des sièges disponibles...</Text>
        </View>
      ) : (
      /* Interface de sélection de sièges pour tous les types de transports */
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
            {(currentStep === 'outbound' ? selectedSeats : returnSelectedSeats).length} / {maxSeats} siège(s) sélectionné(s)
          </Text>
          <Text style={styles.summarySubtext}>
            {maxSeats > 1 ? `Sélectionnez ${maxSeats} sièges pour ${maxSeats} passagers` : 'Sélectionnez votre siège'}
          </Text>
          <Text style={styles.summaryPrice}>
            {isNaN(totalPrice) || totalPrice === null || totalPrice === undefined ? '0' : Number(totalPrice).toLocaleString()} FCFA
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
  
  seatsContainer: {
    flex: 1,
    position: 'relative',
  },
  
  scrollIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
  
  scrollIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  scrollIndicatorText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginHorizontal: SPACING.xs,
    fontStyle: 'italic',
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
  
  leftColumn: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Rapprocher vers le centre (côté droit de la colonne gauche)
    flex: 1,
    paddingRight: 28, // Espace plus important pour voir la différence
  },
  
  rightColumn: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Rapprocher vers le centre (côté gauche de la colonne droite)
    flex: 1,
    paddingLeft: 28, // Espace plus important pour voir la différence
  },
  
  centralAisle: {
    width: 25, // Augmenter temporairement pour voir si ça change
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  aisleIndicator: {
    height: 40,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  
  aisleText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  aisleLine: {
    width: 2,
    height: 12,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },
  
  aisleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.text.secondary,
    opacity: 0.4,
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
    marginHorizontal: 2, // Rapprocher les sièges dans chaque colonne
  },
  
  seatStandard: {
    backgroundColor: '#FF9800', // Orange pour les sièges disponibles
    borderColor: '#F57C00',
  },
  
  seatPremium: {
    backgroundColor: '#FF9800', // Orange pour les sièges disponibles
    borderColor: '#F57C00',
  },
  
  seatVip: {
    backgroundColor: '#FF9800', // Orange pour les sièges disponibles
    borderColor: '#F57C00',
  },
  
  seatSelected: {
    backgroundColor: COLORS.primary, // Bleu pour les sièges sélectionnés
    borderColor: COLORS.primary,
  },
  
  seatUnavailable: {
    backgroundColor: '#EEEEEE', // Gris pour les sièges occupés
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
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: SPACING.md,
  },
  
  summaryText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  
  summarySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 4,
  },
  
  summaryPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
  
  buttonDisabled: {
    opacity: 0.5,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },

  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default SeatSelectionScreen;
