// Script pour vérifier et corriger les problèmes d'association de conducteurs
const { supabase } = require('./src/services/supabase');

async function debugAndFixDriverAssignments() {
  console.log('🔍 Vérification des associations conducteurs-trajets...');
  
  // 1. Récupérer tous les trajets avec leurs conducteurs
  const { data: trips, error: tripError } = await supabase
    .from('trips')
    .select('id, departure_city, arrival_city, departure_time, driver_id')
    .order('departure_time', { ascending: false })
    .limit(50);
    
  if (tripError) {
    console.error('❌ Erreur lors de la récupération des trajets:', tripError);
    return;
  }
  
  console.log(`📋 ${trips.length} trajets récupérés`);
  
  // 2. Récupérer tous les conducteurs
  const { data: drivers, error: driverError } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('role', 'agency_driver');
  
  if (driverError) {
    console.error('❌ Erreur lors de la récupération des conducteurs:', driverError);
    return;
  }
  
  console.log(`👤 ${drivers.length} conducteurs trouvés`);
  
  // 3. Vérifier chaque trajet
  const tripsWithoutDriver = trips.filter(trip => !trip.driver_id);
  const tripsWithInvalidDriver = [];
  
  for (const trip of trips) {
    if (trip.driver_id) {
      const driver = drivers.find(d => d.id === trip.driver_id);
      if (!driver) {
        tripsWithInvalidDriver.push(trip);
      }
    }
  }
  
  console.log(`⚠️ ${tripsWithoutDriver.length} trajets sans conducteur assigné`);
  console.log(`❌ ${tripsWithInvalidDriver.length} trajets avec un driver_id invalide`);
  
  // 4. Montrer les détails des trajets problématiques
  if (tripsWithInvalidDriver.length > 0) {
    console.log('\n🚨 Trajets avec driver_id invalide:');
    tripsWithInvalidDriver.forEach(trip => {
      console.log(`- ID: ${trip.id}, Route: ${trip.departure_city} → ${trip.arrival_city}, Date: ${trip.departure_time.substring(0, 10)}, driver_id: ${trip.driver_id}`);
    });
  }
  
  // 5. Suggérer des corrections si des conducteurs sont disponibles
  if (drivers.length > 0 && (tripsWithoutDriver.length > 0 || tripsWithInvalidDriver.length > 0)) {
    console.log('\n💡 Suggestions de correction:');
    console.log('Exécutez les commandes SQL suivantes pour assigner des conducteurs:');
    
    [...tripsWithoutDriver, ...tripsWithInvalidDriver].slice(0, 10).forEach((trip, index) => {
      const driverIndex = index % drivers.length;
      console.log(`UPDATE trips SET driver_id = '${drivers[driverIndex].id}' WHERE id = '${trip.id}'; -- ${trip.departure_city} → ${trip.arrival_city}, ${drivers[driverIndex].full_name}`);
    });
  }
}

// Exécuter le script
debugAndFixDriverAssignments()
  .then(() => {
    console.log('✅ Analyse terminée');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err);
    process.exit(1);
  });
