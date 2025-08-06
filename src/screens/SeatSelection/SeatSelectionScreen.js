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
  const { trip, searchParams } = route.params;
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Récupérer le nombre de passagers depuis les paramètres de recherche
  const maxSeats = searchParams?.passengers || 1;
  
  // Debug: Vérifier les données reçues
  console.log('SeatSelection - Trip data:', trip);
  console.log('SeatSelection - Trip ID:', trip?.id);
  console.log('SeatSelection - Max seats allowed:', maxSeats);
  console.log('SeatSelection - SearchParams:', searchParams);
  console.log('SeatSelection - Trip price_fcfa:', trip?.price_fcfa);
  console.log('SeatSelection - Trip prix:', trip?.prix);
  
  // Hook pour les sièges en temps réel (avec fallback pour les données mockées)
  const { seatMaps, loading, error } = useRealtimeSeatMaps(trip?.id);
  
  // Fallback pour les données mockées si pas de sièges trouvés
  const [mockSeatMaps, setMockSeatMaps] = useState([]);
  
  useEffect(() => {
    // Si pas de sièges réels, générer des sièges mockés
    if (!loading && (!seatMaps || seatMaps.length === 0)) {
      console.log('Génération de sièges mockés pour le trip:', trip?.id);
      generateMockSeatMaps();
    }
  }, [loading, seatMaps, trip]);

  const generateMockSeatMaps = () => {
    const seats = [];
    const busType = trip?.bus_type || 'classique';
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
    // Calculer le prix total avec fallback pour les données de test
    let basePrice = trip?.price_fcfa || trip?.prix || 0;
    
    // Fallback pour les données de test si aucun prix n'est défini
    if (basePrice === 0) {
      const busType = trip?.bus_type || 'classique';
      const safeBusType = busType && typeof busType === 'string' ? busType.toLowerCase() : 'classique';
      
      if (safeBusType.includes('vip')) {
        basePrice = 15000; // Prix par défaut VIP
      } else if (safeBusType.includes('premium')) {
        basePrice = 12000; // Prix par défaut Premium
      } else {
        basePrice = 8000; // Prix par défaut Standard
      }
      console.log('SeatSelection - Using fallback base price:', basePrice, 'for bus type:', busType);
    }
    
    const seatPriceModifiers = selectedSeats.reduce((sum, seat) => sum + (seat.price_modifier_fcfa || 0), 0);
    const calculatedTotal = (basePrice * selectedSeats.length) + seatPriceModifiers;
    
    // Debug du calcul des prix
    console.log('SeatSelection - Price calculation:', {
      basePrice,
      selectedSeatsCount: selectedSeats.length,
      seatPriceModifiers,
      calculatedTotal
    });
    
    setTotalPrice(calculatedTotal);
  }, [selectedSeats, trip]);

  const handleSeatPress = (seat) => {
    if (!seat.is_available) {
      Alert.alert('Siège indisponible', 'Ce siège est déjà réservé');
      return;
    }

    setSelectedSeats(prev => {
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
    const isSelected = selectedSeats.find(s => s.id === seat.id);
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
    if (selectedSeats.length === 0) {
      Alert.alert('Sélection requise', 'Veuillez sélectionner au moins un siège');
      return;
    }

    // Debug: données transmises à RecapScreen
    console.log('SeatSelection - Navigating to Recap with:', {
      trip,
      selectedSeats,
      totalPrice
    });

    navigation.navigate('Recap', {
      trip,
      selectedSeats,
      totalPrice
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sélection des sièges</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Info trajet */}
      <View style={styles.tripInfo}>
        <Text style={styles.tripRoute}>
          {trip?.departure_city || trip?.ville_depart || 'Départ'} → {trip?.arrival_city || trip?.ville_arrivee || 'Arrivée'}
        </Text>
        <Text style={styles.tripDetails}>
          {trip?.departure_time 
            ? new Date(trip.departure_time).toLocaleDateString('fr-FR')
            : trip?.date_depart
            ? trip.date_depart
            : trip?.date
            ? new Date(trip.date).toLocaleDateString('fr-FR')
            : searchParams?.date
            ? searchParams.date.toLocaleDateString('fr-FR')
            : searchParams?.departureDate
            ? searchParams.departureDate
            : 'Date non disponible'} • {trip?.bus_type || trip?.is_vip ? 'VIP' : 'Bus standard'} • {maxSeats} passager(s)
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
          title="Continuer"
          onPress={handleContinue}
          disabled={selectedSeats.length === 0}
          style={selectedSeats.length === 0 ? styles.buttonDisabled : null}
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
