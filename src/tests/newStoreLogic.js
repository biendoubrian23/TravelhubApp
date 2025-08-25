// SECTION DE REMPLACEMENT COMPLÈTE POUR store/index.js
// Lignes ~350-420 à remplacer

// NOUVEAU CODE CORRECT (sans groupement):
const newLoadBookingsSection = `
          if (data && data.length > 0) {
            console.log('📋 Données brutes de Supabase:', data.length, 'réservations');
            
            // 🚫 SUPPRESSION DU GROUPEMENT - Chaque réservation reste séparée
            // Transformer chaque réservation individuellement (PAS de groupement)
            const transformedBookings = data.map((booking) => {
              const trip = booking.trips || {};
              const agency = trip.agencies || {};
              
              console.log('🔄 Transformation individuelle:', {
                bookingId: booking.id,
                bookingRef: booking.booking_reference,
                siege: booking.seat_number,
                prix: booking.total_price_fcfa,
                ville_depart: trip.ville_depart,
                ville_arrivee: trip.ville_arrivee
              });
              
              return {
                id: booking.id,
                departure: trip.ville_depart || 'Ville inconnue',
                arrival: trip.ville_arrivee || 'Ville inconnue', 
                date: trip.date || new Date().toISOString().split('T')[0],
                time: trip.heure_dep || '00:00',
                price: booking.total_price_fcfa || 0, // Prix individuel de la réservation
                status: booking.booking_status === 'confirmed' ? 'upcoming' : (booking.booking_status || 'pending'),
                busType: trip.bus_type || 'standard',
                agency: agency.nom || 'TravelHub',
                seatNumber: booking.seat_number || 'N/A', // UN SEUL siège
                seatNumbers: [booking.seat_number], // Array avec UN seul siège
                bookingDate: booking.created_at,
                bookingReference: booking.booking_reference,
                passengerName: booking.passenger_name || 'Nom non défini',
                passengerPhone: booking.passenger_phone || 'Non défini',
                paymentMethod: booking.payment_method || 'Non spécifié',
                paymentStatus: booking.payment_status || 'pending',
                // Informations du trajet pour affichage détaillé
                trip: trip,
                trip_id: booking.trip_id,
                supabaseId: booking.id, // ID de la BD
                syncedWithDB: true,
                multiSeat: false, // Toujours false maintenant - chaque réservation est individuelle
                allBookingIds: [booking.id] // Un seul ID par réservation
              };
            }).filter(booking => booking.id); // Filtrer les réservations sans ID
`;

console.log('✅ Section de remplacement préparée pour store/index.js');
console.log('🔧 Cette correction supprime le groupement des réservations');
console.log('📱 Résultat: Chaque réservation sera affichée séparément');

export { newLoadBookingsSection };
