import React, { useState } from 'react';
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

const RecapScreen = ({ route, navigation }) => {
  const { trip, selectedSeats, totalPrice } = route.params;
  const [loading, setLoading] = useState(false);

  console.log('RecapScreen - Data received:', { trip, selectedSeats, totalPrice });

  const handlePayment = () => {
    navigation.navigate('Payment', { trip, selectedSeats, totalPrice });
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
        {/* Détails du voyage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du voyage</Text>
          
          <View style={styles.tripCard}>
            <View style={styles.routeContainer}>
              <View style={styles.cityInfo}>
                <Text style={styles.time}>{trip?.heure_dep || 'N/A'}</Text>
                <Text style={styles.city}>{trip?.ville_depart || 'Départ'}</Text>
              </View>
              
              <View style={styles.arrow}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
              </View>
              
              <View style={styles.cityInfo}>
                <Text style={styles.time}>{trip?.heure_arr || 'N/A'}</Text>
                <Text style={styles.city}>{trip?.ville_arrivee || 'Arrivée'}</Text>
              </View>
            </View>
            
            <View style={styles.busInfo}>
              <Ionicons name="bus" size={16} color={COLORS.primary} />
              <Text style={styles.busType}>
                {trip?.is_vip ? 'VIP' : 'STANDARD'}
              </Text>
            </View>
          </View>
        </View>

        {/* Sièges sélectionnés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sièges sélectionnés</Text>
          
          {selectedSeats?.map((seat, index) => (
            <View key={seat.id} style={styles.seatItem}>
              <Text style={styles.seatNumber}>Siège {seat.seat_number}</Text>
              <Text style={styles.seatPrice}>{trip?.prix || 4200} FCFA</Text>
            </View>
          ))}
        </View>

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
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {selectedSeats?.length || 0} billet(s) × {trip?.prix || 4200} FCFA
              </Text>
              <Text style={styles.priceValue}>
                {((selectedSeats?.length || 0) * (trip?.prix || 4200)).toLocaleString()} FCFA
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalValue}>
                {totalPrice?.toLocaleString() || '0'} FCFA
              </Text>
            </View>
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
  
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});

export default RecapScreen;