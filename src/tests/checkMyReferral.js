#!/usr/bin/env node

// SCRIPT RAPIDE - Vérifier et corriger un parrainage spécifique
// Usage: node src/tests/checkMyReferral.js

const { supabase } = require('../services/supabase');

const checkAndFixMyReferral = async () => {
  console.log('🔍 VÉRIFICATION DE VOTRE PARRAINAGE');
  console.log('='.repeat(40));

  try {
    // 1. Lister tous les parrainages récents
    const { data: allReferrals, error: allError } = await supabase
      .from('referrals')
      .select(`
        id,
        status,
        created_at,
        completed_at,
        referrer:users!referrals_referrer_id_fkey (
          full_name,
          email
        ),
        referred:users!referrals_referred_id_fkey (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Erreur:', allError);
      return;
    }

    console.log(`📋 ${allReferrals.length} parrainages trouvés:`);
    allReferrals.forEach((ref, index) => {
      console.log(`\n${index + 1}. ${ref.status.toUpperCase()}`);
      console.log(`   Parrain: ${ref.referrer?.email} (${ref.referrer?.full_name})`);
      console.log(`   Filleul: ${ref.referred?.email} (${ref.referred?.full_name})`);
      console.log(`   Créé: ${new Date(ref.created_at).toLocaleString()}`);
      if (ref.completed_at) {
        console.log(`   Complété: ${new Date(ref.completed_at).toLocaleString()}`);
      }
    });

    // 2. Vérifier les réservations pour chaque filleul avec parrainage pending
    const pendingReferrals = allReferrals.filter(r => r.status === 'pending');
    
    if (pendingReferrals.length === 0) {
      console.log('\n✅ Aucun parrainage en attente - tout semble correct!');
      return;
    }

    console.log(`\n🔧 ${pendingReferrals.length} parrainage(s) en attente à vérifier:`);

    for (const referral of pendingReferrals) {
      console.log(`\n📊 Vérification: ${referral.referred?.email}`);
      
      // Vérifier les réservations du filleul
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, created_at, booking_status, total_price_fcfa')
        .eq('user_id', referral.referred.id);

      if (bookingsError) {
        console.error('   ❌ Erreur réservations:', bookingsError);
        continue;
      }

      const bookingCount = bookings ? bookings.length : 0;
      console.log(`   📈 Réservations trouvées: ${bookingCount}`);

      if (bookingCount > 0) {
        console.log('   🎯 CORRECTION NÉCESSAIRE!');
        
        // Afficher les réservations
        bookings.forEach((booking, i) => {
          console.log(`     ${i + 1}. ${booking.booking_status} - ${booking.total_price_fcfa} FCFA`);
          console.log(`        ${new Date(booking.created_at).toLocaleString()}`);
        });

        // Demander confirmation avant correction
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question(`   ❓ Corriger ce parrainage? (y/N): `, resolve);
        });
        rl.close();

        if (answer.toLowerCase() === 'y') {
          console.log('   🔧 Correction en cours...');

          // Créer la récompense
          const { data: reward, error: rewardError } = await supabase
            .from('referral_rewards')
            .insert({
              referral_id: referral.id,
              referrer_id: referral.referrer.id,
              reward_amount: 500,
              is_claimed: false,
              expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (rewardError) {
            console.error('   ❌ Erreur création récompense:', rewardError);
            continue;
          }

          // Mettre à jour le statut
          await supabase
            .from('referrals')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString(),
              first_booking_id: bookings[0].id
            })
            .eq('id', referral.id);

          // Mettre à jour les stats du parrain
          const { data: currentUser, error: getUserError } = await supabase
            .from('users')
            .select('total_referrals, total_referral_earnings')
            .eq('id', referral.referrer.id)
            .single();

          if (!getUserError && currentUser) {
            await supabase
              .from('users')
              .update({
                total_referrals: (currentUser.total_referrals || 0) + 1,
                total_referral_earnings: (currentUser.total_referral_earnings || 0) + 500
              })
              .eq('id', referral.referrer.id);
          }

          console.log('   ✅ CORRECTION TERMINÉE!');
          console.log(`   🎁 Récompense de 500 FCFA créée pour ${referral.referrer?.email}`);
        } else {
          console.log('   ⏭️ Ignoré');
        }
      } else {
        console.log('   ⏳ Aucune réservation - parrainage reste pending');
      }
    }

    console.log('\n✅ Vérification terminée!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
};

// Exécuter le script
if (require.main === module) {
  checkAndFixMyReferral().then(() => {
    process.exit(0);
  });
}

module.exports = { checkAndFixMyReferral };
