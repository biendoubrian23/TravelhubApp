import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '../components'
import { COLORS, SPACING, BORDER_RADIUS } from '../constants'
import { runAllTests } from '../tests/test-real-data'
import { tripService } from '../services'

const RealDataTestScreen = ({ navigation }) => {
  const [testResults, setTestResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isResettingSeats, setIsResettingSeats] = useState(false)
  const [isResettingAll, setIsResettingAll] = useState(false)

  const handleRunTests = async () => {
    setIsRunning(true)
    setTestResults(null)
    
    try {
      console.log('Démarrage des tests...')
      const results = await runAllTests()
      setTestResults(results)
      
      if (results.realDataWorking) {
        Alert.alert(
          'Tests réussis ! 🎉',
          'La base de données est connectée et fonctionnelle. L\'application peut récupérer les trajets réels.'
        )
      } else {
        Alert.alert(
          'Erreur de base de données ❌',
          'La base de données n\'est pas accessible ou ne contient pas de trajets. L\'application ne pourra pas fonctionner sans données.'
        )
      }
    } catch (error) {
      console.error('Erreur lors des tests:', error)
      Alert.alert('Erreur', 'Impossible d\'exécuter les tests')
    } finally {
      setIsRunning(false)
    }
  }

  const handleResetSeats = async () => {
    setIsResettingSeats(true)
    try {
      // Rechercher quelques trajets et réinitialiser leurs places
      const trips = await tripService.searchTrips({
        departure: 'Douala',
        arrival: 'Yaoundé', 
        date: new Date().toISOString().split('T')[0]
      })

      if (trips.length > 0) {
        const resetPromises = trips.slice(0, 3).map(trip => 
          tripService.resetTripSeats(trip.id, 0.7) // 70% de places disponibles
        )
        
        const results = await Promise.all(resetPromises)
        console.log('Places réinitialisées:', results)
        
        Alert.alert(
          'Places réinitialisées',
          `${results.length} trajets mis à jour avec plus de places disponibles.`,
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert('Aucun trajet', 'Aucun trajet trouvé pour la réinitialisation')
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      Alert.alert('Erreur', 'Impossible de réinitialiser les places')
    } finally {
      setIsResettingSeats(false)
    }
  }

  const handleResetAllSeats = async () => {
    setIsResettingAll(true)
    try {
      console.log('🔄 Réinitialisation de TOUS les trajets...')
      const result = await tripService.resetAllTripsSeats()
      
      Alert.alert(
        '🎉 Réinitialisation réussie !',
        `${result.tripsUpdated} trajets mis à jour\n${result.totalAvailableSeats}/${result.totalSeats} places disponibles (${result.availabilityPercentage}%)`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Erreur lors de la réinitialisation complète:', error)
      Alert.alert('Erreur', 'Impossible de réinitialiser tous les trajets')
    } finally {
      setIsResettingAll(false)
    }
  }

  const getStatusIcon = (working) => {
    if (working === true) return 'checkmark-circle'
    if (working === false) return 'close-circle'
    return 'help-circle'
  }

  const getStatusColor = (working) => {
    if (working === true) return COLORS.success
    if (working === false) return COLORS.error
    return COLORS.text.secondary
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test des Services</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test de Connectivité</Text>
          <Text style={styles.sectionDescription}>
            Vérifiez que l'application peut récupérer les données depuis la base de données Supabase. 
            Aucune donnée mockée n'est utilisée - l'application nécessite une base de données fonctionnelle.
          </Text>
        </View>

        <View style={styles.testCard}>
          <View style={styles.testHeader}>
            <Ionicons name="server" size={24} color={COLORS.primary} />
            <Text style={styles.testTitle}>Services de Données</Text>
          </View>
          
          <View style={styles.testItem}>
            <View style={styles.testItemLeft}>
              <Ionicons 
                name={getStatusIcon(testResults?.realDataWorking)} 
                size={20} 
                color={getStatusColor(testResults?.realDataWorking)} 
              />
              <Text style={styles.testItemText}>Base de données Supabase</Text>
            </View>
            <Text style={[
              styles.testItemStatus,
              { color: getStatusColor(testResults?.realDataWorking) }
            ]}>
              {testResults?.realDataWorking === true ? 'OK' : 
               testResults?.realDataWorking === false ? 'Erreur' : 'Non testé'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fonctionnalités Testées</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="search" size={16} color={COLORS.primary} />
              <Text style={styles.featureText}>Recherche de trajets</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="bus" size={16} color={COLORS.primary} />
              <Text style={styles.featureText}>Informations des bus</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="grid" size={16} color={COLORS.primary} />
              <Text style={styles.featureText}>Configuration des sièges</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.featureText}>Disponibilité en temps réel</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="star" size={16} color={COLORS.primary} />
              <Text style={styles.featureText}>Trajets populaires</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={COLORS.info} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>À propos de ce test</Text>
            <Text style={styles.infoText}>
              Ce test vérifie la connectivité avec la base de données Supabase. 
              L'application nécessite une base de données fonctionnelle avec des trajets pour fonctionner.
              Aucune donnée mockée n'est utilisée.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isRunning ? "Test en cours..." : "Lancer les Tests"}
            onPress={handleRunTests}
            disabled={isRunning}
            style={isRunning ? styles.buttonDisabled : null}
          />
          
          <Button
            title={isResettingSeats ? "Réinitialisation..." : "🔄 Réinitialiser Places"}
            onPress={handleResetSeats}
            disabled={isResettingSeats}
            style={[styles.resetButton, isResettingSeats ? styles.buttonDisabled : null]}
          />
          
          <Button
            title={isResettingAll ? "Réinit. TOUT..." : "🔄 Réinitialiser TOUS les Trajets"}
            onPress={handleResetAllSeats}
            disabled={isResettingAll}
            style={[styles.resetAllButton, isResettingAll ? styles.buttonDisabled : null]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Plan des Sièges</Text>
          <Text style={styles.sectionDescription}>
            Visualiser la disposition des sièges VIP avec les données réelles de la base.
          </Text>
          <TouchableOpacity 
            style={styles.consoleButton}
            onPress={() => navigation.navigate('VipSeatDisplay')}
          >
            <Ionicons name="bus" size={20} color={COLORS.primary} />
            <Text style={styles.consoleButtonText}>Voir Plan Sièges VIP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Console</Text>
          <Text style={styles.sectionDescription}>
            Ouvrez la console de développement pour voir les logs détaillés des tests.
          </Text>
          <TouchableOpacity 
            style={styles.consoleButton}
            onPress={() => console.log('📱 Console ouverte - Vérifiez les logs ci-dessus')}
          >
            <Ionicons name="terminal" size={20} color={COLORS.primary} />
            <Text style={styles.consoleButtonText}>Voir les logs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

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
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  
  section: {
    marginTop: SPACING.lg,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  
  sectionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  
  testCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  
  testItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  testItemText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  
  testItemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  featureList: {
    marginTop: SPACING.sm,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  
  featureText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: SPACING.sm,
  },
  
  infoCard: {
    backgroundColor: COLORS.info + '10',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  infoContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: SPACING.xs,
  },
  
  infoText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  
  buttonContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  
  buttonDisabled: {
    opacity: 0.6,
  },

  resetButton: {
    backgroundColor: COLORS.warning,
    marginTop: SPACING.sm,
  },

  resetAllButton: {
    backgroundColor: COLORS.error,
    marginTop: SPACING.sm,
  },
  
  consoleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  consoleButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
})

export default RealDataTestScreen
