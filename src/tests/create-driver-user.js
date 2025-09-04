import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Supabase avec la service key pour pouvoir créer des utilisateurs
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY'; // Remplacez par votre clé de service

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDriverUser() {
  try {
    console.log('🚗 Création d\'un utilisateur conducteur de test...\n');

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'conducteur.test@travelhub.com',
      password: 'TravelHub2025!', // Mot de passe fort
      email_confirm: true, // Confirmer l'email automatiquement
      user_metadata: {
        nom: 'Conducteur',
        prenom: 'Test',
        telephone: '+237690123456',
        role: 'agency_driver'
      }
    });

    if (authError) {
      if (authError.message.includes('User already registered')) {
        console.log('ℹ️  L\'utilisateur conducteur existe déjà. Mise à jour du profil...');
        
        // Récupérer l'utilisateur existant
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (usersError) {
          console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
          return;
        }
        
        const existingUser = users.users.find(u => u.email === 'conducteur.test@travelhub.com');
        if (!existingUser) {
          console.error('❌ Utilisateur introuvable après vérification');
          return;
        }
        
        console.log('✅ Utilisateur conducteur trouvé:', existingUser.email);
        console.log('🆔 ID:', existingUser.id);
        
        // Mettre à jour le profil dans la table users
        await updateUserProfile(existingUser.id);
        
      } else {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', authError.message);
        return;
      }
    } else {
      console.log('✅ Utilisateur conducteur créé avec succès!');
      console.log('📧 Email:', authData.user.email);
      console.log('🆔 ID:', authData.user.id);
      console.log('👤 Role:', authData.user.user_metadata?.role);
      
      // Mettre à jour le profil dans la table users
      await updateUserProfile(authData.user.id);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

async function updateUserProfile(userId) {
  try {
    console.log('\n🔄 Mise à jour du profil utilisateur...');
    
    // Insérer ou mettre à jour dans la table users
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: 'conducteur.test@travelhub.com',
        full_name: 'Test Conducteur',
        phone: '+237690123456',
        role: 'agency_driver',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erreur lors de la mise à jour du profil:', profileError.message);
    } else {
      console.log('✅ Profil conducteur mis à jour dans la table users');
      console.log('👤 Données:', profileData);
    }

    // Créer quelques trajets de test pour ce conducteur
    await createTestTrips(userId);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du profil:', error.message);
  }
}

async function createTestTrips(driverId) {
  try {
    console.log('\n🚌 Création de trajets de test...');
    
    // Récupérer une agence existante
    const { data: agencies, error: agenciesError } = await supabase
      .from('agencies')
      .select('id')
      .limit(1)
      .single();

    if (agenciesError || !agencies) {
      console.log('⚠️  Aucune agence trouvée, création d\'une agence test...');
      
      // Créer une agence test
      const { data: newAgency, error: newAgencyError } = await supabase
        .from('agencies')
        .insert({
          id: 'agency-test-001',
          user_id: driverId,
          name: 'Transport Test',
          description: 'Agence de test pour les conducteurs',
          phone: '+237690000000',
          email: 'test@transport.cm',
          address: 'Douala, Cameroun'
        })
        .select()
        .single();
      
      if (newAgencyError) {
        console.error('❌ Erreur création agence:', newAgencyError.message);
        return;
      }
      
      agencies = newAgency;
    }

    // Créer des trajets pour demain et après-demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 0, 0, 0);

    const testTrips = [
      {
        agency_id: agencies.id,
        driver_id: driverId,
        departure_city: 'Douala',
        arrival_city: 'Yaoundé',
        departure_time: tomorrow.toISOString(),
        arrival_time: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        price_fcfa: 5000,
        bus_type: 'VIP',
        available_seats: 45,
        total_seats: 50
      },
      {
        agency_id: agencies.id,
        driver_id: driverId,
        departure_city: 'Yaoundé',
        arrival_city: 'Bafoussam',
        departure_time: dayAfter.toISOString(),
        arrival_time: new Date(dayAfter.getTime() + 3 * 60 * 60 * 1000).toISOString(),
        price_fcfa: 4500,
        bus_type: 'Standard',
        available_seats: 35,
        total_seats: 40
      }
    ];

    const { data: tripsData, error: tripsError } = await supabase
      .from('trips')
      .insert(testTrips)
      .select();

    if (tripsError) {
      console.error('❌ Erreur création trajets:', tripsError.message);
    } else {
      console.log('✅ Trajets de test créés:', tripsData.length);
      
      // Créer quelques réservations de test
      await createTestBookings(tripsData);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des trajets:', error.message);
  }
}

async function createTestBookings(trips) {
  try {
    console.log('\n📋 Création de réservations de test...');
    
    // Récupérer un utilisateur client pour les réservations
    const { data: clients, error: clientsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'client')
      .limit(1)
      .single();

    let clientId = clients?.id;

    if (!clientId) {
      console.log('⚠️  Aucun client trouvé, création d\'un client test...');
      
      // Créer un client test
      const { data: authClient, error: authClientError } = await supabase.auth.admin.createUser({
        email: 'client.test@travelhub.com',
        password: 'TravelHub2025!',
        email_confirm: true,
        user_metadata: {
          nom: 'Test',
          prenom: 'Client',
          role: 'client'
        }
      });

      if (authClientError && !authClientError.message.includes('User already registered')) {
        console.error('❌ Erreur création client:', authClientError.message);
        return;
      }

      if (authClient?.user) {
        clientId = authClient.user.id;
        
        // Ajouter le profil client
        await supabase
          .from('users')
          .upsert({
            id: clientId,
            email: 'client.test@travelhub.com',
            full_name: 'Client Test',
            role: 'client'
          });
      }
    }

    if (!clientId) {
      console.log('⚠️  Impossible de créer/trouver un client pour les réservations');
      return;
    }

    // Créer des réservations pour le premier trajet
    const firstTrip = trips[0];
    const testBookings = [
      {
        user_id: clientId,
        trip_id: firstTrip.id,
        passenger_name: 'Jean Dupont',
        passenger_phone: '+237691234567',
        seat_number: 'A5',
        total_price_fcfa: 5000,
        payment_method: 'orange_money',
        payment_status: 'completed',
        booking_status: 'confirmed',
        booking_reference: `TH${Date.now()}001`
      },
      {
        user_id: clientId,
        trip_id: firstTrip.id,
        passenger_name: 'Marie Nguyen',
        passenger_phone: '+237692345678',
        seat_number: 'B8',
        total_price_fcfa: 5000,
        payment_method: 'stripe',
        payment_status: 'completed',
        booking_status: 'confirmed',
        booking_reference: `TH${Date.now()}002`
      }
    ];

    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .insert(testBookings)
      .select();

    if (bookingsError) {
      console.error('❌ Erreur création réservations:', bookingsError.message);
    } else {
      console.log('✅ Réservations de test créées:', bookingsData.length);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création des réservations:', error.message);
  }
}

console.log(`
🚗 CRÉATION D'UTILISATEUR CONDUCTEUR - TRAVELHUB

Ce script va créer un utilisateur de test avec le rôle 'agency_driver' pour tester
l'interface conducteur de l'application.

📋 Informations de l'utilisateur conducteur:
📧 Email: conducteur.test@travelhub.com
🔒 Mot de passe: TravelHub2025!
👤 Rôle: agency_driver
📝 Nom: Test Conducteur

⚠️  IMPORTANT: Remplacez 'YOUR_SUPABASE_SERVICE_KEY' par votre vraie clé de service Supabase !

Pour obtenir votre Service Key:
1. Allez sur https://supabase.com/dashboard/project/[votre-project-id]/settings/api
2. Dans la section "Project API keys", copiez la "service_role" key
3. Remplacez YOUR_SUPABASE_SERVICE_KEY dans ce script

`);

if (supabaseServiceKey !== 'YOUR_SUPABASE_SERVICE_KEY') {
  createDriverUser();
} else {
  console.log('❌ Veuillez d\'abord configurer votre SERVICE KEY Supabase dans le script.');
}
