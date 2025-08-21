// Script de test pour les nouveaux services de données réelles
import { tripService, busService, bookingService } from '../services'

export const testRealDataServices = async () => {
  console.log('🧪 Test des services de données réelles...')
  
  try {
    // Test 1: Recherche de trajets
    console.log('\n📍 Test 1: Recherche de trajets')
    const searchParams = {
      departure: 'Yaoundé',
      arrival: 'Douala',
      date: '2025-08-22'
    }
    
    const trips = await tripService.searchTrips(searchParams)
    console.log(`✅ ${trips.length} trajets trouvés pour ${searchParams.departure} → ${searchParams.arrival}`)
    
    if (trips.length > 0) {
      const firstTrip = trips[0]
      console.log(`   Premier trajet: ${firstTrip.agencies?.nom} - ${firstTrip.heure_dep} - ${firstTrip.prix} FCFA`)
      console.log(`   VIP: ${firstTrip.is_vip ? 'Oui' : 'Non'} - Sièges disponibles: ${firstTrip.available_seats}/${firstTrip.total_seats}`)
      
      // Test 2: Détails du trajet
      if (firstTrip.id) {
        console.log('\n🔍 Test 2: Détails du trajet')
        const tripDetails = await tripService.getTripDetails(firstTrip.id)
        console.log(`✅ Détails récupérés pour le trajet ${tripDetails.id}`)
        console.log(`   Bus: ${tripDetails.buses?.name} (${tripDetails.buses?.license_plate})`)
        console.log(`   Agence: ${tripDetails.agencies?.nom}`)
        
        // Test 3: Configuration des sièges (si bus VIP)
        if (firstTrip.is_vip && firstTrip.bus_info?.id) {
          console.log('\n💺 Test 3: Configuration des sièges')
          const seatConfig = await busService.getSeatConfiguration(firstTrip.bus_info.id)
          console.log(`✅ Configuration des sièges récupérée: ${seatConfig.length} sièges`)
          
          if (seatConfig.length > 0) {
            const vipSeats = seatConfig.filter(seat => seat.is_vip)
            const windowSeats = seatConfig.filter(seat => seat.seat_type === 'window')
            console.log(`   Sièges VIP: ${vipSeats.length}, Sièges fenêtre: ${windowSeats.length}`)
          }
          
          // Test 4: Sièges disponibles pour le trajet
          console.log('\n🎫 Test 4: Sièges disponibles pour le trajet')
          const availableSeats = await busService.getAvailableSeatsForTrip(firstTrip.id, firstTrip.bus_info.id)
          const freeSeats = availableSeats.filter(seat => seat.is_available)
          const occupiedSeats = availableSeats.filter(seat => seat.is_occupied)
          console.log(`✅ ${freeSeats.length} sièges libres, ${occupiedSeats.length} sièges occupés`)
        }
        
        // Test 5: Sièges occupés
        console.log('\n🚫 Test 5: Sièges occupés')
        const occupiedSeatNumbers = await tripService.getOccupiedSeats(firstTrip.id)
        console.log(`✅ ${occupiedSeatNumbers.length} sièges occupés: [${occupiedSeatNumbers.join(', ')}]`)
      }
    }
    
    // Test 6: Trajets populaires
    console.log('\n⭐ Test 6: Trajets populaires')
    const popularTrips = await tripService.getPopularTrips(5)
    console.log(`✅ ${popularTrips.length} trajets populaires récupérés`)
    popularTrips.forEach((trip, index) => {
      console.log(`   ${index + 1}. ${trip.departure_city} → ${trip.arrival_city} (${trip.agencies?.nom})`)
    })
    
    console.log('\n🎉 Tous les tests ont réussi !')
    return true
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error)
    console.log('\n⚠️  La base de données doit être peuplée avec des trajets pour que l\'application fonctionne.')
    console.log('   Vérifiez votre connexion Supabase et assurez-vous que des trajets existent.')
    return false
  }
}

// Fonction principale de test (sans fallback mocké)
export const runAllTests = async () => {
  console.log('🚀 Démarrage des tests de la base de données...\n')
  
  const realDataWorking = await testRealDataServices()
  
  console.log('\n📊 Résumé des tests:')
  console.log(`   Base de données: ${realDataWorking ? '✅ OK' : '❌ Erreur'}`)
  
  if (!realDataWorking) {
    console.log('\n❌ L\'application nécessite une base de données fonctionnelle avec des trajets.')
    console.log('   Veuillez peupler votre base Supabase avec des données.')
  } else {
    console.log('\n✨ L\'application est prête à fonctionner avec les données réelles !')
  }
  
  return { realDataWorking }
}

// Pour utiliser dans un écran de test
export default {
  testRealDataServices,
  runAllTests
}
