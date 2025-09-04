// Script pour créer un utilisateur conducteur de test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Utiliser la SERVICE KEY pour pouvoir créer des utilisateurs
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_KEY'; // Remplacer par votre service key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDriverUser() {
  try {
    console.log('🚛 Création d\'un utilisateur conducteur...\n');
    
    // 1. Créer l'utilisateur d'authentification
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'conducteur.test@travelhub.cm',
      password: 'Conducteur123!',
      email_confirm: true,
      user_metadata: {
        nom: 'Conducteur',
        prenom: 'Jean',
        telephone: '+237696123456',
        role: 'agency_driver'
      }
    });

    if (authError) {
      console.error('❌ Erreur lors de la création de l\'utilisateur auth:', authError);
      return;
    }

    console.log('✅ Utilisateur d\'authentification créé!');
    console.log('📧 Email:', authData.user.email);
    console.log('🆔 ID:', authData.user.id);
    
    const userId = authData.user.id;

    // 2. Créer le profil utilisateur avec le rôle agency_driver
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'conducteur.test@travelhub.cm',
        full_name: 'Jean Conducteur',
        phone: '+237696123456',
        role: 'agency_driver',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erreur lors de la création du profil:', profileError);
      // Essayer de mettre à jour s'il existe déjà
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'agency_driver',
          full_name: 'Jean Conducteur',
          phone: '+237696123456',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour du profil:', updateError);
        return;
      }
      console.log('✅ Profil utilisateur mis à jour avec le rôle conducteur!');
    } else {
      console.log('✅ Profil utilisateur créé avec le rôle conducteur!');
    }

    // 3. Créer une agence pour ce conducteur
    const { data: agencyData, error: agencyError } = await supabase
      .from('agencies')
      .insert({
        user_id: userId,
        name: 'Transport Express',
        description: 'Agence de transport fiable et sécurisée',
        phone: '+237696123456',
        email: 'contact@transport-express.cm',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (agencyError) {
      console.log('⚠️ Agence existe peut-être déjà:', agencyError.message);
    } else {
      console.log('✅ Agence créée!');
      console.log('🏢 Nom:', agencyData.name);
      console.log('🆔 ID Agence:', agencyData.id);
    }

    // 4. Créer quelques trajets de test
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    const arrivalTime = new Date(tomorrow);
    arrivalTime.setHours(12, 0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(14, 0, 0, 0);
    
    const arrivalTime2 = new Date(dayAfter);
    arrivalTime2.setHours(18, 0, 0, 0);

    const trips = [
      {
        agency_id: agencyData?.id || null,
        driver_id: userId,
        departure_city: 'Douala',
        arrival_city: 'Yaoundé',
        departure_time: tomorrow.toISOString(),
        arrival_time: arrivalTime.toISOString(),
        price_fcfa: 5000,
        available_seats: 30,
        bus_type: 'vip',
        created_at: new Date().toISOString()
      },
      {
        agency_id: agencyData?.id || null,
        driver_id: userId,
        departure_city: 'Yaoundé',
        arrival_city: 'Bafoussam',
        departure_time: dayAfter.toISOString(),
        arrival_time: arrivalTime2.toISOString(),
        price_fcfa: 7500,
        available_seats: 25,
        bus_type: 'classique',
        created_at: new Date().toISOString()
      }
    ];

    for (const trip of trips) {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();

      if (tripError) {
        console.log('⚠️ Erreur lors de la création du trajet:', tripError.message);
      } else {
        console.log(`✅ Trajet créé: ${trip.departure_city} → ${trip.arrival_city}`);
        
        // Créer quelques réservations de test pour ce trajet
        const bookings = [
          {
            trip_id: tripData.id,
            user_id: userId, // Simulation - en réalité ce serait d'autres utilisateurs
            passenger_name: 'Marie Dupont',
            passenger_phone: '+237677123456',
            seat_number: 'A1',
            total_price_fcfa: trip.price_fcfa,
            booking_status: 'confirmed',
            payment_status: 'completed',
            booking_reference: `TH${Date.now()}${Math.floor(Math.random() * 100)}`,
            created_at: new Date().toISOString()
          },
          {
            trip_id: tripData.id,
            user_id: userId,
            passenger_name: 'Paul Martin',
            passenger_phone: '+237678987654',
            seat_number: 'B2',
            total_price_fcfa: trip.price_fcfa,
            booking_status: 'confirmed',
            payment_status: 'completed',
            booking_reference: `TH${Date.now()}${Math.floor(Math.random() * 100)}`,
            created_at: new Date().toISOString()
          }
        ];

        for (const booking of bookings) {
          const { error: bookingError } = await supabase
            .from('bookings')
            .insert(booking);

          if (bookingError) {
            console.log('⚠️ Erreur réservation:', bookingError.message);
          } else {
            console.log(`  📝 Réservation créée pour ${booking.passenger_name}`);
          }
        }
      }
    }

    console.log('\n🎉 Configuration terminée!');
    console.log('\n📋 Informations de connexion:');
    console.log('📧 Email: conducteur.test@travelhub.cm');
    console.log('🔒 Mot de passe: Conducteur123!');
    console.log('👤 Rôle: agency_driver');
    console.log('\n🚀 Vous pouvez maintenant vous connecter avec ces identifiants pour tester l\'interface conducteur!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

console.log(`
🚛 CRÉATION D'UTILISATEUR CONDUCTEUR - TRAVELHUB

Ce script va créer:
1. Un utilisateur d'authentification avec le rôle 'agency_driver'
2. Son profil dans la table users
3. Une agence associée
4. Quelques trajets de test avec des réservations

⚠️  IMPORTANT: 
Remplacez 'YOUR_SUPABASE_SERVICE_KEY' par votre vraie Service Key Supabase

🔑 Pour obtenir votre Service Key:
1. Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Copiez la "service_role" key
3. Remplacez-la dans ce script

`);

// Exécuter seulement si la service key est configurée
if (supabaseServiceKey !== 'YOUR_SUPABASE_SERVICE_KEY') {
  createDriverUser();
} else {
  console.log('❌ Veuillez d\'abord configurer votre SERVICE KEY Supabase dans le script.');
}
