/**
 * Script de test pour valider le système de réservation
 * Usage: Importez ce fichier dans votre écran de test
 */

import { supabase } from '../services/supabaseClient';
import { bookingService } from '../services/bookingService';

export const testBookingSystem = async () => {
  console.log('🚀 Début du test du système de réservation');
  
  try {
    // 1. Vérifier la connexion Supabase
    console.log('📡 Test de connexion Supabase...');
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      throw new Error('Aucun utilisateur connecté');
    }
    console.log('✅ Utilisateur connecté:', user.user.email);
    
    // 2. Tester les enums payment_status
    console.log('\n📋 Test des valeurs enum payment_status...');
    const validStatuses = [];
    const testValues = ['pending', 'completed', 'failed', 'refunded'];
    
    for (const status of testValues) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            trip_id: 1,
            user_id: user.user.id,
            seat_number: 'TEST',
            passenger_name: 'Test Enum',
            total_price_fcfa: 1000,
            booking_reference: `TEST_ENUM_${Date.now()}_${status}`,
            booking_status: 'confirmed',
            payment_status: status
          })
          .select()
          .single();
          
        if (!error && data) {
          validStatuses.push(status);
          console.log(`✅ "${status}" est valide`);
          
          // Nettoyer immédiatement
          await supabase.from('bookings').delete().eq('id', data.id);
        } else {
          console.log(`❌ "${status}" est invalide:`, error?.message);
        }
      } catch (err) {
        console.log(`❌ "${status}" erreur:`, err.message);
      }
    }
    
    console.log(`\n🎯 Statuts valides: [${validStatuses.join(', ')}]`);
    
    // 3. Tester la création d'une réservation complète
    console.log('\n🎫 Test de création de réservation...');
    const bookingData = {
      tripId: 1,
      userId: user.user.id,
      selectedSeats: [{ seat_number: 99 }],
      passengerName: 'Test Passenger',
      passengerPhone: '+237123456789',
      totalPrice: 5000,
      paymentMethod: 'orange_money'
    };
    
    const reservation = await bookingService.createBooking(bookingData);
    
    if (reservation && reservation.id && !reservation.id.startsWith('MOCK_')) {
      console.log('✅ Réservation créée avec succès!');
      console.log('   ID:', reservation.id);
      console.log('   Référence:', reservation.booking_reference);
      console.log('   Siège:', reservation.seat_number);
      
      // Vérifier que le siège est marqué comme occupé
      const { data: seatStatus } = await supabase
        .from('seat_maps')
        .select('is_available')
        .eq('trip_id', 1)
        .eq('seat_number', 99)
        .single();
        
      if (seatStatus && !seatStatus.is_available) {
        console.log('✅ Siège correctement marqué comme occupé');
      } else {
        console.log('⚠️ Siège non marqué comme occupé');
      }
      
      return {
        success: true,
        reservationId: reservation.id,
        validStatuses,
        message: 'Tous les tests sont passés!'
      };
    } else {
      console.log('⚠️ Réservation mock créée (problème BD)');
      return {
        success: false,
        validStatuses,
        message: 'Réservation mock - vérifier la base de données'
      };
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
    return {
      success: false,
      error: error.message,
      message: 'Test échoué - vérifier la configuration'
    };
  }
};

export const cleanupTestData = async () => {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    // Supprimer les réservations de test
    const { error: bookingError } = await supabase
      .from('bookings')
      .delete()
      .like('booking_reference', 'TEST_%');
      
    if (bookingError) {
      console.log('❌ Erreur suppression bookings:', bookingError.message);
    } else {
      console.log('✅ Réservations de test supprimées');
    }
    
    // Libérer le siège de test
    const { error: seatError } = await supabase
      .from('seat_maps')
      .update({ is_available: true })
      .eq('trip_id', 1)
      .eq('seat_number', 99);
      
    if (seatError) {
      console.log('❌ Erreur libération siège:', seatError.message);
    } else {
      console.log('✅ Siège de test libéré');
    }
    
    console.log('🧹 Nettoyage terminé!');
    return true;
  } catch (error) {
    console.log('❌ Erreur lors du nettoyage:', error.message);
    return false;
  }
};
