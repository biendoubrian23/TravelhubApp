import { tripService } from './tripService'
import { mockTripService } from './mockTripService'

export const hybridTripService = {
  // Service intelligent qui essaie les données réelles puis fallback vers mock
  async searchTrips(searchParams) {
    try {
      console.log('🔍 Tentative de recherche avec données réelles...')
      
      // Essayer d'abord avec les données réelles
      const realTrips = await tripService.searchTrips(searchParams)
      
      if (realTrips && realTrips.length > 0) {
        console.log(`✅ ${realTrips.length} trajets réels trouvés`)
        return realTrips
      } else {
        console.log('⚠️ Aucun trajet réel trouvé, utilisation du fallback')
        // Fallback vers les données mockées
        return this.getMockTrips(searchParams)
      }
    } catch (error) {
      console.log('❌ Erreur avec données réelles, utilisation du fallback:', error.message)
      // Fallback vers les données mockées
      return this.getMockTrips(searchParams)
    }
  },

  // Générer des données mockées avec le bon format
  getMockTrips(searchParams) {
    try {
      const mockTrips = mockTripService.generateTripsForDays(searchParams, 5)
      console.log(`🎭 ${mockTrips.length} trajets mockés générés`)
      return mockTrips
    } catch (error) {
      console.error('❌ Erreur même avec les données mockées:', error)
      return []
    }
  },

  // Vérifier la disponibilité des données réelles
  async checkRealDataAvailability() {
    try {
      const testResult = await tripService.getPopularTrips(1)
      return testResult && testResult.length > 0
    } catch (error) {
      return false
    }
  },

  // Obtenir des statistiques sur la source de données
  async getDataSourceInfo() {
    const hasRealData = await this.checkRealDataAvailability()
    
    return {
      hasRealData,
      dataSource: hasRealData ? 'database' : 'mock',
      message: hasRealData 
        ? 'Données en temps réel depuis la base de données'
        : 'Données de démonstration (base de données vide ou inaccessible)'
    }
  }
}
