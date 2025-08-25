// Script de débogage pour vérifier les réservations dans la base de données
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kddjgzqyaozfmlgfafjb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkZGpnenF5YW96Zm1sZ2ZhZmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MTk2NzQsImV4cCI6MjA1MDQ5NTY3NH0.DcyC7ePXMHKzpQUMhCLh8Mv40CJrfRKWE-D2zGtGKYA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugBookings() {
  try {
    console.log('🔍 Vérification des réservations dans la base de données...');
    
    // Récupérer toutes les réservations
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        total_price_fcfa,
        original_price,
        seat_number,
        user_id,
        trip_id,
        booking_status,
        payment_status,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Erreur lors de la récupération des réservations:', error);
      return;
    }

    console.log(`\n📊 ${bookings?.length || 0} réservations trouvées:`);
    
    if (bookings && bookings.length > 0) {
      bookings.forEach((booking, index) => {
        console.log(`\n--- Réservation ${index + 1} ---`);
        console.log(`ID: ${booking.id}`);
        console.log(`Référence: ${booking.booking_reference}`);
        console.log(`Prix total: ${booking.total_price_fcfa} FCFA`);
        console.log(`Prix original: ${booking.original_price} FCFA`);
        console.log(`Siège: ${booking.seat_number}`);
        console.log(`User ID: ${booking.user_id}`);
        console.log(`Trip ID: ${booking.trip_id}`);
        console.log(`Status réservation: ${booking.booking_status}`);
        console.log(`Status paiement: ${booking.payment_status}`);
        console.log(`Créé le: ${booking.created_at}`);
      });
    } else {
      console.log('Aucune réservation trouvée.');
    }

    // Vérifier aussi les trips pour les prix
    console.log('\n🚌 Vérification des prix des voyages...');
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, departure_city, arrival_city, price_fcfa, bus_type')
      .limit(5);

    if (tripsError) {
      console.error('❌ Erreur lors de la récupération des voyages:', tripsError);
      return;
    }

    if (trips && trips.length > 0) {
      trips.forEach((trip, index) => {
        console.log(`\n--- Voyage ${index + 1} ---`);
        console.log(`ID: ${trip.id}`);
        console.log(`Route: ${trip.departure_city} → ${trip.arrival_city}`);
        console.log(`Prix: ${trip.price_fcfa} FCFA`);
        console.log(`Type de bus: ${trip.bus_type}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

debugBookings();
