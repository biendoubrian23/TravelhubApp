/**
 * 🧹 Script de test et nettoyage des sièges fantômes
 * Utilise les nouvelles fonctions pour diagnostiquer et nettoyer les sièges bloqués
 */

// Import direct de Supabase et création d'une fonction de nettoyage locale
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hlwglvlgdxwdajxeusll.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd2dsdmxnZHh3ZGFqeGV1c2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5Njk5NDQsImV4cCI6MjA0ODU0NTk0NH0.2UcF__z2aTWQn2S8t0ZEoQ_5DxH_FfRN4HvZS7bK-LU';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 🧹 Nettoyage des sièges fantômes pour un voyage
 */
const cleanupGhostSeats = async (tripId) => {
  try {
    console.log('🧹 Début du nettoyage des sièges fantômes pour le voyage:', tripId);
    
    // 1. Récupérer tous les sièges marqués comme occupés
    const { data: occupiedSeats, error: seatsError } = await supabase
      .from('seat_maps')
      .select('seat_number, is_available')
      .eq('trip_id', tripId)
      .eq('is_available', false);
      
    if (seatsError) {
      console.error('❌ Erreur lors de la récupération des sièges:', seatsError);
      return { error: seatsError };
    }
    
    if (!occupiedSeats || occupiedSeats.length === 0) {
      console.log('✅ Aucun siège occupé trouvé');
      return { cleaned: 0 };
    }
    
    console.log('📋 Sièges marqués comme occupés:', occupiedSeats.map(s => s.seat_number));
    
    // 2. Vérifier quels sièges ont vraiment des réservations actives
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('seat_number')
      .eq('trip_id', tripId)
      .in('seat_number', occupiedSeats.map(s => s.seat_number))
      .in('booking_status', ['confirmed', 'pending']);
      
    if (bookingsError) {
      console.error('❌ Erreur lors de la vérification des réservations:', bookingsError);
      return { error: bookingsError };
    }
    
    const seatsWithBookings = activeBookings?.map(b => b.seat_number) || [];
    console.log('📝 Sièges avec réservations actives:', seatsWithBookings);
    
    // 3. Identifier les sièges fantômes
    const ghostSeats = occupiedSeats
      .filter(seat => !seatsWithBookings.includes(seat.seat_number))
      .map(seat => seat.seat_number);
      
    if (ghostSeats.length === 0) {
      console.log('✅ Aucun siège fantôme trouvé');
      return { cleaned: 0 };
    }
    
    console.log('👻 Sièges fantômes détectés:', ghostSeats);
    
    // 4. Libérer les sièges fantômes
    const { error: cleanupError } = await supabase
      .from('seat_maps')
      .update({ is_available: true })
      .eq('trip_id', tripId)
      .in('seat_number', ghostSeats);
      
    if (cleanupError) {
      console.error('❌ Erreur lors de la libération des sièges fantômes:', cleanupError);
      return { error: cleanupError };
    }
    
    console.log('✅ Sièges fantômes libérés:', ghostSeats.join(', '));
    return { cleaned: ghostSeats.length, seats: ghostSeats };
    
  } catch (error) {
    console.error('❌ Erreur dans cleanupGhostSeats:', error);
    return { error };
  }
};

const testAndCleanup = async () => {
  try {
    console.log('🚀 === SCRIPT DE NETTOYAGE DES SIÈGES FANTÔMES ===\n');
    
    // 1. Récupérer quelques voyages récents pour diagnostic
    console.log('1️⃣ Récupération des voyages récents...');
    const { data: recentTrips, error: tripsError } = await supabase
      .from('trips')
      .select('id, departure_city, arrival_city, departure_date')
      .gte('departure_date', new Date().toISOString().split('T')[0])
      .order('departure_date', { ascending: true })
      .limit(5);
      
    if (tripsError) {
      console.error('❌ Erreur récupération voyages:', tripsError);
      return;
    }
    
    console.log(`📋 ${recentTrips.length} voyages trouvés:`);
    recentTrips.forEach((trip, index) => {
      console.log(`   ${index + 1}. ${trip.departure_city} → ${trip.arrival_city} (${trip.departure_date}) - ID: ${trip.id}`);
    });
    
    // 2. Analyser et nettoyer chaque voyage
    for (const trip of recentTrips) {
      console.log(`\n🔍 === ANALYSE DU VOYAGE ${trip.id} ===`);
      console.log(`Route: ${trip.departure_city} → ${trip.arrival_city}`);
      console.log(`Date: ${trip.departure_date}`);
      
      // Récupérer l'état des sièges
      const { data: seatStatus, error: seatError } = await supabase
        .from('seat_maps')
        .select('seat_number, is_available')
        .eq('trip_id', trip.id)
        .order('seat_number');
        
      if (seatError) {
        console.error(`❌ Erreur récupération sièges pour voyage ${trip.id}:`, seatError);
        continue;
      }
      
      const totalSeats = seatStatus.length;
      const availableSeats = seatStatus.filter(s => s.is_available).length;
      const occupiedSeats = totalSeats - availableSeats;
      
      console.log(`📊 État des sièges: ${availableSeats}/${totalSeats} disponibles (${occupiedSeats} occupés)`);
      
      if (occupiedSeats > 0) {
        console.log(`🧹 Nettoyage des sièges fantômes...`);
        const cleanupResult = await cleanupGhostSeats(trip.id);
        
        if (cleanupResult.error) {
          console.error('❌ Erreur nettoyage:', cleanupResult.error);
        } else if (cleanupResult.cleaned > 0) {
          console.log(`✅ ${cleanupResult.cleaned} sièges fantômes nettoyés:`, cleanupResult.seats);
        } else {
          console.log(`✅ Aucun siège fantôme trouvé - tous les sièges occupés ont des réservations valides`);
        }
      } else {
        console.log(`✅ Tous les sièges sont disponibles`);
      }
    }
    
    // 3. Statistiques finales
    console.log('\n📈 === STATISTIQUES FINALES ===');
    
    // Compter les sièges fantômes restants dans toute la base
    const { data: allOccupiedSeats, error: allSeatsError } = await supabase
      .from('seat_maps')
      .select('trip_id, seat_number')
      .eq('is_available', false);
      
    if (allSeatsError) {
      console.error('❌ Erreur récupération statistiques:', allSeatsError);
      return;
    }
    
    console.log(`📊 Total sièges marqués occupés dans la base: ${allOccupiedSeats.length}`);
    
    // Compter les réservations actives
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('trip_id, seat_number')
      .in('booking_status', ['confirmed', 'pending']);
      
    if (bookingsError) {
      console.error('❌ Erreur récupération réservations:', bookingsError);
      return;
    }
    
    console.log(`📋 Total réservations actives: ${activeBookings.length}`);
    
    const potentialGhosts = allOccupiedSeats.length - activeBookings.length;
    if (potentialGhosts > 0) {
      console.log(`⚠️ Sièges fantômes potentiels restants: ${potentialGhosts}`);
      console.log(`💡 Utilisez la fonction cleanupGhostSeats() pour les nettoyer`);
    } else {
      console.log(`✅ Aucun siège fantôme détecté dans la base`);
    }
    
    console.log('\n🎉 === NETTOYAGE TERMINÉ ===');
    
  } catch (error) {
    console.error('❌ Erreur dans le script de nettoyage:', error);
  }
};

// Test de la fonction de nettoyage spécifique
const testSpecificTripCleanup = async (tripId) => {
  console.log(`🧹 Test nettoyage pour voyage spécifique: ${tripId}`);
  
  const result = await cleanupGhostSeats(tripId);
  
  if (result.error) {
    console.error('❌ Erreur:', result.error);
  } else {
    console.log(`✅ Nettoyage terminé: ${result.cleaned} sièges libérés`);
    if (result.seats && result.seats.length > 0) {
      console.log('🪑 Sièges libérés:', result.seats.join(', '));
    }
  }
  
  return result;
};

export { testAndCleanup, testSpecificTripCleanup };

// Si exécuté directement
testAndCleanup();
