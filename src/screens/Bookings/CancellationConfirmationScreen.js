import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { balanceService } from '../../services/balanceService';
import { useAuthStore } from '../../store';

const CancellationConfirmationScreen = ({ route, navigation }) => {
  const { booking } = route.params;
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [calculating, setCalculating] = useState(true);
  const [lastClickTime, setLastClickTime] = useState(0); // Pour empêcher les clics multiples

  useEffect(() => {
    console.log('📋 useEffect CancellationConfirmation - booking reçu:', booking);
    calculateCancellationFees();
  }, []);

  const calculateCancellationFees = async () => {
    console.log('💰 Début calculateCancellationFees');
    setCalculating(true);
    try {
      const bookingPrice = booking.total_price_fcfa || booking.price || 0;
      console.log('💰 Prix booking pour calcul:', bookingPrice);
      
      const result = await balanceService.calculateCancellationFees(bookingPrice);
      console.log('💰 Résultat calcul frais:', result);
      
      setCancellationInfo(result);
    } catch (error) {
      console.error('❌ Erreur calcul frais:', error);
      Alert.alert('Erreur', 'Impossible de calculer les frais d\'annulation');
      navigation.goBack();
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancellationInfo || loading) return; // Empêcher les clics si déjà en cours
    
    // Empêcher les clics multiples rapides
    if (Date.now() - lastClickTime < 2000) {
      console.log('⚠️ Clic trop rapide ignoré');
      return;
    }
    
    setLastClickTime(Date.now());

    Alert.alert(
      'Confirmer l\'annulation',
      `Êtes-vous absolument sûr de vouloir annuler cette réservation ? ${cancellationInfo.refund.toLocaleString()} FCFA seront ajoutés à votre solde.`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: processCancellation
        }
      ]
    );
  };

  const processCancellation = async () => {
    console.log('🔄 Début processCancellation');
    console.log('📋 Données booking:', booking);
    console.log('👤 Utilisateur actuel:', user);
    
    // Éviter le double traitement
    if (loading) {
      console.log('⚠️ Annulation déjà en cours, ignoré');
      return;
    }
    
    setLoading(true);
    try {
      const bookingId = booking.supabaseId || booking.id;
      const userId = booking.user_id || user?.id;
      
      console.log('🔑 IDs pour annulation:', { bookingId, userId });
      
      if (!bookingId || !userId) {
        console.error('❌ IDs manquants:', { bookingId, userId, booking, user });
        Alert.alert('Erreur', 'Impossible d\'identifier la réservation ou l\'utilisateur');
        setLoading(false); // Important: réinitialiser loading en cas d'erreur
        return;
      }

      const result = await balanceService.cancelBookingWithRefund(bookingId, userId);
      
      console.log('📋 Résultat annulation:', result);

      if (result.success) {
        console.log('✅ Annulation réussie');
        Alert.alert(
          'Annulation réussie',
          `Votre réservation a été annulée. ${result.data.refundAmount.toLocaleString()} FCFA ont été ajoutés à votre solde.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Revenir à l'onglet Home tout en conservant la barre d'onglets
                navigation.navigate('ClientMain', {
                  screen: 'Home'
                });
              }
            }
          ]
        );
      } else {
        console.error('❌ Échec annulation:', result.error);
        
        // Gérer les cas d'erreur spécifiques
        if (result.error?.code === 'DUPLICATE_CANCELLATION' || result.error?.code === 'DUPLICATE_TRANSACTION') {
          // C'est une tentative de duplication, on peut afficher un message plus approprié
          Alert.alert(
            'Annulation déjà en cours',
            'Votre demande d\'annulation est déjà en cours de traitement. Veuillez patienter.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
        } else if (result.code === 'ALREADY_CANCELLED') {
          // Réservation déjà annulée
          Alert.alert(
            'Déjà annulée',
            'Cette réservation a déjà été annulée.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
        } else {
          // Autres erreurs
          Alert.alert(
            'Erreur',
            result.error?.message || 'Impossible d\'annuler la réservation. Veuillez réessayer plus tard.'
          );
        }
      }
    } catch (error) {
      console.error('❌ Erreur processCancellation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'annulation. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  if (calculating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Annulation</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Calcul des frais d'annulation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Annulation</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Avertissement */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color={COLORS.warning} />
          <Text style={styles.warningTitle}>Attention</Text>
          <Text style={styles.warningText}>
            Des frais d'annulation seront appliqués à votre réservation.
          </Text>
        </View>

        {/* Détails de la réservation */}
        <View style={styles.bookingCard}>
          <Text style={styles.sectionTitle}>Détails de la réservation</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trajet</Text>
            <Text style={styles.detailValue}>
              {booking.departure} → {booking.arrival}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{booking.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Siège</Text>
            <Text style={styles.detailValue}>{booking.seatNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Prix original</Text>
            <Text style={styles.detailValuePrice}>
              {(booking.total_price_fcfa || booking.price || 0).toLocaleString()} FCFA
            </Text>
          </View>
        </View>

        {/* Calcul des frais */}
        {cancellationInfo && (
          <View style={styles.feesCard}>
            <Text style={styles.sectionTitle}>Calcul du remboursement</Text>
            
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Prix de la réservation</Text>
              <Text style={styles.feeValue}>
                {(booking.total_price_fcfa || booking.price || 0).toLocaleString()} FCFA
              </Text>
            </View>
            
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>
                Frais d'annulation ({cancellationInfo.feePercent}%)
              </Text>
              <Text style={styles.feeValueNegative}>
                -{cancellationInfo.fee.toLocaleString()} FCFA
              </Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.feeRow}>
              <Text style={styles.refundLabel}>Montant remboursé</Text>
              <Text style={styles.refundValue}>
                +{cancellationInfo.refund.toLocaleString()} FCFA
              </Text>
            </View>
            
            <Text style={styles.refundNote}>
              Ce montant sera ajouté à votre solde et pourra être utilisé pour vos prochaines réservations.
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Retour</Text>
          </TouchableOpacity>
          
          <Button
            title={loading ? "Annulation..." : "Confirmer l'annulation"}
            onPress={handleConfirmCancellation}
            disabled={loading || !cancellationInfo}
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            loading={loading}
          />
        </View>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  
  warningCard: {
    backgroundColor: COLORS.warning + '10',
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginVertical: SPACING.xs,
  },
  
  warningText: {
    fontSize: 14,
    color: COLORS.warning,
    textAlign: 'center',
  },
  
  bookingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  feesCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  detailValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  detailValuePrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  
  feeLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    flex: 1,
  },
  
  feeValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  
  feeValueNegative: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },
  
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  
  refundLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  
  refundValue: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  
  refundNote: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  
  cancelButtonText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  
  confirmButton: {
    flex: 2,
  },
  
  confirmButtonDisabled: {
    opacity: 0.6,
  },
});

export default CancellationConfirmationScreen;
