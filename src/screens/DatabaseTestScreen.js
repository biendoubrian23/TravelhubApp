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
import { Button } from '../components';
import { COLORS, SPACING } from '../constants';
import { useAuthStore, useBookingsStore } from '../store';
import { bookingService } from '../services/bookingService';
import { testDataService } from '../services/testDataService';

const DatabaseTestScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const { loadBookings, bookings } = useBookingsStore();
  const [isCreatingData, setIsCreatingData] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const createTestData = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setIsCreatingData(true);
    addLog('🧪 Début création données de test...', 'info');

    try {
      const testBookings = await testDataService.createTestDataForUser(user.id);
      if (testBookings.length > 0) {
        addLog('✅ Données de test créées avec succès!', 'success');
        addLog(`📋 ${testBookings.length} réservation(s) créée(s)`, 'info');
      } else {
        addLog('ℹ️ Aucune donnée de test créée (déjà existantes)', 'warning');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error');
    } finally {
      setIsCreatingData(false);
    }
  };

  const testLoadBookings = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    setIsLoadingBookings(true);
    addLog('🔄 Test de chargement des réservations...', 'info');

    try {
      await loadBookings(user);
      addLog(`✅ ${bookings.length} réservations chargées`, 'success');
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const cleanTestData = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    Alert.alert(
      'Confirmation',
      'Voulez-vous supprimer toutes les données de test ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            addLog('🧹 Nettoyage des données de test...', 'info');
            try {
              await testDataService.cleanTestData(user.id);
              addLog('✅ Données de test supprimées', 'success');
              // Recharger les réservations pour mettre à jour l'affichage
              await loadBookings(user);
            } catch (error) {
              addLog(`❌ Erreur nettoyage: ${error.message}`, 'error');
            }
          }
        }
      ]
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogStyle = (type) => {
    switch (type) {
      case 'success':
        return { color: COLORS.success };
      case 'error':
        return { color: COLORS.error };
      case 'warning':
        return { color: COLORS.warning };
      default:
        return { color: COLORS.text.primary };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Test Base de Données</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Informations utilisateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateur connecté</Text>
          <Text style={styles.userInfo}>
            ID: {user?.id || 'Non connecté'}
          </Text>
          <Text style={styles.userInfo}>
            Email: {user?.email || 'Non connecté'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions de test</Text>
          
          <Button
            title="Créer des données de test"
            onPress={createTestData}
            loading={isCreatingData}
            style={styles.actionButton}
          />
          
          <Button
            title="Charger les réservations"
            onPress={testLoadBookings}
            loading={isLoadingBookings}
            style={styles.actionButton}
          />
          
          <Button
            title="Nettoyer données de test"
            onPress={cleanTestData}
            style={[styles.actionButton, styles.dangerButton]}
            textStyle={styles.dangerButtonText}
          />
          
          <Button
            title="Aller aux réservations"
            onPress={() => navigation.navigate('Bookings')}
            style={[styles.actionButton, styles.secondaryButton]}
            textStyle={styles.secondaryButtonText}
          />
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <View style={styles.logsHeader}>
            <Text style={styles.sectionTitle}>Logs de test</Text>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.clearButton}>Effacer</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <Text style={styles.noLogs}>Aucun log pour le moment</Text>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <Text style={[styles.logMessage, getLogStyle(log.type)]}>
                    {log.message}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Résumé des réservations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réservations actuelles</Text>
          <Text style={styles.bookingCount}>
            {bookings.length} réservation(s) en mémoire
          </Text>
          
          {bookings.slice(0, 3).map((booking, index) => (
            <View key={booking.id} style={styles.bookingPreview}>
              <Text style={styles.bookingRoute}>
                {booking.departure} → {booking.arrival}
              </Text>
              <Text style={styles.bookingDetails}>
                {booking.date} à {booking.time} • {booking.price} FCFA
              </Text>
            </View>
          ))}
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
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginLeft: SPACING.md,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  userInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  actionButton: {
    marginBottom: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  dangerButton: {
    backgroundColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.surface,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  clearButton: {
    color: COLORS.primary,
    fontSize: 14,
  },
  logsContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 4,
    maxHeight: 200,
  },
  noLogs: {
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logItem: {
    marginBottom: SPACING.xs,
  },
  logTimestamp: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  logMessage: {
    fontSize: 14,
    marginTop: 2,
  },
  bookingCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  bookingPreview: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: 4,
    marginBottom: SPACING.xs,
  },
  bookingRoute: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  bookingDetails: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});

export default DatabaseTestScreen;
