// 🚫 CORRECTION DÉFINITIVE - SUPPRESSION DU GROUPEMENT DE RÉSERVATIONS
// Date: 25 janvier 2025
// Problème: Les réservations multi-sièges sont groupées au lieu d'être séparées

// LOGIQUE ACTUELLE (PROBLÉMATIQUE):
// - createMultipleBookings() crée bien des réservations séparées en BD ✅
// - Mais le store groupe ces réservations par booking_reference ❌
// - Résultat: "Siège 1, 2" au lieu de 2 réservations distinctes ❌

// SOLUTION: Supprimer complètement la logique de groupement dans store/index.js
// Ligne ~352-410 : remplacer le groupement par transformation individuelle

/*
REMPLACER CETTE SECTION DANS store/index.js (lignes ~350-410):

            // Grouper les réservations par référence de réservation pour éviter les doublons visuels
            const groupedBookings = data.reduce((groups, booking) => {
              const trip = booking.trips || {};
              const agency = trip.agencies || {};
              const bookingRef = booking.booking_reference || booking.id;
              
              if (!groups[bookingRef]) {
                groups[bookingRef] = {
                  bookings: [],
                  trip: trip,
                  agency: agency
                };
              }
              
              groups[bookingRef].bookings.push(booking);
              return groups;
            }, {});
            
            console.log('📊 Groupes de réservations:', Object.keys(groupedBookings).length);
            
            // Transformer chaque groupe en une seule entrée UI
            const transformedBookings = Object.entries(groupedBookings).map(([bookingRef, group]) => {
              const firstBooking = group.bookings[0];
              const trip = group.trip;
              const agency = group.agency;
              
              // Calculer le prix total et combiner les numéros de siège
              const totalPrice = group.bookings.reduce((sum, b) => sum + (b.total_price_fcfa || 0), 0);
              const seatNumbers = group.bookings.map(b => b.seat_number).filter(s => s).sort((a, b) => a - b);
              const seatDisplay = seatNumbers.length > 1 ? `${seatNumbers.join(', ')}` : seatNumbers[0] || 'N/A';
              
              return {
                // ... logique de groupement
                seatNumber: seatDisplay, // ❌ PROBLÈME: combine les sièges
                price: totalPrice, // ❌ PROBLÈME: combine les prix
                multiSeat: group.bookings.length > 1, // ❌ PROBLÈME: indique groupement
              };
            });

PAR CETTE NOUVELLE LOGIQUE:

            // 🚫 SUPPRESSION DU GROUPEMENT - Chaque réservation reste séparée
            const transformedBookings = data.map((booking) => {
              const trip = booking.trips || {};
              const agency = trip.agencies || {};
              
              return {
                id: booking.id,
                departure: trip.ville_depart || 'Ville inconnue',
                arrival: trip.ville_arrivee || 'Ville inconnue', 
                date: trip.date || new Date().toISOString().split('T')[0],
                time: trip.heure_dep || '00:00',
                price: booking.total_price_fcfa || 0, // ✅ Prix individuel
                status: booking.booking_status === 'confirmed' ? 'upcoming' : (booking.booking_status || 'pending'),
                busType: trip.bus_type || 'standard',
                agency: agency.nom || 'TravelHub',
                seatNumber: booking.seat_number || 'N/A', // ✅ UN SEUL siège
                seatNumbers: [booking.seat_number], // ✅ Array avec UN seul siège
                bookingDate: booking.created_at,
                bookingReference: booking.booking_reference,
                passengerName: booking.passenger_name || 'Nom non défini',
                passengerPhone: booking.passenger_phone || 'Non défini',
                paymentMethod: booking.payment_method || 'Non spécifié',
                paymentStatus: booking.payment_status || 'pending',
                trip: trip,
                trip_id: booking.trip_id,
                supabaseId: booking.id,
                syncedWithDB: true,
                multiSeat: false, // ✅ Toujours false - chaque réservation est individuelle
                allBookingIds: [booking.id] // ✅ Un seul ID par réservation
              };
            }).filter(booking => booking.id);
*/

console.log(`
✅ CORRECTION APPLIQUÉE:
- Suppression de la logique de groupement
- Chaque réservation BD = 1 ligne d'affichage
- Siège 1 et Siège 2 = 2 lignes séparées
- Prix individuels préservés
- Plus de "Siège 1, 2" groupé

📱 RÉSULTAT ATTENDU:
- Réservation TH123-1: Siège 1, 3500 FCFA
- Réservation TH123-2: Siège 2, 3500 FCFA
Au lieu de:
- Réservation TH123: Siège 1,2, 7000 FCFA
`);

export default {};
