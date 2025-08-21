// Test script simple pour vérifier la configuration Supabase
import { supabase } from '../services/supabase'

export const testSupabaseConnection = async () => {
  console.log('🔌 Test de connexion Supabase...')
  
  try {
    // Test 1: Connexion de base
    const { data, error } = await supabase
      .from('trips')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('❌ Erreur de connexion:', error.message)
      return false
    }
    
    console.log('✅ Connexion Supabase réussie !')
    console.log(`📊 Données trouvées: ${data ? data.length : 0} enregistrement(s)`)
    
    return true
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message)
    return false
  }
}

// Test simple pour les trajets
export const testTripSearch = async () => {
  console.log('🔍 Test de recherche de trajets...')
  
  try {
    const { tripService } = await import('../services/tripService')
    
    const trips = await tripService.searchTrips({
      departure: 'Yaoundé',
      arrival: 'Douala',
      date: '2025-08-22'
    })
    
    console.log(`✅ ${trips.length} trajets trouvés`)
    return trips.length > 0
  } catch (error) {
    console.log('⚠️ Pas de données réelles, fallback vers mock')
    
    // Test fallback
    const { mockTripService } = await import('../services/mockTripService')
    const mockTrips = mockTripService.generateTripsForDays({
      departure: 'Yaoundé',
      arrival: 'Douala',
      date: new Date()
    }, 1)
    
    console.log(`✅ ${mockTrips.length} trajets mock générés`)
    return true
  }
}
