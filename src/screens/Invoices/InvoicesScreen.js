import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { useFocusEffect } from '@react-navigation/native';

// Import conditionnel des services pour éviter les erreurs de modules natifs
let invoiceService = null;
try {
  const invoiceServiceModule = require('../../services/invoiceService');
  invoiceService = invoiceServiceModule.invoiceService;
} catch (error) {
  console.log('⚠️ Modules natifs non disponibles, fonctionnalités PDF désactivées');
}

const InvoicesScreen = ({ navigation }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Charger les factures
  const loadInvoices = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      if (!user?.id) {
        console.log('👤 Utilisateur non connecté');
        setInvoices([]);
        return;
      }

      // Vérifier si le service est disponible
      if (!invoiceService) {
        console.log('⚠️ Service de factures non disponible');
        setInvoices([]);
        return;
      }

      const invoicesData = await invoiceService.getUserInvoices(user.id);
      
      setInvoices(invoicesData || []);
      console.log('✅ Factures chargées:', invoicesData?.length || 0);
      
    } catch (error) {
      console.error('❌ Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger au focus
  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [user?.id])
  );

  // Recharger les données
  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices(true);
  };

  // Voir une facture
  const handleViewInvoice = (invoice) => {
    navigation.navigate('InvoicePreview', { invoice });
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date non définie';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'generated': return COLORS.warning;
      case 'sent': return COLORS.success;
      case 'paid': return COLORS.primary;
      default: return COLORS.text.secondary;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'generated': return 'Générée';
      case 'sent': return 'Envoyée';
      case 'paid': return 'Payée';
      default: return status;
    }
  };

  // Rendu d'une facture
  const renderInvoiceCard = ({ item: invoice }) => (
    <View style={styles.invoiceCard}>
      {/* Header */}
      <View style={styles.invoiceHeader}>
        <View style={styles.invoiceNumber}>
          <Text style={styles.invoiceNumberText}>{invoice.invoice_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
              {getStatusText(invoice.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.invoiceDate}>
          {invoice.created_at ? formatDate(invoice.created_at) : 'Date non définie'}
        </Text>
      </View>

      {/* Détails du voyage */}
      <View style={styles.tripDetails}>
        <View style={styles.tripRoute}>
          <Ionicons name="location" size={16} color={COLORS.primary} />
          <Text style={styles.routeText}>
            {invoice.trip_details?.departure || 'N/A'} → {invoice.trip_details?.arrival || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.tripInfo}>
          <View style={styles.tripInfoItem}>
            <Ionicons name="calendar" size={14} color={COLORS.text.secondary} />
            <Text style={styles.tripInfoText}>
              {invoice.trip_details?.date ? formatDate(invoice.trip_details.date) : 'Date non définie'}
            </Text>
          </View>
          
          <View style={styles.tripInfoItem}>
            <Ionicons name="bus" size={14} color={COLORS.text.secondary} />
            <Text style={styles.tripInfoText}>
              {invoice.trip_details?.bus_type?.toUpperCase() || 'STANDARD'}
            </Text>
          </View>
          
          <View style={styles.tripInfoItem}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.tripInfoText}>
              Siège{invoice.trip_details?.seat_number?.includes(',') ? 's' : ''}: {invoice.trip_details?.seat_number || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Montant */}
      <View style={styles.amountSection}>
        <Text style={styles.amountLabel}>Montant total</Text>
        <Text style={styles.amountValue}>
          {invoice.total_amount?.toLocaleString()} FCFA
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => handleViewInvoice(invoice)}
        >
          <Ionicons name="eye" size={16} color={COLORS.surface} />
          <Text style={styles.viewButtonText}>Voir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Écran vide
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={80} color={COLORS.text.secondary} />
      <Text style={styles.emptyTitle}>Aucune facture</Text>
      <Text style={styles.emptySubtitle}>
        Vos factures apparaîtront ici après vos réservations
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Factures</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      {invoices.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{invoices.length}</Text>
            <Text style={styles.statLabel}>Factures</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total FCFA</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {invoices.filter(inv => inv.status === 'generated').length}
            </Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>
      )}

      {/* Liste des factures */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des factures...</Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
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
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  listContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  invoiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  invoiceNumber: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  invoiceNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginRight: SPACING.sm,
  },

  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  invoiceDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  tripDetails: {
    marginBottom: SPACING.md,
  },

  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },

  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },

  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  tripInfoText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
  },

  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.primary + '10',
    borderRadius: BORDER_RADIUS.sm,
  },

  amountLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  actionsSection: {
    flexDirection: 'row',
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs,
  },

  viewButton: {
    backgroundColor: COLORS.primary,
  },

  viewButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
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

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },

  emptySubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default InvoicesScreen;
