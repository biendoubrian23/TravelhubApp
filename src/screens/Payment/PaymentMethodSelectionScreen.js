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
import { Button } from '../../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { paymentService } from '../../services/paymentService';
import { useAuthStore } from '../../store';

const PaymentMethodSelectionScreen = ({ route, navigation }) => {
  const { totalPrice, bookingData } = route.params;
  const { user } = useAuthStore();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await paymentService.getAvailablePaymentMethods(user.id, totalPrice);
      setPaymentMethods(result.methods);
      setBreakdown(result.breakdown);
      
      // Sélectionner automatiquement la première méthode disponible
      if (result.methods.length > 0) {
        setSelectedMethod(result.methods[0]);
      }
    } catch (error) {
      console.error('Erreur chargement méthodes de paiement:', error);
      Alert.alert('Erreur', 'Impossible de charger les méthodes de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedPayment = () => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    // Passer à l'écran de paiement avec les détails
    navigation.navigate('PaymentProcessing', {
      paymentMethod: selectedMethod,
      totalPrice,
      bookingData,
      breakdown
    });
  };

  const formatAmount = (amount) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const PaymentMethodCard = ({ method, isSelected, onSelect }) => (
    <TouchableOpacity
      style={[
        styles.methodCard,
        isSelected && styles.methodCardSelected
      ]}
      onPress={() => onSelect(method)}
    >
      <View style={styles.methodHeader}>
        <View style={styles.methodIcon}>
          <Ionicons 
            name={method.icon} 
            size={24} 
            color={isSelected ? COLORS.primary : COLORS.text.secondary} 
          />
        </View>
        
        <View style={styles.methodContent}>
          <Text style={[
            styles.methodName,
            isSelected && styles.methodNameSelected
          ]}>
            {method.name}
          </Text>
          <Text style={styles.methodDescription}>
            {method.description}
          </Text>
        </View>
        
        <View style={[
          styles.radioButton,
          isSelected && styles.radioButtonSelected
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={COLORS.surface} />
          )}
        </View>
      </View>
      
      {/* Détails du paiement mixte */}
      {method.amountFromBalance && method.amountExternal && (
        <View style={styles.paymentBreakdown}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Depuis votre solde</Text>
            <Text style={styles.breakdownValue}>
              -{formatAmount(method.amountFromBalance)}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Montant restant</Text>
            <Text style={styles.breakdownValue}>
              {formatAmount(method.amountExternal)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mode de paiement</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des méthodes de paiement...</Text>
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
        <Text style={styles.headerTitle}>Mode de paiement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Résumé du montant */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Montant total</Text>
          <Text style={styles.totalAmount}>{formatAmount(totalPrice)}</Text>
          
          {breakdown?.canUseBalance && (
            <View style={styles.balanceInfo}>
              <Ionicons name="wallet" size={16} color={COLORS.primary} />
              <Text style={styles.balanceText}>
                Solde disponible: {formatAmount(breakdown.userBalance)}
              </Text>
            </View>
          )}
        </View>

        {/* Méthodes de paiement */}
        <View style={styles.methodsSection}>
          <Text style={styles.sectionTitle}>Choisir une méthode de paiement</Text>
          
          {paymentMethods.map((method, index) => (
            <PaymentMethodCard
              key={method.id || index}
              method={method}
              isSelected={selectedMethod?.id === method.id}
              onSelect={setSelectedMethod}
            />
          ))}
        </View>

        {/* Information sécurisée */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
          <Text style={styles.securityText}>
            Vos paiements sont sécurisés et cryptés. Votre solde TravelHub est protégé.
          </Text>
        </View>
      </ScrollView>

      {/* Bouton de confirmation */}
      <View style={styles.footer}>
        <Button
          title="Procéder au paiement"
          onPress={handleProceedPayment}
          disabled={!selectedMethod}
          style={[
            styles.proceedButton,
            !selectedMethod && styles.proceedButtonDisabled
          ]}
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
  
  totalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  
  totalLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  balanceText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  methodsSection: {
    marginBottom: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  methodCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  
  methodContent: {
    flex: 1,
  },
  
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  methodNameSelected: {
    color: COLORS.primary,
  },
  
  methodDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  radioButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  
  paymentBreakdown: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  
  securityInfo: {
    flexDirection: 'row',
    backgroundColor: COLORS.success + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  securityText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginLeft: SPACING.sm,
  },
  
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  
  proceedButton: {
    marginBottom: 0,
  },
  
  proceedButtonDisabled: {
    opacity: 0.6,
  },
});

export default PaymentMethodSelectionScreen;
