// SAUVEGARDE ET RESTAURATION DU STORE
// Le fichier store/index.js actuel est dans un état corrompu
// Créons un script de réparation

import { readFileSync, writeFileSync } from 'fs';

const storePath = 'c:/TravelHub/src/store/index.js';

// Lire le fichier actuel pour voir les dégâts
console.log('📁 Lecture du fichier store actuel...');

// Script de réparation - remplacer la section problématique
const repairScript = `
// ÉTAPES DE RÉPARATION:
// 1. Faire une copie de sauvegarde du store
// 2. Identifier les lignes corrompues (~350-420)  
// 3. Remplacer la logique de groupement par transformation individuelle
// 4. Tester que les réservations s'affichent séparément

// LOGIQUE CORRECTE À IMPLÉMENTER:
/*
  loadBookings: async (user) => {
    set({ isLoading: true })
    try {
      if (user?.id) {
        const data = await bookingService.getUserBookings(user.id)
        
        if (data && data.length > 0) {
          // TRANSFORMATION INDIVIDUELLE (sans groupement)
          const transformedBookings = data.map((booking) => {
            const trip = booking.trips || {};
            const agency = trip.agencies || {};
            
            return {
              id: booking.id,
              departure: trip.ville_depart || 'Ville inconnue',
              arrival: trip.ville_arrivee || 'Ville inconnue',
              price: booking.total_price_fcfa || 0, // Prix individuel
              seatNumber: booking.seat_number || 'N/A', // UN siège
              seatNumbers: [booking.seat_number], // Array avec UN siège
              bookingReference: booking.booking_reference,
              // ... autres propriétés
              multiSeat: false, // Toujours false
              allBookingIds: [booking.id] // Un seul ID
            };
          });
          
          set({ bookings: transformedBookings, isLoading: false });
        }
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
      set({ isLoading: false });
    }
  }
*/

console.log('🔧 Script de réparation prêt');
`;

console.log(repairScript);

export default {};
