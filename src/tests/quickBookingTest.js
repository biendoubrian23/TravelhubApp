import { bookingService } from '../services/bookingService';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/supabase';

// Test rapide pour vérifier si le problème persiste
export const quickBookingTest = async () => {
  try {
    console.log('🧪 TEST RAPIDE - Début');
    
    // 1. Vérifier la connexion Supabase
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Utilisateur:', user?.email || 'Non connecté');
    
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' };
    }
    
    // 2. Vérifier/récupérer le profil utilisateur
    console.log('📋 Vérification du profil utilisateur...');
    const { data: profile, error: profileError } = await authService.getUserProfile(user.id);
    
    if (profile) {
      console.log('✅ Profil utilisateur trouvé:', {
        nom: profile.full_name,
        téléphone: profile.phone,
        ville: profile.ville,
        email: profile.email
      });
    } else {
      console.log('⚠️ Profil utilisateur manquant, tentative de création...');
      await authService.ensureUserProfile(user.id);
    }
    
    // 3. Données de test simples
    const testData = {
      tripId: '5f546f00-833a-4e7a-a675-b37f4de9696e', // Utilise l'ID du log
      userId: user.id,
      seatNumber: '12', // Siège simple
      totalPrice: 5500,
      paymentMethod: 'Orange Money'
    };
    
    console.log('📝 Données de test:', testData);
    
    // 4. Tester la création
    const result = await bookingService.createBooking(testData);
    
    console.log('📊 Résultat:', result);
    
    if (result && result.id && !result.id.startsWith('MOCK_')) {
      console.log('✅ TEST RÉUSSI - Réservation créée en BD');
      console.log('👤 Nom passager:', result.passenger_name);
      console.log('📞 Téléphone passager:', result.passenger_phone);
      console.log('🏙️ Ville passager:', result.passenger_city);
      return { 
        success: true, 
        reservationId: result.id,
        passengerInfo: {
          name: result.passenger_name,
          phone: result.passenger_phone,
          city: result.passenger_city
        }
      };
    } else if (result && result.id && result.id.startsWith('MOCK_')) {
      console.log('⚠️ TEST PARTIEL - Réservation mock créée (problème BD)');
      return { success: false, error: 'Insertion BD échouée, mock créé' };
    } else {
      console.log('❌ TEST ÉCHOUÉ - Aucun résultat');
      return { success: false, error: 'Aucun résultat retourné' };
    }
    
  } catch (error) {
    console.error('❌ ERREUR TEST:', error);
    return { success: false, error: error.message };
  }
};

// Nettoyer après test
export const cleanupQuickTest = async () => {
  try {
    await supabase.from('bookings').delete().like('passenger_name', 'Test User');
    await supabase.from('seat_maps').update({ is_available: true }).eq('trip_id', '5f546f00-833a-4e7a-a675-b37f4de9696e').in('seat_number', ['10', '12']);
    console.log('🧹 Nettoyage terminé');
  } catch (error) {
    console.error('Erreur nettoyage:', error);
  }
};
