import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

const PaymentScreen = ({ route, navigation }) => {
  const { trip, selectedSeats, totalPrice } = route.params;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // États pour les formulaires de paiement
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  console.log('PaymentScreen - Data received:', { trip, selectedSeats, totalPrice });

  const paymentMethods = [
    {
      id: 'orange_money',
      name: 'Orange Money',
      icon: 'phone-portrait',
      color: '#FF7900',
      description: 'Paiement mobile Orange'
    },
    {
      id: 'mtn_momo',
      name: 'MTN Mobile Money',
      icon: 'phone-portrait',
      color: '#FFCC00',
      description: 'Paiement mobile MTN'
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: 'card',
      color: COLORS.primary,
      description: 'Visa, Mastercard'
    }
  ];

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner un moyen de paiement');
      return;
    }

    // Afficher le formulaire de paiement
    setShowPaymentForm(true);
  };

  const processPayment = async () => {
    setProcessing(true);

    try {
      // Validation selon le type de paiement
      if (selectedPaymentMethod === 'card') {
        if (!cardNumber || !expiryDate || !cvv || !cardName) {
          Alert.alert('Erreur', 'Veuillez remplir tous les champs de la carte');
          setProcessing(false);
          return;
        }
      } else if (selectedPaymentMethod === 'orange_money' || selectedPaymentMethod === 'mtn_momo') {
        if (!phoneNumber) {
          Alert.alert('Erreur', 'Veuillez saisir votre numéro de téléphone');
          setProcessing(false);
          return;
        }
        
        // Pour les paiements mobiles, simuler directement le succès
        // Simuler le traitement du paiement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Créer une réservation factice pour le succès
        const mockBooking = {
          booking_reference: `TH${Date.now()}`,
          booking_status: 'confirmed',
          payment_status: 'completed',
          total_price_fcfa: totalPrice,
          trip: trip,
          selectedSeats: selectedSeats,
          payment_method: selectedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money'
        };

        // Fermer le modal et rediriger vers l'écran de succès
        setShowPaymentForm(false);
        navigation.replace('PaymentSuccess', {
          booking: mockBooking,
          trip: trip,
          selectedSeats: selectedSeats,
          totalPrice: totalPrice,
          paymentMethod: mockBooking.payment_method
        });
        return;
      }

      // Pour les cartes bancaires, continuer avec la logique normale
      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Créer une réservation factice pour le succès
      const mockBooking = {
        booking_reference: `TH${Date.now()}`,
        booking_status: 'confirmed',
        payment_status: 'completed',
        total_price_fcfa: totalPrice,
        trip: trip,
        selectedSeats: selectedSeats,
        payment_method: 'Carte bancaire'
      };

      // Fermer le modal et rediriger vers l'écran de succès
      setShowPaymentForm(false);
      navigation.replace('PaymentSuccess', {
        booking: mockBooking,
        trip: trip,
        selectedSeats: selectedSeats,
        totalPrice: totalPrice,
        paymentMethod: mockBooking.payment_method
      });

    } catch (error) {
      Alert.alert('Erreur', 'Le paiement a échoué. Veuillez réessayer.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Résumé de la réservation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé de la réservation</Text>
          
          <View style={styles.bookingSummary}>
            <Text style={styles.bookingReference}>
              Réf: TH{Date.now().toString().slice(-6)}
            </Text>
            
            <View style={styles.tripInfo}>
              <Text style={styles.route}>
                {trip?.ville_depart || trip?.departure_city || 'Départ'} → {trip?.ville_arrivee || trip?.arrival_city || 'Arrivée'}
              </Text>
              <Text style={styles.datetime}>
                {trip?.departure_time 
                  ? new Date(trip.departure_time).toLocaleDateString('fr-FR')
                  : trip?.date_depart
                  ? trip.date_depart
                  : trip?.date
                  ? new Date(trip.date).toLocaleDateString('fr-FR')
                  : 'Date non spécifiée'} à {trip?.heure_dep || trip?.departure_time || 'Heure non spécifiée'}
              </Text>
              <Text style={styles.seat}>
                {selectedSeats?.length || 0} siège(s) sélectionné(s)
                {selectedSeats?.map(seat => ` ${seat.seat_number}`).join(',') || ''}
              </Text>
            </View>
            
            <View style={styles.priceContainer}>
              <Text style={styles.totalLabel}>Total à payer</Text>
              <Text style={styles.totalAmount}>
                {totalPrice?.toLocaleString() || '0'} FCFA
              </Text>
            </View>
          </View>
        </View>

        {/* Moyens de paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir un moyen de paiement</Text>
          
          <View style={styles.paymentMethods}>
            {paymentMethods.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id && styles.selectedPaymentMethod
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={styles.paymentMethodIcon}>
                  <Ionicons 
                    name={method.icon} 
                    size={24} 
                    color={selectedPaymentMethod === method.id ? COLORS.surface : method.color} 
                  />
                </View>
                
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodName,
                    selectedPaymentMethod === method.id && styles.selectedText
                  ]}>
                    {method.name}
                  </Text>
                  <Text style={[
                    styles.paymentMethodDescription,
                    selectedPaymentMethod === method.id && styles.selectedText
                  ]}>
                    {method.description}
                  </Text>
                </View>
                
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radio,
                    selectedPaymentMethod === method.id && styles.radioSelected
                  ]}>
                    {selectedPaymentMethod === method.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations de sécurité */}
        <View style={styles.section}>
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.securityText}>
              Vos informations de paiement sont sécurisées et chiffrées
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal de formulaire de paiement */}
      <Modal
        visible={showPaymentForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header du modal */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPaymentForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedPaymentMethod === 'card' ? 'Carte bancaire' :
               selectedPaymentMethod === 'orange_money' ? 'Orange Money' :
               selectedPaymentMethod === 'mtn_momo' ? 'MTN Mobile Money' : 'Paiement'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Formulaire carte bancaire */}
            {selectedPaymentMethod === 'card' && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Informations de la carte</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro de carte</Text>
                  <TextInput
                    style={styles.input}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="1234 5678 9012 3456"
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                    <Text style={styles.inputLabel}>Date d'expiration</Text>
                    <TextInput
                      style={styles.input}
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      placeholder="MM/AA"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cvv}
                      onChangeText={setCvv}
                      placeholder="123"
                      keyboardType="numeric"
                      maxLength={3}
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom sur la carte</Text>
                  <TextInput
                    style={styles.input}
                    value={cardName}
                    onChangeText={setCardName}
                    placeholder="JOHN DOE"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            )}

            {/* Formulaire Mobile Money */}
            {(selectedPaymentMethod === 'orange_money' || selectedPaymentMethod === 'mtn_momo') && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  {selectedPaymentMethod === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money'}
                </Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro de téléphone</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder={selectedPaymentMethod === 'orange_money' ? "655 XX XX XX" : "67X XX XX XX"}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color={COLORS.success || 'green'} />
                  <Text style={styles.infoText}>
                    Mode démo : Le paiement de {totalPrice?.toLocaleString()} FCFA sera automatiquement accepté après confirmation
                  </Text>
                </View>
              </View>
            )}

            {/* Résumé du paiement */}
            <View style={styles.paymentSummary}>
              <Text style={styles.summaryTitle}>Résumé du paiement</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Montant total</Text>
                <Text style={styles.summaryAmount}>{totalPrice?.toLocaleString()} FCFA</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer du modal */}
          <View style={styles.modalFooter}>
            <Button
              title={processing ? "Traitement..." : `Confirmer le paiement`}
              onPress={processPayment}
              loading={processing}
              disabled={processing}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Footer avec bouton de paiement */}
      <View style={styles.footer}>
        <Button
          title={`Payer ${totalPrice?.toLocaleString() || '0'} FCFA`}
          onPress={handlePayment}
          disabled={!selectedPaymentMethod}
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  bookingSummary: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  
  bookingReference: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  
  tripInfo: {
    marginBottom: SPACING.md,
  },
  
  route: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  datetime: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  seat: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  totalLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  paymentMethods: {
    gap: SPACING.sm,
  },
  
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  
  selectedPaymentMethod: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  paymentMethodInfo: {
    flex: 1,
  },
  
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  paymentMethodDescription: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  selectedText: {
    color: COLORS.surface,
  },
  
  radioContainer: {
    marginLeft: SPACING.md,
  },
  
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  
  radioSelected: {
    borderColor: COLORS.surface,
  },
  
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
  },
  
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  
  securityText: {
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
  },

  // Styles pour le modal de paiement
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },

  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },

  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },

  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  inputGroup: {
    marginBottom: SPACING.md,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    fontSize: 16,
    backgroundColor: COLORS.background,
    color: COLORS.text.primary,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warning + '20',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
    lineHeight: 20,
  },

  paymentSummary: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },

  summaryLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },

  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  modalFooter: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default PaymentScreen;
