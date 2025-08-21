import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { busService, tripService } from '../services';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const VipSeatDisplayScreen = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seatLayout, setSeatLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    setLoading(true);
    try {
      // Rechercher quelques trajets pour tester
      const testTrips = await tripService.searchTrips({
        departure: 'Douala',
        arrival: 'Yaoundé',
        date: new Date().toISOString().split('T')[0]
      });
      setTrips(testTrips.slice(0, 5)); // Prendre seulement les 5 premiers
    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error);
      Alert.alert('Erreur', 'Impossible de charger les trajets');
    } finally {
      setLoading(false);
    }
  };

  const loadSeatLayout = async (trip) => {
    setSeatLoading(true);
    try {
      const layout = await busService.getVipSeatDisplayLayout(trip.id);
      setSeatLayout(layout);
      setSelectedTrip(trip);
      console.log('Layout chargé:', layout);
    } catch (error) {
      console.error('Erreur lors du chargement du plan des sièges:', error);
      Alert.alert('Erreur', 'Impossible de charger le plan des sièges');
    } finally {
      setSeatLoading(false);
    }
  };

  const renderSeat = (seat, rowNumber) => {
    const isOccupied = !seat.isAvailable;
    const isVip = seat.type === 'vip';
    
    return (
      <TouchableOpacity
        key={`${rowNumber}-${seat.seatNumber}`}
        style={[
          styles.seat,
          isOccupied ? styles.occupiedSeat : styles.availableSeat,
          isVip && styles.vipSeat
        ]}
        disabled={isOccupied}
      >
        <Ionicons 
          name={isOccupied ? "person" : "car-sport"} 
          size={16} 
          color={isOccupied ? COLORS.white : COLORS.primary} 
        />
        <Text style={[
          styles.seatNumber,
          { color: isOccupied ? COLORS.white : COLORS.primary }
        ]}>
          {seat.seatNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderRow = (row) => {
    return (
      <View key={row.rowNumber} style={styles.row}>
        <Text style={styles.rowNumber}>{row.rowNumber}</Text>
        
        {/* Côté gauche - 1 siège pour VIP */}
        <View style={styles.leftSide}>
          {row.seats
            .filter(seat => seat.column <= 1)
            .map(seat => renderSeat(seat, row.rowNumber))
          }
        </View>

        {/* Allée centrale */}
        <View style={styles.aisle} />

        {/* Côté droit - 2 sièges pour VIP */}
        <View style={styles.rightSide}>
          {row.seats
            .filter(seat => seat.column > 1)
            .map(seat => renderSeat(seat, row.rowNumber))
          }
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Plan des sièges VIP</Text>
      </View>

      {!selectedTrip ? (
        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Sélectionner un trajet pour voir le plan des sièges</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            trips.map((trip, index) => (
              <TouchableOpacity
                key={trip.id || index}
                style={styles.tripCard}
                onPress={() => loadSeatLayout(trip)}
              >
                <View style={styles.tripInfo}>
                  <Text style={styles.tripRoute}>
                    {trip.ville_depart} → {trip.ville_arrivee}
                  </Text>
                  <Text style={styles.tripTime}>
                    {trip.heure_dep} - {trip.heure_arr}
                  </Text>
                  <Text style={styles.tripPrice}>
                    {trip.prix} FCFA {trip.is_vip ? '(VIP)' : ''}
                  </Text>
                  <Text style={styles.tripSeats}>
                    {trip.available_seats} places disponibles sur {trip.total_seats}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          <TouchableOpacity 
            style={styles.changeTrip}
            onPress={() => {
              setSelectedTrip(null);
              setSeatLayout(null);
            }}
          >
            <Text style={styles.changeTripText}>← Changer de trajet</Text>
          </TouchableOpacity>

          <View style={styles.selectedTripCard}>
            <Text style={styles.selectedTripTitle}>
              {selectedTrip.ville_depart} → {selectedTrip.ville_arrivee}
            </Text>
            <Text style={styles.selectedTripTime}>
              {selectedTrip.heure_dep} - {selectedTrip.heure_arr}
            </Text>
            <Text style={styles.selectedTripPrice}>
              {selectedTrip.prix} FCFA {selectedTrip.is_vip ? '(VIP)' : ''}
            </Text>
          </View>

          {seatLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : seatLayout ? (
            <View style={styles.seatMapContainer}>
              {/* Statistiques */}
              <View style={styles.statsContainer}>
                <View style={[styles.statChip, { backgroundColor: COLORS.error }]}>
                  <Text style={styles.statText}>
                    {seatLayout.stats.occupiedSeats} occupés
                  </Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.statText}>
                    {seatLayout.stats.availableSeats} libres
                  </Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: COLORS.warning }]}>
                  <Text style={styles.statText}>
                    {seatLayout.stats.totalSeats} total
                  </Text>
                </View>
              </View>

              {/* En-tête conducteur */}
              <View style={styles.driverSection}>
                <Ionicons name="car" size={20} color={COLORS.white} />
                <Text style={styles.driverText}>Conducteur</Text>
              </View>

              {/* Plan des sièges */}
              <View style={styles.seatMap}>
                {seatLayout.layout.map(row => renderRow(row))}
              </View>

              {/* Sortie de secours */}
              <View style={styles.exitSection}>
                <Ionicons name="exit" size={20} color={COLORS.white} />
                <Text style={styles.exitText}>Sortie de secours</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noSeatsText}>Aucun plan de sièges disponible</Text>
          )}
        </ScrollView>
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
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tripInfo: {
    flex: 1,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  tripTime: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  tripPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  tripSeats: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  changeTrip: {
    marginBottom: SPACING.md,
  },
  changeTripText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  selectedTripCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  selectedTripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  selectedTripTime: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  selectedTripPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  seatMapContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  statChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  statText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  driverSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  driverText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  seatMap: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  rowNumber: {
    width: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  leftSide: {
    flexDirection: 'row',
    marginLeft: SPACING.sm,
  },
  rightSide: {
    flexDirection: 'row',
  },
  aisle: {
    width: 30,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderStyle: 'dotted',
    marginHorizontal: SPACING.sm,
  },
  seat: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  availableSeat: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.lightGreen,
  },
  occupiedSeat: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error,
  },
  vipSeat: {
    borderWidth: 3,
  },
  seatNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  exitSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  exitText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  noSeatsText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 16,
    marginTop: SPACING.xl,
  },
});

export default VipSeatDisplayScreen;
