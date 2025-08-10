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
  
  // Trouver la réservation
  const booking = bookings.find(b => b.id === bookingId);
  
  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Réservation introuvable</Text>
          <Text style={styles.errorSubtitle}>
            Cette réservation n'existe pas ou a été supprimée
          </Text>
          <Button
            title="Retour"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'upcoming':
      case 'confirmed':
        return {
          color: COLORS.success,
          icon: 'checkmark-circle',
          text: 'Confirmé',
          bgColor: COLORS.success + '15'
        };
      case 'completed':
        return {
          color: COLORS.primary,
          icon: 'flag',
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

  const statusInfo = getStatusInfo(booking.status);

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
            cancelBooking(booking.id);
            Alert.alert(
              'Réservation annulée',
              'Votre réservation a été annulée avec succès.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        }
      ]
    );
  };

  const handleShareBooking = async () => {
    try {
      await Share.share({
        message: `🎫 Réservation TravelHub
        
📍 ${booking.departure} → ${booking.arrival}
📅 ${booking.date} à ${booking.time}
🎟️ Référence: ${booking.id}
💺 Siège: ${booking.seatNumber}
🚌 ${booking.busType} - ${booking.agency}
💰 ${booking.price?.toLocaleString()} FCFA

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

  const canCancel = booking.status === 'upcoming' || booking.status === 'confirmed';

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
        {/* Statut */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.bgColor }]}>
          <Ionicons name={statusInfo.icon} size={32} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>

        {/* Informations du voyage */}
        <View style={styles.tripCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.sectionTitle}>Informations du voyage</Text>
            <View style={styles.tripBadge}>
              <Text style={styles.tripBadgeText}>{booking.busType}</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{booking.departure}</Text>
              <Text style={styles.cityTime}>{booking.time}</Text>
            </View>
            
            <View style={styles.routeMiddle}>
              <View style={styles.routeLine} />
              <Ionicons name="bus" size={24} color={COLORS.primary} />
              <View style={styles.routeLine} />
            </View>
            
            <View style={styles.cityContainer}>
              <Text style={styles.cityName}>{booking.arrival}</Text>
              <Text style={styles.cityTime}>
                {booking.duration || 'Durée estimée'}
              </Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={16} color={COLORS.text.secondary} />
            <Text style={styles.dateText}>{formatDate(booking.date)}</Text>
          </View>
        </View>

        {/* Détails de la réservation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>
          
          <View style={styles.detailsList}>
            <DetailItem
              icon="receipt"
              label="Référence"
              value={booking.id}
            />
            <DetailItem
              icon="person"
              label="Siège"
              value={booking.seatNumber}
            />
            <DetailItem
              icon="business"
              label="Agence"
              value={booking.agency}
            />
            <DetailItem
              icon="card"
              label="Moyen de paiement"
              value={booking.paymentMethod}
            />
            <DetailItem
              icon="calendar"
              label="Date de réservation"
              value={new Date(booking.bookingDate).toLocaleDateString('fr-FR')}
            />
          </View>
        </View>

        {/* Montant payé */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Paiement</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Montant payé</Text>
            <Text style={styles.priceValue}>
              {booking.price?.toLocaleString()} FCFA
            </Text>
          </View>
          <View style={styles.paymentStatusContainer}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.paymentStatusText}>Paiement confirmé</Text>
          </View>
        </View>

        {/* Instructions importantes */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informations importantes</Text>
          
          <View style={styles.instructionsList}>
            <InstructionItem
              icon="time"
              text="Présentez-vous 30 minutes avant le départ"
              color={COLORS.warning}
            />
            <InstructionItem
              icon="card"
              text="Munissez-vous d'une pièce d'identité valide"
              color={COLORS.info}
            />
            <InstructionItem
              icon="phone-portrait"
              text="Gardez cette confirmation sur votre téléphone"
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* Espace pour les boutons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Actions en bas */}
      <View style={styles.footer}>
        {canCancel && (
          <Button
            title="Annuler la réservation"
            onPress={handleCancelBooking}
            variant="outline"
            style={[styles.actionButton, styles.cancelButton]}
          />
        )}
        <Button
          title="Contacter l'agence"
          onPress={() => Alert.alert('Contact', 'Fonctionnalité bientôt disponible')}
          style={styles.actionButton}
        />
      </View>
    </SafeAreaView>
  );
};

// Composants auxiliaires
const DetailItem = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <View style={styles.detailLeft}>
      <Ionicons name={icon} size={16} color={COLORS.text.secondary} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const InstructionItem = ({ icon, text, color }) => (
  <View style={styles.instructionItem}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={styles.instructionText}>{text}</Text>
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
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  
  tripCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  
  tripBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  tripBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  cityContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  cityName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  cityTime: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  routeMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  
  routeLine: {
    height: 2,
    backgroundColor: COLORS.primary,
    flex: 1,
  },
  
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  dateText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
    textTransform: 'capitalize',
  },
  
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  detailsList: {
    gap: SPACING.md,
  },
  
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginBottom: SPACING.sm,
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
    justifyContent: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.success + '15',
    borderRadius: BORDER_RADIUS.sm,
  },
  
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  
  instructionsList: {
    gap: SPACING.md,
  },
  
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  instructionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  
  actionButton: {
    borderRadius: BORDER_RADIUS.md,
  },
  
  cancelButton: {
    borderColor: COLORS.error,
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
    marginBottom: SPACING.sm,
  },
  
  errorSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  
  backButton: {
    marginTop: SPACING.md,
  },
});

export default BookingDetailsScreen;
