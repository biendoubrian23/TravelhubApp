import { bookingService } from '../services/bookingService';
import { supabase } from '../services/supabase';

// Service pour créer des données de test uniquement quand nécessaire
export const testDataService = {
  // Créer des données de test pour l'utilisateur connecté
  async createTestDataForUser(userId) {
    try {
      console.log('🧪 Création de données de test pour utilisateur:', userId);
      
      // Vérifier si l'utilisateur a déjà des réservations
      const existingBookings = await bookingService.getUserBookings(userId);
      if (existingBookings && existingBookings.length > 0) {
        console.log('✅ L\'utilisateur a déjà des réservations, pas de création de test');
        return existingBookings;
      }
      
      // Récupérer un trajet existant dans la BD pour créer une vraie réservation de test
      const { data: testTrip, error: tripError } = await supabase
        .from('trips')
        .select('id, ville_depart, ville_arrivee, prix, is_vip')
        .limit(1)
        .single();
        
      if (tripError || !testTrip) {
        console.warn('❌ Aucun trajet trouvé pour créer des données de test');
        return [];
      }
      
      console.log('🚌 Trajet de test trouvé:', testTrip);
      
      // Créer une réservation de test avec un vrai trajet
      const testBookingData = {
        tripId: testTrip.id,
        userId: userId,
        seatNumber: '1A', // Siège de test
        totalPrice: testTrip.prix,
        paymentMethod: 'Orange Money'
      };
      
      console.log('📝 Création de réservation de test:', testBookingData);
      
      const testBooking = await bookingService.createBooking(testBookingData);
      
      if (testBooking) {
        console.log('✅ Réservation de test créée avec succès:', testBooking);
        return [testBooking];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la création de données de test:', error);
      return [];
    }
  },
  
  // Nettoyer les données de test (optionnel)
  async cleanTestData(userId) {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', userId)
        .like('booking_reference', 'TH%'); // Supprimer uniquement les réservations avec référence TH
        
      if (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
      } else {
        console.log('🧹 Données de test nettoyées');
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
    }
  },
  
  // Vérifier la disponibilité des sièges pour un trajet
  async checkSeatAvailability(tripId) {
    try {
      const { data: seats, error } = await supabase
        .from('seat_maps')
        .select('seat_number, is_available, seat_type')
        .eq('trip_id', tripId)
        .eq('is_available', true)
        .limit(10);
        
      if (error) {
        console.error('❌ Erreur vérification sièges:', error);
        return [];
      }
      
      console.log(`💺 ${seats?.length || 0} sièges disponibles pour le trajet ${tripId}`);
      return seats || [];
    } catch (error) {
      console.error('❌ Erreur vérification sièges:', error);
      return [];
    }
  }
};
