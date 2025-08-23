import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { useBookingsStore } from '../../store';

const BookingDetailsScreen = ({ route, navigation }) => {
  const { bookingId } = route.params;
  const { bookings, cancelBooking } = useBookingsStore();
  
  // Trouver la réservation avec protection
  const booking = bookings.find(b => b.id === bookingId);
  
  // Protection complète - ne pas continuer si booking est undefined
  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détails de la réservation</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Réservation introuvable</Text>
          <Text style={styles.errorSubtitle}>
            Cette réservation n'existe pas ou a été supprimée.
          </Text>
          <Button
            title="Retour"
            onPress={() => navigation.goBack()}
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // S'assurer que toutes les propriétés existent avec des valeurs par défaut
  const safeBooking = {
    departure: booking.departure || booking.trip?.departure_city || 'Ville inconnue',
    arrival: booking.arrival || booking.trip?.arrival_city || 'Ville inconnue',
    date: booking.date || 'Date inconnue',
    time: booking.time || booking.trip?.heure_dep || '00:00',
    arrivalTime: booking.trip?.heure_arr || '00:00', // Ajouter l'heure d'arrivée
    id: booking.id || 'N/A',
    seatNumber: booking.seatNumber || 'N/A',
    busType: booking.busType || 'Standard',
    agency: booking.trip?.agencies?.nom || booking.agency || 'TravelHub', // Utiliser la vraie agence
    price: booking.price || 0,
    status: booking.status || 'unknown',
    passengerName: booking.passengerName || 'Nom non défini',
    passengerPhone: booking.passengerPhone || 'Non défini',
    paymentMethod: booking.paymentMethod || 'Non spécifié',
    bookingDate: booking.bookingDate || new Date().toISOString(),
    duration: booking.duration || 'Durée estimée',
    ...booking
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
      case 'upcoming':
        return {
          color: COLORS.success,
          icon: 'checkmark-circle',
          text: 'Confirmé',
          bgColor: COLORS.success + '15'
        };
      case 'completed':
        return {
          color: COLORS.primary,
          icon: 'checkmark-done',
          text: 'Terminé',
          bgColor: COLORS.primary + '15'
        };
      case 'cancelled':
        return {
          color: COLORS.error,
          icon: 'close-circle',
          text: 'Annulé',
          bgColor: COLORS.error + '15'
        };
      case 'pending':
        return {
          color: COLORS.warning,
          icon: 'time',
          text: 'En attente',
          bgColor: COLORS.warning + '15'
        };
      default:
        return {
          color: COLORS.text.secondary,
          icon: 'help-circle',
          text: status,
          bgColor: COLORS.background
        };
    }
  };

  const statusInfo = getStatusInfo(safeBooking.status);

  const handleCancelBooking = () => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            // Utiliser supabaseId en priorité (UUID de la BD), sinon id local
            const bookingIdToCancel = booking.supabaseId || booking.id;
            console.log('🗑️ Annulation avec ID:', bookingIdToCancel, 'Type:', typeof bookingIdToCancel);
            cancelBooking(bookingIdToCancel);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleShareBooking = async () => {
    try {
      await Share.share({
        message: `🎫 Réservation TravelHub
        
📍 ${safeBooking.departure} → ${safeBooking.arrival}
📅 ${safeBooking.date} à ${safeBooking.time}
🎟️ Référence: ${safeBooking.id}
💺 Siège: ${safeBooking.seatNumber}
🚌 ${safeBooking.busType} - ${safeBooking.agency}
💰 ${safeBooking.price?.toLocaleString()} FCFA

Bon voyage ! 🚌✨`,
        title: 'Ma réservation TravelHub'
      });
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canCancel = (safeBooking.status === 'upcoming' || safeBooking.status === 'confirmed') && 
                    (safeBooking.booking_status !== 'cancelled');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la réservation</Text>
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShareBooking}
        >
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statut de la réservation */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.bgColor }]}>
          <View style={styles.statusContent}>
            <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Informations du voyage */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.sectionTitle}>Informations du voyage</Text>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>{safeBooking.busType}</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{safeBooking.departure}</Text>
              <Text style={styles.cityTime}>{safeBooking.time}</Text>
            </View>
            
            <View style={styles.routeMiddle}>
              <View style={styles.routeLine} />
              <Ionicons name="bus" size={24} color={COLORS.primary} />
              <View style={styles.routeLine} />
            </View>
            
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{safeBooking.arrival}</Text>
              <Text style={styles.cityTime}>
                {safeBooking.arrivalTime}
              </Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={16} color={COLORS.text.secondary} />
            <Text style={styles.dateText}>{formatDate(safeBooking.date)}</Text>
          </View>
        </View>

        {/* Détails de la réservation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>
          
          <View style={styles.detailsList}>
            <DetailItem
              icon="receipt"
              label="Référence"
              value={booking.bookingReference || booking.booking_reference || `TH${safeBooking.id?.slice(-6).toUpperCase()}`}
            />
            <DetailItem
              icon="person"
              label="Siège"
              value={safeBooking.seatNumber}
            />
            <DetailItem
              icon="business"
              label="Agence"
              value={safeBooking.agency}
            />
            <DetailItem
              icon="card"
              label="Moyen de paiement"
              value={safeBooking.paymentMethod}
            />
            <DetailItem
              icon="calendar"
              label="Date de réservation"
              value={new Date(safeBooking.bookingDate).toLocaleDateString('fr-FR')}
            />
          </View>
        </View>

        {/* Montant payé */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Montant payé</Text>
            <Text style={styles.priceValue}>
              {safeBooking.price?.toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.paymentStatusContainer}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.paymentStatusText}>Paiement confirmé</Text>
          </View>
        </View>

        {/* Actions */}
        {canCancel && (
          <View style={styles.actionsContainer}>
            <Button
              title="Annuler la réservation"
              onPress={handleCancelBooking}
              style={[styles.actionButton, styles.cancelButton]}
              textStyle={styles.cancelButtonText}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Composant auxiliaire
const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={16} color={COLORS.text.secondary} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  shareButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  statusCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  tripCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  tripBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  tripBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cityContainer: {
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  cityTime: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  routeMiddle: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  routeLine: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.primary,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsList: {
    marginTop: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  priceLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: SPACING.xs,
  },
  actionsContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    marginBottom: SPACING.md,
  },
  cancelButton: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  cancelButtonText: {
    color: COLORS.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});

export default BookingDetailsScreen;
