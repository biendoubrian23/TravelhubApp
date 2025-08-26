import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { balanceService } from '../../services/balanceService';
import { useAuthStore } from '../../store';

const BalanceHistoryScreen = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBalanceData();
  }, []);

  // ✅ Rafraîchissement automatique si demandé
  useEffect(() => {
    if (route?.params?.refreshOnLoad) {
      console.log('🔄 Rafraîchissement automatique demandé');
      setTimeout(() => {
        loadBalanceData();
      }, 500); // Petit délai pour laisser le temps à la transaction d'être enregistrée
    }
  }, [route?.params?.refreshOnLoad]);

  const loadBalanceData = async () => {
    if (!user?.id) return;

    try {
      // Charger les données en parallèle
      const [balanceResult, transactionsResult, summaryResult] = await Promise.all([
        balanceService.getUserBalance(user.id),
        balanceService.getBalanceTransactions(user.id, 50),
        balanceService.getUserBalanceSummary(user.id)
      ]);

      setBalance(balanceResult.balance || 0);
      setTransactions(transactionsResult.data || []);
      setSummary(summaryResult.data);

      if (balanceResult.error) {
        console.error('Erreur solde:', balanceResult.error);
      }
      if (transactionsResult.error) {
        console.error('Erreur transactions:', transactionsResult.error);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de solde:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBalanceData();
  };

  const formatAmount = (amount) => {
    return `${Math.abs(amount).toLocaleString()} FCFA`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'refund':
        return { name: 'arrow-down-circle', color: COLORS.success };
      case 'payment':
        return { name: 'arrow-up-circle', color: COLORS.error };
      case 'adjustment':
        return { name: 'swap-horizontal', color: COLORS.warning };
      default:
        return { name: 'help-circle', color: COLORS.text.secondary };
    }
  };

  const getTransactionDescription = (transaction) => {
    if (transaction.description) {
      return transaction.description;
    }

    switch (transaction.transaction_type) {
      case 'refund':
        return 'Remboursement après annulation';
      case 'payment':
        return 'Paiement par solde';
      case 'adjustment':
        return 'Ajustement de solde';
      default:
        return 'Transaction';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon solde</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
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
        <Text style={styles.headerTitle}>Mon solde</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Carte du solde principal */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} />
            <Text style={styles.balanceLabel}>Solde actuel</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {balance.toLocaleString()} FCFA
          </Text>
          
          {summary && (
            <View style={styles.balanceStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  +{summary.total_refunds?.toLocaleString() || '0'} FCFA
                </Text>
                <Text style={styles.statLabel}>Total remboursé</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  -{summary.total_payments?.toLocaleString() || '0'} FCFA
                </Text>
                <Text style={styles.statLabel}>Total utilisé</Text>
              </View>
            </View>
          )}
        </View>

        {/* Information sur l'utilisation */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Votre solde peut être utilisé pour payer vos prochaines réservations. 
            En cas d'annulation, 70% du montant vous sera remboursé sur votre solde 
            (30% de frais d'annulation).
          </Text>
        </View>

        {/* Historique des transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Historique des transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.text.secondary} />
              <Text style={styles.emptyTitle}>Aucune transaction</Text>
              <Text style={styles.emptyText}>
                Vos transactions de solde apparaîtront ici
              </Text>
            </View>
          ) : (
            transactions.map((transaction, index) => {
              const icon = getTransactionIcon(transaction.transaction_type);
              const isPositive = transaction.amount > 0;
              
              // ✅ Détection des nouvelles transactions (dernières 24h)
              const transactionDate = new Date(transaction.created_at);
              const now = new Date();
              const isNew = (now - transactionDate) < 24 * 60 * 60 * 1000; // 24 heures
              
              return (
                <View key={transaction.id || index} style={[
                  styles.transactionItem,
                  isNew && styles.newTransactionItem
                ]}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                    {isNew && (
                      <View style={styles.newIndicator}>
                        <Text style={styles.newIndicatorText}>•</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionHeader}>
                      <Text style={styles.transactionDescription}>
                        {getTransactionDescription(transaction)}
                      </Text>
                      {isNew && (
                        <Text style={styles.newLabel}>NOUVEAU</Text>
                      )}
                    </View>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.created_at)}
                    </Text>
                    
                    {/* Détails du trajet si disponible */}
                    {transaction.bookings?.trips && (
                      <Text style={styles.transactionTrip}>
                        {transaction.bookings.trips.departure_city} → {transaction.bookings.trips.arrival_city}
                      </Text>
                    )}
                  </View>
                  
                  <Text style={[
                    styles.transactionAmount,
                    isPositive ? styles.positiveAmount : styles.negativeAmount
                  ]}>
                    {isPositive ? '+' : '-'}{formatAmount(transaction.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  
  balanceLabel: {
    fontSize: 16,
    color: COLORS.surface,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: SPACING.md,
  },
  
  balanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface + '30',
  },
  
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  
  statLabel: {
    fontSize: 12,
    color: COLORS.surface + 'CC',
  },
  
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.surface + '30',
    marginHorizontal: SPACING.md,
  },
  
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginLeft: SPACING.sm,
  },
  
  transactionsSection: {
    marginBottom: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  
  emptyText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  
  // ✅ Style pour les nouvelles transactions
  newTransactionItem: {
    borderWidth: 1,
    borderColor: COLORS.success + '30',
    backgroundColor: COLORS.success + '05',
  },
  
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    position: 'relative',
  },
  
  // ✅ Indicateur de nouvelle transaction
  newIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  
  newIndicatorText: {
    fontSize: 8,
    color: COLORS.success,
    fontWeight: 'bold',
  },
  
  transactionContent: {
    flex: 1,
  },
  
  // ✅ Header pour inclure le label "NOUVEAU"
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    flex: 1,
  },
  
  // ✅ Label "NOUVEAU"
  newLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.success,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  transactionDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  
  transactionTrip: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  positiveAmount: {
    color: COLORS.success,
  },
  
  negativeAmount: {
    color: COLORS.error,
  },
});

export default BalanceHistoryScreen;
