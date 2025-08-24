import { tripService } from '../services/supabase';
import { busService } from '../services/busService';

// Script de test rapide pour vérifier les sièges
export const testSeatsData = async () => {
  try {
    console.log('🔍 Test des sièges - Début');
    
    // 1. Récupérer quelques trajets
    const trips = await tripService.searchTrips('Yaoundé', 'Douala', new Date());
    console.log(`Trajets trouvés: ${trips?.length || 0}`);
    
    if (trips && trips.length > 0) {
      const firstTrip = trips[0];
      console.log(`Premier trajet: ${firstTrip.id} - Type: ${firstTrip.bus_type}`);
      
      // 2. Tester la récupération des sièges
      try {
        const seatLayout = await busService.getVipSeatDisplayLayout(firstTrip.id);
        console.log(`Sièges trouvés: ${seatLayout.stats.totalSeats}`);
        console.log('Layout:', seatLayout.layout.length, 'rangées');
        
        if (seatLayout.layout.length > 0) {
          console.log('Première rangée:', seatLayout.layout[0]);
        }
      } catch (error) {
        console.error('Erreur lors du test des sièges:', error);
      }
    }
    
    console.log('✅ Test des sièges - Terminé');
  } catch (error) {
    console.error('❌ Erreur dans testSeatsData:', error);
  }
};

// Auto-exécution pour test
if (typeof window !== 'undefined') {
  // Disponible globalement pour test dans la console
  window.testSeatsData = testSeatsData;
}
