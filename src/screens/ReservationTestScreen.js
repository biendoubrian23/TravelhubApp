import React, { useState } from 'react'
import { View, ScrollView } from 'react-native'
import { Text, Button, Card } from 'react-native-paper'
import { useAuthStore, useBookingsStore } from '../store'
import { authService } from '../services/supabase'
import { bookingService } from '../services/bookingService'

const ReservationTestScreen = () => {
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()
  const { bookings, loadBookings } = useBookingsStore()

  const addTestResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }])
  }

  const testUserReservations = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      addTestResult('🔄 Début du test des réservations utilisateur...', 'info')
      
      if (!user) {
        addTestResult('❌ Aucun utilisateur connecté', 'error')
        return
      }

      addTestResult(`👤 Utilisateur connecté: ${user.email}`, 'success')
      addTestResult(`📱 ID utilisateur: ${user.id}`, 'info')

      // Test 1: Vérifier le profil utilisateur
      addTestResult('🔄 Vérification du profil utilisateur...', 'info')
      try {
        await authService.ensureUserProfile(user.id)
        addTestResult('✅ Profil utilisateur vérifié/créé', 'success')
      } catch (profileError) {
        addTestResult(`❌ Erreur profil: ${profileError.message}`, 'error')
      }

      // Test 2: Charger les réservations via bookingService directement
      addTestResult('🔄 Chargement direct via bookingService...', 'info')
      try {
        const directBookings = await bookingService.getUserBookings(user.id)
        addTestResult(`📋 ${directBookings.length} réservations trouvées via service direct`, 'success')
        
        if (directBookings.length > 0) {
          directBookings.forEach((booking, index) => {
            addTestResult(`   ${index + 1}. ${booking.trips?.ville_depart} → ${booking.trips?.ville_arrivee} (${booking.passenger_name})`, 'info')
          })
        }
      } catch (directError) {
        addTestResult(`❌ Erreur chargement direct: ${directError.message}`, 'error')
      }

      // Test 3: Charger via le store
      addTestResult('🔄 Chargement via le store Zustand...', 'info')
      try {
        await loadBookings(user)
        addTestResult(`📋 ${bookings.length} réservations dans le store`, 'success')
        
        if (bookings.length > 0) {
          bookings.forEach((booking, index) => {
            addTestResult(`   ${index + 1}. ${booking.departure} → ${booking.arrival} (${booking.passengerName || 'Nom non défini'})`, 'info')
          })
        } else {
          addTestResult('⚠️ Aucune réservation dans le store - problème possible', 'warning')
        }
      } catch (storeError) {
        addTestResult(`❌ Erreur chargement store: ${storeError.message}`, 'error')
      }

      addTestResult('✅ Test terminé avec succès!', 'success')

    } catch (error) {
      addTestResult(`💥 Erreur générale: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'success': return '#4CAF50'
      case 'error': return '#F44336'
      case 'warning': return '#FF9800'
      default: return '#2196F3'
    }
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Card style={{ marginBottom: 16 }}>
        <Card.Content>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
            Test du Système de Réservations
          </Text>
          
          <Text style={{ marginBottom: 16 }}>
            Utilisateur actuel: {user ? user.email : 'Non connecté'}
          </Text>

          <Button 
            mode="contained" 
            onPress={testUserReservations}
            loading={loading}
            disabled={!user}
            style={{ marginBottom: 16 }}
          >
            Lancer le test
          </Button>

          <Button 
            mode="outlined" 
            onPress={() => {
              setTestResults([]);
              loadBookings(user);
              addTestResult('🔄 Rechargement des réservations forcé...', 'info');
            }}
            disabled={!user || loading}
            style={{ marginBottom: 16 }}
          >
            Recharger les réservations
          </Button>

          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            Résultats du test:
          </Text>
        </Card.Content>
      </Card>

      {testResults.map((result, index) => (
        <Card key={index} style={{ marginBottom: 8 }}>
          <Card.Content style={{ padding: 12 }}>
            <Text style={{ 
              color: getResultColor(result.type),
              fontSize: 14,
              fontFamily: 'monospace'
            }}>
              [{result.time}] {result.message}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  )
}

export default ReservationTestScreen
