// Test rapide pour vérifier la fonction getMinimumPriceForDate
// Exécuter ce fichier avec : node src/tests/test-price-calendar.js

const { tripService } = require('../services/tripService');

async function testPriceCalendar() {
  try {
    console.log('=== TEST: Prix minimum par date ===');
    
    // Test avec des dates d'exemple
    const departure = 'Yaoundé';
    const arrival = 'Douala';
    const testDates = [
      new Date('2025-08-25'),
      new Date('2025-08-26'),
      new Date('2025-08-27')
    ];
    
    console.log(`Recherche des prix pour ${departure} → ${arrival}`);
    console.log('Dates testées:', testDates.map(d => d.toDateString()));
    
    // Test de la fonction individuelle
    for (const date of testDates) {
      const price = await tripService.getMinimumPriceForDate(departure, arrival, date);
      console.log(`${date.toDateString()}: ${price ? price + ' FCFA' : 'Aucun trajet disponible'}`);
    }
    
    console.log('\n=== TEST: Prix multiples en parallèle ===');
    
    // Test de la fonction optimisée
    const datesPrices = await tripService.getMinimumPricesForDates(departure, arrival, testDates);
    
    console.log('Résultat dans le carrousel :');
    datesPrices.forEach(({ date, price }) => {
      if (price) {
        console.log(`📅 ${date.toDateString()}: "dès ${price} FCFA"`);
      } else {
        console.log(`📅 ${date.toDateString()}: "Aucun trajet" (désactivé)`);
      }
    });
    
    console.log('\n✅ Tests terminés');
  } catch (error) {
    console.error('❌ Erreur pendant les tests:', error);
  }
}

// Exécuter le test si ce fichier est lancé directement
if (require.main === module) {
  testPriceCalendar();
}

module.exports = { testPriceCalendar };
