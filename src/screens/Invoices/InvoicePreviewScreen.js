import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import { Button } from '../../components';

const InvoicePreviewScreen = ({ route, navigation }) => {
  const { invoice } = route.params;

  const formatDate = (dateString) => {
    if (!dateString) return 'Date invalide';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatTime = (dateString, timeString) => {
    // Si on a une heure séparée, l'utiliser
    if (timeString && timeString !== '00:00') {
      return timeString;
    }
    
    // Sinon essayer d'extraire l'heure de la date
    if (!dateString) return '08:00';
    try {
      const date = new Date(dateString);
      // Si c'est minuit, retourner une heure par défaut
      if (date.getHours() === 0 && date.getMinutes() === 0) {
        return '08:00';
      }
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '08:00';
    }
  };

  const handleShare = async () => {
    try {
      const message = `
🧾 FACTURE TRAVELHUB 🧾

Numéro: ${invoice.invoice_number}
Date: ${formatDate(invoice.created_at)}

👤 CLIENT:
${invoice.customer_name}
${invoice.customer_email}

🚌 VOYAGE:
${invoice.trip_details?.departure} → ${invoice.trip_details?.arrival}
📅 Date: ${formatDate(invoice.trip_details?.date)}
🕐 Heure: ${formatTime(invoice.trip_details?.date, invoice.trip_details?.time)}
💺 ${invoice.trip_details?.passenger_count > 1 ? 'Sièges' : 'Siège'}: ${invoice.trip_details?.seat_number}${invoice.trip_details?.passenger_count > 1 ? ` (${invoice.trip_details.passenger_count} passagers)` : ''}
🚍 Type: ${invoice.trip_details?.bus_type || 'Standard'}

💰 MONTANT:
Total: ${invoice.total_amount?.toLocaleString()} ${invoice.currency}
Statut: ✅ ${invoice.status}

💳 Paiement: ${invoice.payment_details?.method}
📄 Référence: ${invoice.bookings?.booking_reference}

🏢 TravelHub - Transport de voyageurs
      `;

      const result = await Share.share({
        message: message,
        title: `Facture ${invoice.invoice_number}`
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Succès', 'Facture partagée avec succès');
      }
    } catch (error) {
      console.error('Erreur partage:', error);
      Alert.alert('Erreur', 'Impossible de partager la facture');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aperçu Facture</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerButton}
        >
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête de la facture */}
        <View style={styles.invoiceHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>TravelHub</Text>
            <Text style={styles.companySubtitle}>Transport de voyageurs</Text>
            <Text style={styles.companyLocation}>Cameroun</Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>FACTURE N°</Text>
            <Text style={styles.invoiceNumberValue}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>Date: {formatDate(invoice.created_at)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {invoice.status === 'paid' ? 'PAYÉE' : invoice.status?.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Informations client */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Informations Client</Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientText}>
              <Text style={styles.bold}>Nom: </Text>
              {invoice.customer_name}
            </Text>
            <Text style={styles.clientText}>
              <Text style={styles.bold}>Email: </Text>
              {invoice.customer_email}
            </Text>
            {invoice.customer_phone && (
              <Text style={styles.clientText}>
                <Text style={styles.bold}>Téléphone: </Text>
                {invoice.customer_phone}
              </Text>
            )}
            <Text style={styles.clientText}>
              <Text style={styles.bold}>Référence: </Text>
              {invoice.bookings?.booking_reference}
            </Text>
          </View>
        </View>

        {/* Trajet */}
        <View style={styles.routeHighlight}>
          <View style={styles.routeIconContainer}>
            <Ionicons name="bus-outline" size={24} color={COLORS.primary} />
            <Text style={styles.routeText}>
              {invoice.trip_details?.departure} ➔ {invoice.trip_details?.arrival}
            </Text>
          </View>
        </View>

        {/* Détails du voyage */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="ticket-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Détails du Voyage</Text>
          </View>
          <View style={styles.tripDetails}>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>Départ:</Text>
              </View>
              <Text style={styles.tripValue}>{invoice.trip_details?.departure}</Text>
            </View>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="flag-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>Arrivée:</Text>
              </View>
              <Text style={styles.tripValue}>{invoice.trip_details?.arrival}</Text>
            </View>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>Date:</Text>
              </View>
              <Text style={styles.tripValue}>{formatDate(invoice.trip_details?.date)}</Text>
            </View>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>Heure:</Text>
              </View>
              <Text style={styles.tripValue}>{formatTime(invoice.trip_details?.date, invoice.trip_details?.time)}</Text>
            </View>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="bus-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>Type de bus:</Text>
              </View>
              <Text style={styles.tripValue}>{invoice.trip_details?.bus_type?.toUpperCase() || 'STANDARD'}</Text>
            </View>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="layers-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>
                  {invoice.trip_details?.passenger_count > 1 ? 'Sièges:' : 'Siège:'}
                </Text>
              </View>
              <Text style={styles.tripValue}>
                {invoice.trip_details?.seat_number}
                {invoice.trip_details?.passenger_count > 1 && 
                  ` (${invoice.trip_details.passenger_count} passagers)`
                }
              </Text>
            </View>
            <View style={styles.tripRow}>
              <View style={styles.tripLabelContainer}>
                <Ionicons name="card-outline" size={16} color={COLORS.primary} />
                <Text style={styles.tripLabel}>Paiement:</Text>
              </View>
              <Text style={styles.tripValue}>{invoice.payment_details?.method}</Text>
            </View>
          </View>
        </View>

        {/* Montants */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Facturation</Text>
          </View>
          <View style={styles.amountSection}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Montant HT:</Text>
              <Text style={styles.amountValue}>
                {Math.round(invoice.total_amount / 1.1925).toLocaleString()} {invoice.currency}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>TVA (19.25%):</Text>
              <Text style={styles.amountValue}>
                {Math.round(invoice.total_amount - (invoice.total_amount / 1.1925)).toLocaleString()} {invoice.currency}
              </Text>
            </View>
            <View style={[styles.amountRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>TOTAL TTC:</Text>
              <Text style={styles.totalValue}>
                {invoice.total_amount?.toLocaleString()} {invoice.currency}
              </Text>
            </View>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>TravelHub</Text>
          <Text style={styles.footerSubtitle}>Transport de voyageurs au Cameroun</Text>
          <Text style={styles.footerDate}>
            Facture générée le {formatDate(invoice.created_at)}
          </Text>
          <Text style={styles.footerNote}>
            Conservez cette facture comme preuve de paiement
          </Text>
        </View>
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.actionButton}
        >
          <Ionicons name="share-outline" size={24} color={COLORS.text.white} />
          <Text style={styles.actionButtonText}>Partager</Text>
        </TouchableOpacity>
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
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerButton: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.background,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  companyLocation: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  invoiceInfo: {
    alignItems: 'flex-end',
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  invoiceNumberValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  invoiceDate: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  clientInfo: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clientText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  routeHighlight: {
    backgroundColor: COLORS.primary + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  routeIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  tripDetails: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tripLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  tripValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  amountSection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  amountValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.lg,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  footerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  footerDate: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  footerNote: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  actions: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default InvoicePreviewScreen;
