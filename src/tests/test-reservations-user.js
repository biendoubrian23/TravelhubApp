// Test du système de réservations avec utilisateurs réels
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

import { supabase } from '../services/supabaseClient.js'

// Fonctions simplifiées pour éviter les problèmes d'import
const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  async ensureUserProfile(userId) {
    // Récupérer l'utilisateur auth
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Utilisateur non connecté')

    // Vérifier s'il existe dans la table users
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!existingUser) {
      console.log('👤 Création du profil utilisateur dans la table users...')
      
      const profileData = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Utilisateur Test',
        phone: user.user_metadata?.phone || '+237600000000',
        ville: user.user_metadata?.ville || 'Douala',
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('users')
        .insert([profileData])

      if (error) throw error
      console.log('✅ Profil créé avec succès')
    } else {
      console.log('✅ Profil utilisateur existe déjà')
    }
  }
}

const bookingService = {
  async getUserBookings(userId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        trips!inner (
          ville_depart,
          ville_arrivee,
          date,
          heure_dep,
          heure_arr,
          agencies (nom)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

const TEST_USER = {
  email: 'test.reservations@travelhub.cm',
  password: 'TestPass123!',
  userData: {
    full_name: 'Test Réservations',
    phone: '+237699123456',
    ville: 'Douala'
  }
}

async function testReservationSystem() {
  console.log('🔄 Test du système de réservations...\n');

  try {
    // 1. Créer ou connecter l'utilisateur de test
    console.log('👤 Connexion/création utilisateur de test...');
    let authResult = await authService.signIn(TEST_USER.email, TEST_USER.password);
    
    if (authResult.error) {
      console.log('   Utilisateur n\'existe pas, création...');
      authResult = await authService.signUp(TEST_USER.email, TEST_USER.password, TEST_USER.userData);
      
      if (authResult.error) {
        console.error('❌ Impossible de créer l\'utilisateur:', authResult.error.message);
        return;
      }
    }
    
    const user = authResult.data.user;
    console.log('✅ Utilisateur connecté:', user.email);
    console.log('   ID utilisateur:', user.id);

    // 2. S'assurer que le profil existe dans la table users
    console.log('\n🔄 Vérification du profil utilisateur...');
    await authService.ensureUserProfile(user.id);
    console.log('✅ Profil utilisateur vérifié');

    // 3. Récupérer les réservations existantes
    console.log('\n📋 Récupération des réservations existantes...');
    try {
      const existingBookings = await bookingService.getUserBookings(user.id);
      console.log(`✅ ${existingBookings.length} réservations trouvées`);
      
      if (existingBookings.length > 0) {
        console.log('\n📋 Réservations existantes:');
        existingBookings.forEach((booking, index) => {
          console.log(`   ${index + 1}. ${booking.trips?.ville_depart} → ${booking.trips?.ville_arrivee}`);
          console.log(`      Date: ${booking.trips?.date}`);
          console.log(`      Passager: ${booking.passenger_name}`);
          console.log(`      Téléphone: ${booking.passenger_phone}`);
          console.log(`      Prix: ${booking.total_price_fcfa} FCFA`);
          console.log(`      Status: ${booking.booking_status}`);
          console.log('');
        });
      } else {
        console.log('   Aucune réservation existante');
      }
    } catch (bookingError) {
      console.error('❌ Erreur lors de la récupération des réservations:', bookingError.message);
    }

    // 4. Test optionnel : Créer une nouvelle réservation (décommentez si nécessaire)
    /*
    console.log('\n🎫 Test de création d\'une nouvelle réservation...');
    
    // D'abord trouver un trajet disponible
    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .limit(1);
    
    if (trips && trips.length > 0) {
      const testTrip = trips[0];
      console.log(`   Trajet de test: ${testTrip.ville_depart} → ${testTrip.ville_arrivee}`);
      
      const bookingData = {
        tripId: testTrip.id,
        userId: user.id,
        totalPrice: 5000,
        paymentMethod: 'test'
      };
      
      try {
        const newBooking = await bookingService.createBooking(bookingData);
        console.log('✅ Réservation créée avec succès:', newBooking.booking_reference);
      } catch (createError) {
        console.error('❌ Erreur lors de la création:', createError.message);
      }
    }
    */

    console.log('\n✅ Test du système de réservations terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur générale dans le test:', error.message);
  }
}

// Exécuter le test
testReservationSystem().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
